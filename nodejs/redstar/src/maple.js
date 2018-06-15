const minimatch = require("minimatch")

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 *
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
    if(Array.isArray(env)) {
        console.error(":array");
    } else {
        let keys = transId(Object.keys(env));
        return eval(`let {${keys.join(",")}} = env; \`${template.replace(/`/g, '\\`')}\``);
    }
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

    test() {
        if(this.params.length == 0 || !this.params[0] || eval(this.params[0])) {
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

    eval(env) {
        let rs = [];
        if(this.isPart()) {
            if(this.test()) {
                rs.push(mkTemplateStrings(env.src, this.join()));
                for(let s of this.sections) {
                    rs.push(...(s.eval(env)));
                }
            }
        } else if(this.isLoop()) {
            for(let p of this.params) {
                for(let o of env.src[p]) {
                    rs.push(mkTemplateStrings(o, this.join()));
                    for (let s of this.sections) {
                        rs.push(...(s.eval(env)));
                    }
                }
            }
        } else if(this.isNorm()) {
            let r = env.handlers[this.name](env, this.contents, this.params);
            if(r) {
                rs.push(r);
            }
        } else if(this.isRoot()) {
            for(let s of this.sections) {
                rs.push(...(s.eval(env)));
            }
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
        eval(`env.src={${content.join('\n')}};`);
    }
}

class Maple {
    constructor(file) {
        this.currentSection = null;
        this.file = file;
        this.handlers = BASE_HANDLER;
        this.sections = [];
        this.functions= [];
        this.root = {};
        this.src = {};
    }

    toString() {
        return `MAPLE:${this.file}`;
    }

    addSection(name, params, level=0) {
        let type = SectionType.TEXT;
        if(!name) {
            type = SectionType.PART;
            name = "@part";
        } else if("foreach" == name) {
            type = SectionType.LOOP;
            name = "@loop";
        } else {
            type = SectionType.NORM;
        }


        this.currentSection = new Section(name, type, (type == SectionType.FUNC) ? 1024 : level); // function is the fixed level
        this.currentSection.params = params;
        this.sections.push(this.currentSection);
    }

    addContent(content) {
        if(this.currentSection) {
            this.currentSection.contents.push(content);
        }
    }

    tree() {
        this.root = mktree(this.sections, Section.createRootNode(), "level", "sections");
        return this;
    }


    eval() {
        //console.log(JSON.stringify(this.root,null,4));
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