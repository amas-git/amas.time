const M = require('./M');
const _ = require('lodash');
const path = require('path');
const mcore  = require('./mcore');
var maple_path = [];

/**
 * TODO:
 *  最重要的: handler, maple func, userfunc大一统, 2019年前必须搞定
 *  1. 用array.some()改写正则匹配部分
 *  3. 性能统计: eval求值时间，次数，产生的字符数量等等
 *  4. 实现pipe
 * HISTORY:
 *  1. 2018.06.18: Finished Core Design
 *  2. use function all instead of eval&let, the function parmas limit will be a problems
 * @param text
 *  6. 用迭代代替mktree|printrs递归方式
 *  7. 提供一些打印上下文信息的调试函数，方便定位问题
 *  8. **可以把section编译成js函数
 *  FIXME:
 *
 *  结果正确 != 过程正确
 */


const DEBUG = true;

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
        this.pipes    = []; // 级联函数序列
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
        print(this.pipes, "   PIPE");
        let time = Date.now() - start;
        this.time = time;
        return rs;
    }

    static ROOT() {
        return new Section(0, "part", 2048);
    }

    static fromMEXPR(id, text, level) {
        let ts = mcore.parseMEXPR(text);
        let [[name, ...params],...cmds] = ts;
        let section = new Section(id, name.replace(/^[@]/,''), level, params);
        section.pipes = ts;
        return section;
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

        function getsub(o, expr) {
            if(!/[a-zA-Z_.]+$/.test(expr)) {
                return null;
            }
            let chunk = expr.split(".");
            let r = o;
            chunk.forEach( c => r = r[c]);
            return r;
        }

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
            // FIXME: 当对象为a.b这种形式的时候会无法获取
            let os = getsub(env.context, expr);
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
        env.restoreContext();
        return mcore.flat(rs);
    },

    src(env, section) {
        let name = section.params[0] || "main";
        let rs   = section.mapFlat(env);
        env.src[name] = M(`module.exports={${rs.join('\n')}}`);
        env.changeContext(env.src.main);
        return [];
    },

    json(env, section) {
        let name      = section.params[0] || "main";
        let rs        = section.mapFlat(env);
        env.src[name] = JSON.parse(rs.join(""));
        env.changeContext(env.src.main);
        return [];
    },

    yaml(env, section) {
        let name      = section.params[0] || "main";
        let rs        = section.mapFlat(env);
        env.src[name] = mcore.objectFromYamlString(rs.join("\n"));
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

    addSection(mexpr, level=0) {
        this.currentSection = Section.fromMEXPR(this.seq++,mexpr, level);
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

            match = /^#([-]{4,2048})[|][\s]*(.*)/.exec(line);

            if (match) {
                let [,level, mexpr] = match;
                maple.addSection(mexpr, level.length);
                return;
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

//run_maple("maple/orm.mp");
run_maple("maple/test_yaml.mp");


function pipe() {

}