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



function print(o, tag="") {
    if(o) {
        let c = JSON.stringify(o, null, 2).split("\n");
        c = c.map((s) =>{ return `[${tag}] : ${s}`; } );
        console.error(c.join("\n"));
    }
}
function println(o, tag="") {
    if(o) {
        let c = JSON.stringify(o).split("\n");
        c = c.map((s) =>{ return `[${tag}] : ${s}`; } );
        console.error(c.join("\n"));
    }
}

function error(e) {
    console.log(e);
}

function joinObjects(os) {
    let r = os.reduce((r,e) => { return _.assign(r, e); }, {});
    return r;
}

function convertId(keys=[]) {
    println(keys, "bind");
    return keys.map((key)=>{
        if(key.match(/\d+/)) {
            return `$${key}`;
        }
        // TODO: support more convertion
        // TODO: when the array keys is large, only keep 9 id
        return key;
    });
}

function mcall(os, code) {
    return new Function(convertId(Object.keys(os)), code).apply(null, Object.values(os));
}

function exeval($os, $code) {
    return mcall(joinObjects($os), `${$code}`);
}

function template(env, template) {
    let $T       = template.replace(/`/g, '\\`');
    return exeval(env.expose(), `return \`${$T}\`;`);
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
        this.contents = [];
        this.params   = [];
        this.sections = [];
        this.sep      = "\n";
    }


    test(env) {
        let $expr = this.params.join("").trim();
        if(_.isEmpty($expr)) {
            return true;
        }

        let r = false;
        try {
            println(env.__context, `[${$expr}]`);
            r = exeval(env.expose(), `return ${$expr};`);
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
        //let rs = {id:this.id, rs:[], sep: this.sep};
        env.changeContext(argv(params, args));
        let rs = this._eval(env);
        env.restoreContext();

        return Maple.printrs(rs);
    }

    part(env) {
        let rs = [];
        if (this.test(env)) {
            rs.push(template(env, this.join("\n")));
            this.sections.forEach((s) => {
                rs.push(s.eval(env));
            });
        }
        return rs;
    }

    norm(env) {
        let rs = [...this.contents];
        for(let section of this.sections) {
            rs.push(section.eval(env));
        }
        let r = env.handlers[this.name](env, this, mcore.flat(rs)) || [];
        return r;
    }

    foreach(env) {
        // @foreach x:xs
        // @foreach xs -> @foreach $:xs
        let rs = [];
        if (_.isEmpty(this.params)) {
            return rs;
        }

        let [xname, xs_name = xname] = this.params[0].split(':');
        if (xname === xs_name) {
            xname = '$';
        }

        let os = env.context[xs_name];
        let key = _.isArray(os) ? xs_name : "";
        env.changeContext(os, key);


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
            rs.push(template(env, this.join("\n")));
            for(let s of this.sections) {
                rs.push(s.eval(env));
            }
            env.restoreContext();
        });
        env.restoreContext();
        return mcore.flat(rs);
    }

    eval(env) {
        let rs=[];
        if(this.name === "foreach") {
            rs.push(this.foreach(env));
        } else if(this.name === "part") {
            rs.push(this.part(env));
        } else {
            rs.push(this.norm(env));
        }
        println(`${this.name} -> ${rs}`, 'eval');
        return rs;
    }

    static createRootNode() {
        return new Section("part", "part", 2048);
    }
}

const BASE_HANDLER = {

    src(env, section, content) {
        let name = section.params[0] || "main";
        env.src[name] = M(`module.exports={${content.join('\n')}}`);
        print(env.src.main, name);
        env.changeContext(env.src.main);
        return [];
    },

    srcfile(env, section, content) {
        let name = section.params[0] || "main";
        let c = [];

        content.forEach( f => {
            let text = mcore.object(env.mpath, f);
            if(text) {
                c.push(text);
            }
        });
        env.src[name] = M(`module.exports={${c.join(",")}}`);
        env.changeContext(env.src.main);
        return [];
    },

    mod(env, section, content) {
        let name = section.params[0];
        let mod = M(`${content.join('\n')}`);
        if (name) {
            env.mod[name] = mod;
        } else {
            _.assign(env.functions, mod);
        }
        return [];
    }
    //
    // zsh(env, content, params) {
    //     let r = mcore.exec(content.join("\n"), "zsh");
    //     return r;
    // },
    //
    // debug(env, content, params) {
    //     //console.log(JSON.stringify(env.sections, null, 2));
    // }
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
        return _.last(this.__context.stack);
    }

    changeContext(ctx, key="") {
        let _ctx = ctx;
        if(key) {
            _ctx = {};
            _ctx[key] = ctx;
        }
        this.__context.stack.push(_ctx);
        println(this.__context, "+CTX");
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
        this.currentSection = new Section(name, name, level);
        this.currentSection.id = this.seq++;
        this.currentSection.params = params;
        this.sections.push(this.currentSection);

        if(name === "func") {
            let [fname,  ...params] = this.currentSection.params;
            let section = this.currentSection;
            this.addFunction(fname,(...args) => {
                return section.apply(this, params, args);
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
        //print(this.root);
    }


    eval() {
        let rs = this.root.eval(this);
        print("==============================");
        print(rs, "RS");
        return rs;
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

function x(a,b) {
    function m() {
        return a+b;
    }

    function n() {
        return a*b;
    }
    return {m,n};
}

//console.log(x(1,2).n());

//run_maple("maple/zsh.completion.mp");
run_maple("maple/README.mp");


// print(ys);
// function reduceFunctions(fns=[], init) {
//     return fns.reduce((r,e) => { return e(r); }, init);
// }
//
// let r  = reduceFunctions([(e)=>{ return e.join('\n');}, (e)=>{ return e.toUpperCase(); }], ["aaaa", "bbbb", "cccc"]);
// console.log(r);