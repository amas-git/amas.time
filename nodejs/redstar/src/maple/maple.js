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
 *  2. use function all instead of eval&let, the function parmas limit will be a problems
 * @param text
 *  5. 实现IO section
 *  6. 用迭代代替mktree|printrs递归方式
 *  7. 提供一些打印上下文信息的调试函数，方便定位问题
 *  8. **可以把section编译成js函数
 *  FIXME:
 *
 *  结果正确 != 过程正确
 */


const DEBUG = false;

function print(o, tag="") {
    if(o && DEBUG) {
        let c = JSON.stringify(o, null, 2).split("\n");
        c = c.map((s) =>{ return `[${tag}] : ${s}`; } );
        console.error(c.join("\n"));
    }
}
function println(o, tag="") {
    if(o && DEBUG) {
        let c = JSON.stringify(o).split("\n");
        c = c.map((s) =>{ return `[${tag}] : ${s}`; } );
        console.error(c.join("\n"));
    }
}


class Section {
    constructor(id, name, level, params=[]) {
        this.id       = id;
        this.name     = name;
        this.level    = level;
        this.contents = [];
        this.params   = params;
        this.sections = [];
        this.time     = 0;
        this.sep      = "\n";
    }

    test(env) {
        let $expr = this.params.join("").trim();
        if(_.isEmpty($expr)) {
            return true;
        }

        let r = mcore.exeval(env.expose(), `return ${$expr};`);
        // console.log(`${$expr} -> ${r}`);
        return (r) ? true : false;
    }

    join(c='\n') {
        return this.contents.join(c);
    }

    /**
     *
     * @param env
     * @param params formal params
     * @param args actual params
     * @returns {Array}
     */
    apply(env, params, args) {
        env.changeContext(_.zipObject(params, args));
        let rs = this.map(env);
        env.restoreContext();
        return Maple.printrs(rs);
    }

    map(env, rs=[], template=true) {
        mcore.push(rs, mcore.template(env, this.join("\n"), template));
        this.sections.forEach((s) => {
            rs.push(s.eval(env));
        });
        return rs;
    }

    mapFlat(env, rs=[]) {
        return mcore.flat(this.map(env,rs));
    }

    eval(env) {
        let start = Date.now();
        let rs = env.handlers[this.name](env, this);
        let time = Date.now() - start;
        this.time = time;
        return rs;
    }

    static ROOT() {
        return new Section(0, "part", 2048);
    }
}


const BASE_HANDLER = {
    func(env, section) {
        let [fname,  ...params] = section.params;
        let fn = (...args) => { return section.apply(env, params, args); };
        env.addFunction(fname, fn, "");
        return [];
    },

    part(env, section) {
        return (section.test(env)) ? section.map(env) : [];
    },

    foreach(env, section) {
        let rs = [];

        function getIterable() {
            // @foreach x:xs
            // @foreach xs -> @foreach $:xs
            // @foreach x:_range(1,100)

            if (_.isEmpty(section.params)) {
                return undefined;
            }

            let forExpr = mcore.template(env, section.params.join("").trim());
            let match   = /([_]*[a-zA-Z0-9_]+):(.*)/.exec(forExpr.trim());
            let xname   = "$";
            let expr    = forExpr;

            if(match) {
                [,xname, expr] = match;
                expr  = expr  || forExpr;
            }

            let os = env.context[expr];
            if(!os) {
                os = eval(expr);
            }
            return {xname: xname, os: os};
        }

        let {xname, os} = getIterable();
        if(!os) {
            return rs;
        }

        env.changeContext(os);
        let LENGTH = Object.keys(os).length;
        let n = 0;

        _.forEach(os, (value, key) => {
            let $o = {};
            n += 1;
            $o[xname]    = value;
            $o["$key"]   = key;
            $o["$first"] = n === 1;
            $o["$last"]  = n === LENGTH;

            env.changeContext($o);
            section.map(env, rs);
            env.restoreContext();
        });
<<<<<<< Updated upstream
=======
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
            let argv = params.reduce((r,e,i) => {
                // FIXME: when args.length less then params;
                r[e] = args[i];
                return r;
            },{});
            return argv;
        }

        let rs = {id:this.id, rs:[], sep: this.sep};
        env.changeContext(argv(params, args));
        this._eval(rs, env);
>>>>>>> Stashed changes
        env.restoreContext();
        return mcore.flat(rs);
    },

    src(env, section) {
        let name = section.params[0] || "main";
        let rs   = section.mapFlat(env);
        env.src[name] = M(`module.exports={${rs.join('\n')}}`);
        print(env.src.main, name);
        env.changeContext(env.src.main);
        return [];
    },

    srcfile(env, section) {
        let rs = section.mapFlat(env);
        let name = section.params[0] || "main";
        let c = [];

        rs.forEach( f => {
            let text = mcore.object(env.mpath, f);
            if(text) {
                c.push(text);
            }
        });
        env.src[name] = M(`module.exports={${c.join(",")}}`);
        env.changeContext(env.src.main);
        return [];
    },

    mod(env, section) {
        let content = mcore.flat(section.map(env, [], false));
        let name = section.params[0];
        let mod = M(`${content.join('\n')}`);
        if (name) {
            env.mod[name] = mod;
        } else {
            _.assign(env.functions, mod);
        }
        return [];
    },

    zsh(env, section) {
        let rs = section.mapFlat(env);
        let r = mcore.exec(rs.join("\n"), "zsh");
        return [r];
    },

    save(env, section) {
        let rs = section.mapFlat(env);
        let name = mcore.template(env, section.params[0].trim());
        mcore.write(name, Maple.printrs(rs));
        return [];
    }
};

