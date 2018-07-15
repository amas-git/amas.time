//const minimatch = require("minimatch")
const M = require("./M");
const _ = require("lodash");

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 * HISTORY:
 *  1. 2018.06.18: Finished Core Design
 * @param text
 *  2. 如何更加智能的查找keys
 *  3. 性能统计: eval求值时间，次数，产生的字符数量等等
 *  4. 实现pipe
 *  5. 实现IO section
 *  6. 用迭代代替mktree|printrs递归方式
 *  7. 提供一些打印上下文信息的调试函数，方便定位问题
 *  FIXME:
 *
 */

const TYPE_OF = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

function print(o) {
    if(o) {
        console.error(JSON.stringify(o, null, 2));
    }
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
            let ids = convertId(Object.keys($stack[i].c));
            rs.push(`let {${ids.join(',')}} = $stack[${i}].c;{`);
        });
        rs.push(`\`${$T}\`;`);
        rs.push("}".repeat($stack.length));
        return rs.join("");
    }

    let $        = env.context;
    let $T       = template.replace(/`/g, '\\`');
    let $stack   = env.__context.stack;
    let $argv    = env.__context.argv;
    let $func    = env.functions;
    let $src     = env.src;
    let $mod     = env.mod;
    let $foreach = env.__context.foreach;
    return eval(expose($stack, $T));
    //return eval.call(env, expose($stack, $T));
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

const SectionType = Object.freeze({
    FUNC: '@func',
    NORM: '@norm',
    PART: '@part',
    LOOP: '@loop'
});

class Section {
    /**
     *
     * @param name section name
     * @param type section type
     * @param level section level
     */
    constructor(name, type, level) {
        this.id       = 0;
        this.name     = name;
        this.type     = type;
        this.level    = level;
        this.sections = [];
        this.contents = [];
        this.params   = [];
        this.sep      = "\n";
        this.__join   = null;
    }

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

    static issue(section, rs, xs) {
        if(_.isEmpty(xs)){
            return;
        }

        rs.rs.push(xs);
        return rs;
    }

    'eval@loop'(rs, env) {
        let o    = this.params[0] || "$";
        let os   = ('$' == this.params[0]) ? env.context : env.context[o];

        for (let key in os) {
            env.changeContext(os[key], Maple.createForeachStatus(key, os));
            this._eval(rs, env);
            env.restoreContext();
        }
    }

    'eval@part'(rs, env) {
        if(this.test(env)) {
            this._eval(rs, env);
        }
    }

    'eval@norm'(rs, env) {
        let r = env.handlers[this.name](env, this.contents, this.params);
        Section.issue(this, rs, r);
    }

    'eval@func'(rs, env) { /* NOP*/ }

    _eval(rs, env) {
        Section.issue(this, rs, template(env, this.join(this.sep)));
        for (let s of this.sections) {
            Section.issue(s, rs, s.eval(env, rs));
        }
    }

    eval(env={}) {
        let rs = {id:this.id, rs:[], sep: this.sep};
        this[`eval${this.type}`](rs, env);
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
        return new Section("root",SectionType.PART,2048);
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
        let name = params[0] || "main";
        env.src[name] = M(`module.exports={${content.join('\n')}}`);
        env.changeContext(env.src.main);
    },

    mod(env, content, params) {
        let name = params[0] || "mod";
        env.mod[name] = M(`${content.join('\n')}`);
        //env.changeContext(env.src.main);
    },
    debug(env, content, params) {
        console.log(JSON.stringify(env.sections, null, 2));
    }
};

class Maple {
    constructor(file) {
        this.seq       = 0;
        this.file      = file;
        this.src       = {};    // data source
        this.mod       = {};    // modules
        this.root      = {};
        this.handlers  = BASE_HANDLER;
        this.sections  = [];
        this.functions = {};
        this.__context = {stack:[/*{c:{}, foreach:{}}*/], c:{}, argv:[]};
        this.currentSection = Section.createRootNode();
        this.sections.push(this.currentSection);
    }

    get context() {
        return this.__context.c;
    }

    changeContext(ctx, foreach={}) {
        this.__context.stack.push({c:ctx, foreach:foreach});
        this.__context.c = ctx;
        this.__context.foreach = foreach;
        //console.log(`[CHANGE CTX +] : CTX = ${JSON.stringify(this.__context.c)} TYPE:${(typeof this.__context.c)}`);
    }

    restoreContext() {
        this.__context.stack.pop();
        let {c, foreach} =  this.__context.stack[this.__context.stack.length - 1];
        this.__context.c = c;
        this.__context.foreach = foreach;
        //console.log(`[CHANGE CTX -] : CTX = ${JSON.stringify(this.__context.c)} TYPE:${(typeof this.__context.c)}`);
    }

    argv(argv) {
        this.__context.argv = argv;
    }

    addSection(name, params, level=0) {
        let type = SectionType.TEXT;
        if(!name) {
            name = type = SectionType.PART;
        } else if("foreach" == name) {
            name = type = SectionType.LOOP;
        } else if("func" == name) {
            name = SectionType.FUNC;
        } else {
            type = SectionType.NORM;
        }


        this.currentSection = new Section(name, type, level);
        this.currentSection.id = this.seq++;
        this.currentSection.params = params;
        this.sections.push(this.currentSection);

        if(this.currentSection.isFunc()) {
            let [fname,  ...opts] = this.currentSection.params;
            let s = this.currentSection;
            this.addFunction(fname,(...parms) => {
                let section = s;
                return section.apply(this, parms);
            }, "");
        } else if(this.currentSection.isLoop()) {
            let sep = params.length > 1 ? params[1] : null;
            if(sep) {
                this.currentSection.sep = sep;
            }
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
        let text = Maple.printrs(rs);
        console.error(text);
        return rs;
    }

    static printrs(result) {
        let text = [];
        let {id, sep, rs} = result;
        for(let r of rs) {
            if(_.isString(r)) {
                //console.log(`'${r}'`);
                text.push(r);
            } else {
                if(_.isEmpty(r.rs)) {
                    continue;
                }
                text.push(Maple.printrs(r));
            }
        }
        return text.join(sep==="\n" ? sep : sep+"\n");
    }

    static createForeachStatus(keys, object) {
        let first = false;
        let last  = false;
        let key   = keys;
        if(_.isArray(object)) {
            let i = parseInt(keys);
            first = (i === 0);
            last  = (i === object.length - 1);
        }
        return {first: first, last: last, key: key};
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
//
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
//
// const aaa = 1;
// const b = {};
// console.log(eval.call(b, `${aaa}`));