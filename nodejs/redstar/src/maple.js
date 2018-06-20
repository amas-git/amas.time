const minimatch = require("minimatch")

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 * HISTORY:
 *  1. 2018.06.18: Finished Core Design
 * @param text
 */
function error(text) {
    console.error(text);
}

function E(template) {
    return eval('`' + template.replace(/`/g, '\\`') + '`');
}

function isIterable(o) {
    return o == null ? false : typeof o[Symbol.iterator] === 'function';
}

function mkTemplateStrings(env, template) {
    function transId(xs) {
        return xs;
    }
    let $ = env.context;
    let T = template.replace(/`/g, '\\`');
    let argv = env.__context.argv;
    let $func = env.functions;

    if(Array.isArray($)) {
        return eval(`\`${T}\``);
    } else {
        let keys = transId(Object.keys($));
        return eval(`let {${keys.join(",")}} = $; \`${T}\``);
    }
}

function mkTemplate(context, template) {

}


function mktree(xs, root={level:0, id:"root", nodes:[]}, level="level", child='nodes') {
    function parentOf(xs, x, anchor) {
        for(let i=anchor-1; i>=0; i--) {
            if(xs[i][level] > x[level]) { // TODO: override with isParent function & export it
                return xs[i];
            }
        }
        return null;
    }

    for(let i=0; i<xs.length; ++i) {
        let p = parentOf(xs, xs[i], i) || root;
        p[child].push(xs[i]);
    }
    return root;
}

/**
 * 遍历指定的objects
 * @param o
 * @param f
 * @param context
 */
function walk(o, f, context = {path:[], level:0}) {
    if((o === null) || Object.keys(o).length === 0 || (typeof o === 'string') || (typeof o === 'number')) {
        return;
    }

    for(let k in o) {
        let ctx = {path: [...context.path, k], level: context.level+1};

        if(f) {
            f(ctx, k, o[k]);
        }
        walk(ctx, o[k], f);
    }
}

const SectionType = {
    ROOT: 'root',
    FUNC: 'func',
    TEXT: 'text',
    NORM: 'norm',
    PART: 'part',
    LOOP: 'loop'
};

Object.freeze(SectionType);

class Section {
    /**
     *
     * @param name section name
     * @param type section type
     * @param level section level
     */
    constructor(name, type, level) {
        this.name = name;
        this.type  = type;
        this.level = level;
        this.sections = [];
        this.contents = [];
        this.params   = [];
        this.__join   = null;
    }

    addChildSection(section) {

    }

    isRoot() {
        return this.type == SectionType.ROOT;
    }

    isFunc() {
        return this.type == SectionType.FUNC;
    }

    isNorm() {
        return this.type == SectionType.NORM;
    }

    isPart() {
        return this.type == SectionType.PART;
    }

    isLoop() {
        return this.type == SectionType.LOOP;
    }

    test(env) {
        let argv = env.__context.argv;
        if(this.params.length == 0 || !this.params[0] || eval(`let $=env.context; ${this.params[0]}`)) {
            //console.log(`>>> ${this.params[0]}`);
            return true;
        } else {
            false;
        }
    }

    join(c='\n') {
        if(!this.__join) {
            this.__join = this.contents.join(c);
        }
        return this.__join;
    }

    static push(rs, xs) {
        if(Array.isArray(xs)) {
            if (xs.length) { rs.push(...xs); }
        } else {
            if (xs) {rs.push(xs);}
        }
        return rs;
    }

    eval(env={}) {
        let rs = [];
        if(this.isPart() && this.test(env)) {
            Section.push(rs, mkTemplateStrings(env, this.join()));
            for (let s of this.sections) {
                Section.push(rs,s.eval(env));
            }
        } else if(this.isLoop()) {
            for(let p of this.params) {
                let os = ('$' == p) ? env.context : env.context[p];
                // TODO: CHECK os is iterable or NOT
                for(let o of os) {
                    env.changeContext(o);
                    Section.push(rs, mkTemplateStrings(env, this.join()));
                    for (let s of this.sections) {
                        Section.push(rs, (s.eval(env)));
                    }
                    env.restoreContext();
                }

            }
        } else if(this.isNorm()) {
            let r = env.handlers[this.name](env, this.contents, this.params);
            if(r) {
                Section.push(rs, r);
            }
        } else if(this.isRoot()) {
            for(let s of this.sections) {
                rs.push(...(s.eval(env)));
            }
        } else if(this.isFunc()) {
            //TODO: 实现函数的功能
            //console.log("--------------?" + this.params)
        }
        return rs;
    }

    call(env, argv) {
        if(!this.isFunc()) {
            return [];
        }
        //console.log(`PARM:　${params.length}`);
        let rs = [];
        env.argv(argv);
        Section.push(rs, mkTemplateStrings(env, this.join()));
        for(let s of this.sections) {
            Section.push(rs, (s.eval(env)));
        }
        return rs;
    }

    static createRootNode() {
        return new Section("root",SectionType.ROOT,0);
    }
};

const BASE_HANDLER = {
    e(env, content, params) {
        return mkTemplateStrings(env, content.join('\n'));
    },

    echo(env, content, params) {
        return content.join('\n');
    },

    src(env, content, params) {
        env.src = JSON.parse(eval(`let $={${content.join('\n')}}; JSON.stringify($);`));
        env.changeContext(env.src);
    }
}

class Maple {
    constructor(file) {
        this.currentSection = null;
        this.file = file;
        this.handlers = BASE_HANDLER;
        this.sections = [];
        this.functions= {};
        this.root = {};
        this.src = {};
        this.__context = {stack:[], c:{}, argv:[]};
    }

    get context() {
        return this.__context.c;
    }

    changeContext(ctx) {
        this.__context.stack.push(ctx);
        this.__context.c = ctx;
        //console.log(`[CHANGE CTX +] : CTX = ${JSON.stringify(this.__context.c)} TYPE:${(typeof this.__context.c)}`);
    }

    restoreContext() {
        this.__context.stack.pop();
        this.__context.c =  this.__context.stack[this.__context.stack.length - 1];
        //console.log(`[CHANGE CTX -] : CTX = ${JSON.stringify(this.__context.c)} TYPE:${(typeof this.__context.c)}`);
    }

    toString() {
        return `MAPLE:${this.file}`;
    }

    argv(argv) {
        this.__context.argv = argv;
    }

    addSection(name, params, level=0) {
        let type = SectionType.TEXT;
        if(!name) {
            type = SectionType.PART;
            name = "@part";
        } else if("foreach" == name) {
            type = SectionType.LOOP;
            name = "@loop";
        } else if("func" == name) {
            type = SectionType.FUNC;
            name = "@func";
        } else {
            type = SectionType.NORM;
        }


        this.currentSection = new Section(name, type, level);
        this.currentSection.params = params;
        this.sections.push(this.currentSection);

        if(this.currentSection.isFunc()) {
            let [fname,  ...opts] = this.currentSection.params;
            let s = this.currentSection;
            this.addFunction(fname,(...parms) => {
                let section = s;
                return section.call(this, parms);
            }, "");
        }
    }

    addFunction(fname, f, module) {
        if(module) {
            if(!this.functions[module]) {
                this.functions[module] = {};
            }
            this.functions[module][fname] = f;
        } else {
            this.functions[fname] = f;
        }
        //console.log("+F:　"+Object.keys(this.functions));
    }

    addContent(content) {
        if(this.currentSection) {
            this.currentSection.contents.push(content);
        }
    }

    tree() {
        this.root = mktree(this.sections, Section.createRootNode(), "level", "sections");
        //console.log(JSON.stringify(this.functions,null,4));
        return this;
    }


    eval() {
        let rs = this.root.eval(this);
        console.error(rs.join("\n"));
    }

    print() {
        console.log(JSON.stringify(this,null,4));
    }
};

function run_maple(file) {
    const maple = new Maple(file);

    readline(file, (line, num) => {
        if(line == null) {
            maple.tree();
            maple.eval();
        }

        let match;

        if(match = /^#([-]{4,256})\|\s[@]([a-z_A-Z][a-z_A-Z0-9]*)(.*)$/.exec(line)) {
            let level  = match[1].length;
            let name   = match[2].trim();
            let params = match[3].trim().split(/\s+/);
            maple.addSection(name, params, level);
        } else if(match = /^#([-]{4,256})[\|]*\s*(.*)$/.exec(line)) {
            let level = match[1].length;
            let param = match[2].trim();
            maple.addSection("", [param], level);
        } else {
            maple.addContent(line);
        }

    });

}

function readline(file, cb) {
    let num = 0;
    require('readline').createInterface({
        input: require('fs').createReadStream(file)
    }).on('line', function (line) {
        cb(line,num++);
    }).on('close',() => {
        cb(null,num++);
    });
}

run_maple("maple/hello.mp");



//console.log([1,2,3].reduce((acc, n) => (acc+n) , 0));
//
// function f(m, n) {
//     'strict mode'
//     if(n == 0) {
//         return n;
//     }
//     return f(m+n, n-1);
// }
//
// console.log(f(1300));

// let x = {a:1, b:2};
// delete x.a;
// console.log(JSON.stringify(x));

// var xs = {
//     name:{
//         a:{number : 21, age : 1},
//         b:{number : 23, age : 2},
//         c:{number : 24, age : 3}
//     }
// };
//
//
// for(x of xs) {
//     console.log(JSON.stringify(x));
// }
