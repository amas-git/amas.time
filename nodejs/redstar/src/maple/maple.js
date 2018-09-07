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


class Section {
    constructor(id, name, level, params=[]) {
        this.id       = id;
        this.name     = name;
        this.level    = level;
        this.contents = [];
        this.params   = params;
        this.sections = [];
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

    map(env, rs=[]) {
        rs.push(mcore.template(env, this.join("\n")));
        this.sections.forEach((s) => {
            rs.push(s.eval(env));
        });
        return rs;
    }

    mapFlat(env, rs=[]) {
        return mcore.flat(this.map(env,rs));
    }

    eval(env) {
        let rs = env.handlers[this.name](env, this);
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
        // @foreach x:xs
        // @foreach xs -> @foreach $:xs
        let rs = [];
        if (_.isEmpty(section.params)) {
            return rs;
        }

        let [xname, xs_name = xname] = section.params[0].split(':');
        if (xname === xs_name) {
            xname = '$';
        }

        env.changeContextToChild(xs_name);
        let os = env.context[xs_name];

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
        let content = mcore.flat(section.map(env));
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
        this.__context = {stack:[]};
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

    async eval() {
        let rs = await this.root.eval(this);
        print("==============================");
        print(rs, "RS");
        return rs;
    }

    static printrs(xs) {
        return mcore.flat(xs).join("\n");
    }
}

async function run_maple(file) {
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


(async () => {
    await run_maple("maple/README.mp");
    // let r = await mcore.exec("ls /", "zsh");
    // print(r);
})();