class Maple {
    constructor(file) {
        this.seq       = 1;
        this.file      = file;
        this.src       = {};    // data source
        this.mod       = {};    // modules
        this.var       = {};    // 缓存状态
        this.root      = {};
        this.handlers  = BASE_HANDLER;
        this.sections  = [];
        this.functions = {};
        this.__context = {stack:[{}]};
        this.mpath     = [...maple_path];
        this.export    = {
            $src       : this.src,
            $mod       : this.mod,
            $var       : this.var,
            $func      : this.functions
        };

        let scriptd = path.dirname(file);
        if(scriptd) {
            this.mpath.unshift(scriptd);
        }

        this.currentSection = Section.ROOT();
        this.sections.push(this.currentSection);
    }

    get context() {
        return _.last(this.__context.stack);
    }

    changeContextToChild(key) {
        this.changeContext(_.pick(this.context, key));
    }

    changeContext(ctx={}) {
        this.__context.stack.push(ctx); //println(this.__context, "+CTX");
    }

    restoreContext() {
        this.__context.stack.pop(); //console.log(`[CHANGE CTX -] : CTX = ${JSON.stringify(this.context)} TYPE:${(typeof this.context)}`);
    }

    expose() {
        let os = [];

        // export function for easy to use
        os.push(this.export.$func);

        // export the maple state
        os.push(this.export);

        // export the stack objects
        os.push(...this.__context.stack);
        return os;
    }

    addSection(name, params, level=0) {
        name = name || "part";
        this.currentSection = new Section(this.seq++, name, level, params);
        this.sections.push(this.currentSection);
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
        this.root = mcore.mktree(this.sections, this.sections[0], "level", "sections");
        return this;
    }

    eval() {
        let rs = this.root.eval(this);
        print("==============================");
        print(rs, "RS");
        return rs;
    }

    showTime() {
        this.sections.forEach((s) => {
            console.log(`${s.id} : ${s.time}` );
        });
    }
    static printrs(xs) {
        return mcore.flat(xs).join("\n");
    }
}

function run_maple(file) {
    const maple = new Maple(file);
    maple.addFunction("L",(t) => t.toUpperCase(),"");

    readline(file, (line, num) => {
        if(line == null) {
            maple.tree();
            console.log(Maple.printrs(maple.eval()));
            //maple.showTime();
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
        cb(line, num++);
    }).on('close', () => {
        cb(null, num++);
    });
}

<<<<<<< Updated upstream

run_maple("maple/orm.mp");
// (async () => {
//    //await run_maple("maple/README.mp");
//    await run_maple("maple/orm.mp");
//     // let r = await mcore.exec("ls /", "zsh");
//     // print(r);
// })();
=======
//run_maple("maple/zsh.completion.mp");
//run_maple("maple/README.mp");

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



async function f() {
    throw new Error("Whoops!");
}

async function f2() {
    await f1();
}
(async => {
    f2();
})()


>>>>>>> Stashed changes
