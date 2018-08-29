//const minimatch = require("minimatch")
const M = require('./M');
const _ = require('lodash');
const path = require('path');
const mcore  = require('./mcore');
var maple_path = [];

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 *  3. 性能统计: eval求值时间，次数，产生的字符数量等等
 *  4. 实现pipe
 * HISTORY:
 *  1. 2018.06.18: Finished Core Design
 *  2. 如何更加智能的查找keys
 * @param text
 *  5. 实现IO section
 *  6. 用迭代代替mktree|printrs递归方式
 *  7. 提供一些打印上下文信息的调试函数，方便定位问题
 *  FIXME:
 *
 */

const TYPE_OF = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

function print(o, tag="") {
    if(o) {
        console.error(tag+JSON.stringify(o, null, 2));
    }
}

function error(e) {
    console.log(e);
}

/**
 * @param $stack object array
 * @param $code code to evaluated under the given stack
 * @returns {string} result code to eval
 */
function expose($os, $code) {
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
    let rs  = [];
    let level = 0;

    $os.forEach((e,i) => {
        if(_.isEmpty(e)) return;

        let ids = convertId(Object.keys(e));
        if(_.isEmpty(ids)) return;

        rs.push(`let {${ids.join(',')}} = $os[${i}];{`);
        level+=1;
    });
    rs.push($code);
    rs.push("}".repeat(level));
    return rs.join("");
}

function exeval($os, $code) {
    return eval(expose($os, $code));
}

