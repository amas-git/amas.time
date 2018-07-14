//const minimatch = require("minimatch")
const M = require("./require-from-string");
const _ = require("lodash");

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 * HISTORY:
 *  1. 2018.06.18: Finished Core Design
 * @param text
 *  2. 如何更加智能的查找keys
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

const TYPE_OF = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function template(env, template) {
    function convertId(keys) {
        return keys.map((key)=>{
            if(key.match(/\d+/)) {
                return `$${key}`;
            }
            // TODO: support more convertion
            // TODO: when the array keys is large, only keep 9 id
            return key;
        });
    }
    function expose($stack, $T) {
        let rs = [];
        $stack.forEach((e,i) => {
            let ids = convertId(Object.keys($stack[i]));
            rs.push(`let {${ids.join(',')}} = $stack[${i}];{`);
        });
        rs.push(`\`${$T}\`;`);
        rs.push("}".repeat($stack.length));
        return rs.join("");
    }

    let $       = env.context;
    let $T      = template.replace(/`/g, '\\`');
    let $stack  = env.__context.stack;
    let $argv   = env.__context.argv;
    let $func   = env.functions;
    let $src    = env.src;
    let $type   = TYPE_OF($);
    let $index  = env.__context.$index;
    return eval(expose($stack, $T));
}


function mktree(xs, root=xs[0], level="level", child='nodes') {
    function parentOf(xs, x, anchor) {
        for(let i=anchor-1; i>=0; i--) {
            if(xs[i][level] > x[level]) { // TODO: override with isParent function & export it
                return xs[i];
            }
        }
         return null;
    }

    for(let i=1; i<xs.length; ++i) {
        let p = parentOf(xs, xs[i], i);
        p[child].push(xs[i]);
    }

    //console.error(root);
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

    isRoot() { return this.type === SectionType.ROOT; }
    isFunc() { return this.type === SectionType.FUNC; }
    isNorm() { return this.type === SectionType.NORM; }
    isPart() { return this.type === SectionType.PART; }
    isLoop() { return this.type === SectionType.LOOP; }

    test(env) {
        let $argv = env.__context.argv;
        if(this.params.length === 0 || !this.params[0] || eval(`let $=env.context; ${this.params[0]}`)) {
            return true;
        }
        return  false;
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

    _eval(rs, env) {
        Section.push(rs, template(env, this.join()));
        for (let s of this.sections) {
            Section.push(rs,s.eval(env));
        }
    }

    eval(env={}) {
        let rs = [];
        if(this.isPart() && this.test(env)) {
            this._eval(rs, env);
        } else if(this.isLoop()) {
            for(let p of this.params) {
                let os = ('$' == p) ? env.context : env.context[p];
                // TODO: CHECK os is iterable or NOT
                for(let index in os) {
                    env.changeContext(os[index], index);
                    this._eval(rs, env);
                    env.restoreContext();
                }

            }
        } else if(this.isNorm()) {
            let r = env.handlers[this.name](env, this.contents, this.params);
            if(r) {
                Section.push(rs, r);
            }
        } else if(this.isRoot()) {
            this._eval(rs, env);
        } else if(this.isFunc()) {
            //TODO: 实现函数的功能
            //console.log("--------------?" + this.params)
        }
        return rs;
    }
    // TODO: rename to apply
    apply(env, argv) {
        let rs = [];
        env.argv(argv);
        this._eval(rs, env);
        return rs;
    }

    static createRootNode() {
        return new Section("root",SectionType.ROOT,2048);
    }

}

const BASE_HANDLER = {
    e(env, content, params) {
        return template(env, content.join('\n'));
    },

    echo(env, content, params) {
        return content.join('\n');
    },

    src(env, content, params) {
        env.src = M(`module.exports={${content.join('\n')}}`);
        env.changeContext(env.src);
    }
};

class Maple {
    constructor(file) {
        this.file = file;
        this.handlers = BASE_HANDLER;
        this.sections = [];
        this.functions= {};
        this.root = {};
        this.src = {};
        this.__context = {stack:[], c:{}, argv:[], $index:null};
        this.currentSection = Section.createRootNode();
        this.sections.push(this.currentSection);
        this.$index = null;
    }

    get context() {
        return this.__context.c;
    }

    changeContext(ctx, index=null) {
        this.__context.stack.push(ctx);
        this.__context.c = ctx;
        this.__context.$index = index;
        //console.log(`[CHANGE CTX +] : CTX = ${JSON.stringify(this.__context.c)} TYPE:${(typeof this.__context.c)}`);
    }

    restoreContext() {
        this.__context.stack.pop();
        this.__context.c =  this.__context.stack[this.__context.stack.length - 1];
        this.__context.$index = null;
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
                return section.apply(this, parms);
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
    }

    addContent(content) {
        this.currentSection.contents.push(content);
    }

    tree() {
        this.root = mktree(this.sections, this.sections[0], "level", "sections");
        //console.log(JSON.stringify(this.root, null,4));
        return this;
    }


    eval() {
        let rs = this.root.eval(this);
        console.error(rs.join("\n"));
    }

    print() {
        console.log(JSON.stringify(this,null,4));
    }
}

function run_maple(file) {
    const maple = new Maple(file);
    maple.addFunction("L",(t) => t.toUpperCase(),"text");

    readline(file, (line, num) => {
        if(line == null) {
            maple.tree();
            maple.eval();
            return;
        }

        let match;
        if(line.startsWith('#----')) {
            if (match = /^#([-]{4,256})[\|]\s[@]([a-z_A-Z][a-z_A-Z0-9]*)(.*)$/.exec(line)) {
                let [ , level, name, params] = match;
                maple.addSection(name.trim(), params.trim().split(/\s+/), level.length);
            } else if (match = /^#([-]{4,256})([\|])(.*)$/.exec(line)) {
                let [ , level,  , expr] = match;
                if(expr.startsWith('|')) {
                    maple.addContent(`#${level}|${expr.slice(1)}`);
                } else {
                    maple.addSection("", [expr.trim()], level.length);
                }
            } else {
                /* NOTHING */
            }
            return;
        }

        maple.addContent(line);

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

//run_maple("maple/zsh.completion.mp");
//run_maple("maple/hello.mp");

run_maple("maple/orm.mp");

// let i = Math.sign(-1);
// console.log(`${i}`);
// console.log(`${Math.sign(12)}`);
// xs=[[1,2,3],4,5,6,7];
// let [[x],] = xs;
// console.log(x);



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

//
// function a(n, s, b) {
//     return `${n} ${s} ${JSON.stringify(b)}`;
// }
//
// const f = function(s, b) {
//     return a(110, s, b);
// };
//
// const z = function (...params) {
//     return a("Z:",...params);
// }
//
// let o1 = {o:1};
// console.log(f("a", o1));
//
//
//
// console.log(f("AAA", o1));
//
//
// o1 = 2;
//
// console.log(z("ZZZ", o1));
// console.log(z("BBB", {a:1}));
// var Promise = require("bluebird");
// const Web3js = require('web3');
// var web3.eth = Promise.promisifyAll(web3.eth);
// const PSUFFIX = "__ASYNC";
//
//
// const Web3 = {};
//
// createAgentFunction(Web3, we)
//
// function createAgentFunction(o,from,suffix) {
//     for(let k of Object.keys(from)) {
//         if(k.endsWith(PSUFFIX) && typeof from[k] === 'function') {
//             o[k.replace()] = from[k];
//         }
//     }
// }