function template(env, template) {
    let $T       = template.replace(/`/g, '\\`');
    return exeval(env.expose(), `\`${$T}\`;`);
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
    }

    isFunc() { return this.type === SectionType.FUNC; }
    isNorm() { return this.type === SectionType.NORM; }
    isPart() { return this.type === SectionType.PART; }
    isLoop() { return this.type === SectionType.LOOP; }

    test(env) {
        let $expr = this.params.join("").trim();
        if(_.isEmpty($expr)) {
            return true;
        }

        let r = false;
        try {
            r = exeval(env.expose(), $expr);
        } catch (e) {
            error(e);
            r = false;
        }
        // console.log(`${$expr} -> ${r}`);
        return (r) ? true : false;
    }

    join(c='\n') {
        return this.contents.join(c);
    }

    static issue(section, rs, xs) {
        if(_.isEmpty(xs)){
            return;
        }
        rs.rs.push(xs);
        return rs;
    }

    'eval@loop'(rs, env) {
        // @foreach x:xs
        // @foreach xs -> @foreach $:xs
        if(_.isEmpty(this.params)) {
            return;
        }

        let [xname, xs_name=xname] = this.params[0].split(':');
        if(xname === xs_name) {
            xname = '$';
        }

        let os = env.context[xs_name];

        let LENGTH = Object.keys(os).length;
        let n   = 0;
        _.forEach(os, (value, key) => {
            let $o = {};
            n += 1;

            $o[xname]    = value;
            $o["$key"]   = key;
            $o["$first"] = n === 1;
            $o["$last"]  = n === LENGTH;

            env.changeContext($o);
            this._eval(rs, env);
            env.restoreContext();
        });
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
        //console.log(`EVAL : ${this.id}${this.type}`);
        let rs = {id:this.id, rs:[], sep: this.sep};
        this[`eval${this.type}`](rs, env);
        return rs;
    }

    /**
     *
     * @param env
     * @param params formal params
     * @param args actual params
     * @returns {Array}
     */
    apply(env, params, args) {
        function argv(params, args) {
            let argv = params.reduce((r,e,i,_) => {
                // FIXME: when args.length less then params;
                r[e] = args[i];
                return r;
            },{});
            return argv;
        }

        //console.log(`apply: ${params} with ${args}`);
        let rs = {id:this.id, rs:[], sep: this.sep};
        env.changeContext(argv(params, args));
        this._eval(rs, env);
        env.restoreContext();

        return Maple.printrs(rs);
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

    srcfile(env, content, params) {
        let name = params[0] || "main";
        let c = [];

        content.forEach( f => {
            let text = mcore.object(env.mpath, f);
            if(text) {
                c.push(text);
            }
        });
        env.src[name] = M(`module.exports={${c.join(",")}}`);
        env.changeContext(env.src.main);
    },

    mod(env, content, params) {
        let name = params[0] || "mod";
        env.mod[name] = M(`${content.join('\n')}`);
    },

    zsh(env, content, params) {
        let r = mcore.exec(content.join("\n"), "zsh");
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
        this.var       = {};    // 缓存状态
        this.root      = {};
        this.handlers  = BASE_HANDLER;
        this.sections  = [];
        this.functions = {};
        this.__context = {stack:[]};
        this.currentSection = Section.createRootNode();
        this.sections.push(this.currentSection);
        this.mpath     = [...maple_path];
        this.export    = {
            $src       : this.src,
            $mod       : this.mod,
            $var       : this.var,
            $func      : this.functions,
        };

        let scriptd = path.dirname(file);
        if(scriptd) {
            this.mpath.unshift(scriptd);
        }
    }

    get context() {
        return this.__context.stack[0];
    }

    changeContext(ctx) {
        this.__context.stack.unshift(ctx); //console.log(`[CHANGE CTX +] : CTX = ${JSON.stringify(this.context)} TYPE:${(typeof this.context)}`);
    }

    restoreContext() {
        this.__context.stack.shift(); //console.log(`[CHANGE CTX -] : CTX = ${JSON.stringify(this.context)} TYPE:${(typeof this.context)}`);
    }

    expose() {
        let os = [];

        // export function for easy to use
        os.unshift(this.export.$func);

        // export the maple state
        os.unshift(this.export);

        // export the stack objects
        this.__context.stack.forEach((elem) => { os.unshift(elem); });

        return os;
    }

    addSection(name, params, level=0) {
        let type = SectionType.TEXT;
        if(!name) {
            name = type = SectionType.PART;
        } else if("foreach" == name) {
            name = type = SectionType.LOOP;
        } else if("func" == name) {
            name = type = SectionType.FUNC;
        } else {
            type = SectionType.NORM;
        }


        this.currentSection = new Section(name, type, level);
        this.currentSection.id = this.seq++;
        this.currentSection.params = params;
        this.sections.push(this.currentSection);

        if(this.currentSection.isFunc()) {
            let [fname,  ...params] = this.currentSection.params;
            let section = this.currentSection;
            this.addFunction(fname,(...args) => {
                return section.apply(this, params, args);
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
        //print(this.sections);
    }


    eval() {
        let rs = this.root.eval(this);
        //print(rs);
        let text = Maple.printrs(rs);
        console.error(text);
        return rs;
    }

    static printrs(result) {
        let text = [];
        let {id, sep, rs} = result;
        for(let r of rs) {
            if(_.isString(r)) {
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
}

function run_maple(file) {
    const maple = new Maple(file);
    maple.addFunction("L",(t) => t.toUpperCase(),"");

    readline(file, (line, num) => {
        if(line == null) {
            maple.tree();
            maple.eval();
            return;
        }

        let match;
        if(line.startsWith('#----')) {
            if (match = /^#([-]{4,256})[|]\s[@]([a-z_A-Z][a-z_A-Z0-9]*)(.*)$/.exec(line)) {
                let [ , level, name, params] = match;
                maple.addSection(name.trim(), params.trim().split(/\s+/), level.length);
            } else if (match = /^#([-]{4,256})([|])(.*)$/.exec(line)) {
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
run_maple("maple/README.mp");

// console.log("a | b a || c | d".split(/[|](?=[^|])/));
//
//run_maple("maple/orm.mp");

// console.log([1,2,3,4,5].some((n) => n < 4));
// let i = Math.sign(-1);
// console.log(`${i}`);
// console.log(`${Math.sign(12)}`);
// xs=[[1,2,3],4,5,6,7];
// let [[x],] = xs;
// console.log(x);
//mcore.exec("print hello", "zsh");


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
//
// const xs = [new print(1), new print(2), new print(3)];
//
//
// function print(i) {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             console.log(i);
//             resolve();
//         }, 1000);
//     });
// }
//
// (async () => {
//     xs.forEach(async (x) => {
//         await x;
//     });
// })();
