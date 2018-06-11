const minimatch = require("minimatch")
const REGEX_SECTION = /^#([-]{4,256})\|\s([@]*[a-z_A-Z]*)(.*)$/;
const REGEX_SECTION_END = /^#[-]{4,256}[\|]*\s*$/;
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

const Maple = {
    name: "",
    level: 0,
    content: [],
    result: "",
    set params(text) {
        this.__params = text.trim().split(/\s+/);
    },
    get params(){
        return this.__params;
    }
}

function isIterable(o) {
    return o == null ? false : typeof o[Symbol.iterator] === 'function';
}

const LOG_TAG = ['maple','info'];

function _(tag, text) {
    if(LOG_TAG.includes(tag)) {
        console.log(`[${tag}] : ${text}`);
    }
}

function destructure_expr(o) {
    const keys = Object.keys(o);
}

function mkTemplateStrings(env, template) {
    function transId(xs) {
        return xs;
    }
    let keys = transId(Object.keys(env));
    return eval(`let {${keys.join(",")}} = env; \`${template.replace(/`/g, '\\`')}\``);
}

function maple(file) {
    const maple = {
        src: {
            main:{}
        },
        filename: '',
        content: [],
        lines: 0,
        length: 0,
        handler: {},
        queue: [],
        match: [],
        functions: {},
        config: {
            editor: "vim",
            trace: true
        },
        trace: [],
        push(name, params) {
            let m    = Object.create(Maple);
            m.name   = name;
            m.params = params;
            maple.queue.push(m);

            // 如果是matcher, 添加到match集合中
            if('@match' === m.name) {
                maple.match.push(m);
            }

            let c = maple.queue.length > 1 ? maple.queue[maple.queue.length-2] : null;
            if(c) {
                c.content = maple.content;
                // maple function
                if(!c.name.startsWith('@')) {
                    maple.functions[c.name] = function ($,$1,$2,$3,$4,$5,$6,$7,$8,$9,...params) {
                        let jscode   = [];
                        let template = [];
                        let isheader = true;
                        let _stop = false;
                        let _ret = "";
                        function stop (ret="") {
                            _stop = true;
                            _ret = ret;
                        }
                        for(let l of c.content) {
                            if(l.startsWith('#') && isheader){
                                jscode.push(l.slice(1));
                            } else {
                                template.push(l);
                                isheader = false;
                            }
                        }
                        eval(jscode.join('\n'));
                        if(_stop) {
                            return _ret;
                        }
                        return eval('`' + template.join('\n').replace(/`/g, '\\`') + '`');
                    };
                }

                maple.content=[];
            }
        },

        end() {
            if(maple.content && maple.queue.length > 0) {
                maple.queue[maple.queue.length-1].content = maple.content;
                maple.content = [];
            }
        },
        run_matcher() {
            if(maple.match.length === 0) {
                return;
            }

            walk(null, maple.src.main, (CONTEXT, NAME, $) => {
                maple.match.forEach((m) => {
                    if(!m.params[0]){
                        return;
                    }
                    let ID = CONTEXT.path.join('/');
                    if(minimatch(ID, m.params[0])) {
                        m.result += eval('`' + m.content.join('\n').replace(/`/g, '\\`') + '`') + '\n';
                    }
                })
            });
        },
        eval() {
            // 调用处理器
            for (let m of maple.queue) {
                if(['@match','@walk'].includes(m.name)) { continue; }

                // TODO: 检查是否是函数
                if(maple.handler[m.name]) {
                    m.result = maple.handler[m.name](m, m.content, m.params);
                }
            }
        },
        print() {
            for (let m of maple.queue) {
                if(m.result) {
                    console.error(m.result);
                }
            }
        }

    };

    function foreach(o, name, ...params) {
        let r=[];
        if(Object.keys(o).length > 0) {
            for (let key in o) {
                let $ = o[key];
                $["KEY"]=key;
                r.push(_(name)($,params));
            }
        } else {
            r.push(o);
        }
        return r.join("\n");
    }

    function _(name) {
        return maple.functions[name];
    };

    function evalInContext($, content) {
        if(Array.isArray($)) {
            return E(content.join('\n'));
        }
        let ret = eval(`let {${Object.keys($)}} = $;`
            + '`'+content.join('\n').replace(/`/g,'\\`')+'`'
        );
        return ret;
    };

    maple.handler["@e"]=(maper, content, params)=>{
        return evalInContext(maple.src.main, content);
    };

    maple.handler["@foreach"]=(maper, content, params)=>{
        let rs = [];
        for(let p of params) {
            eval(`var $$ = maple.src.main.${p};`);
            if(isIterable($$)) {
                for($ of $$) {
                    rs.push(evalInContext($, content));
                }
            }
        }
        return rs.join('\n');
    };

    maple.handler["@echo"]=(maper, content, params)=>{
        return content.join('\n');
    };

    maple.handler["@js"]=(maper, content, params)=>{
        eval(content.join('\n'));
        return null;
    };

    maple.handler["@src"]=(maper, content, params)=>{
        eval(`maple.src.main={${content.join('\n')}};`);
        return null;
    };

    maple.handler["@match"]=(maper, content, params) => {
        maple.match.push(maper);
        return null;
    };

    maple.filename = file;

    require('readline').createInterface({
        input: require('fs').createReadStream(file)
    }).on('line', function (line) {
        maple.lines +=1;
        maple.length+=line.length;

        let match = null;
        if(match = REGEX_SECTION.exec(line)) {
            let handler = match[2].trim();
            maple.push(handler, match[3]);
        } else if(match = REGEX_SECTION_END.exec(line)) {

        } else {
            maple.content.push(line);
        }

    }).on('close',() => {
        maple.end();
        maple.eval();
        maple.run_matcher();
        maple.print();
    });
}

/**
 * 遍历指定的objects
 * @param context
 * @param o
 * @param f
 */
function walk(context, o, f) {
    if(context == null) {
        context = {
            level: 0,
            path: [''],
            type: (typeof o),
            key: ""
        }
    }

    if((o === null) || Object.keys(o).length === 0 || (typeof o === 'string') || (typeof o === 'number')) {
        return;
    }

    for(let k in o) {
        let ctx = {path: [...context.path, k], type: (typeof o[k]), level: context.level+1, key: k};

        if(f) {
            f(ctx, k, o[k]);
        }
        walk(ctx, o[k], f);
    }
}

maple("maple/hello.mp");
//
// console.log(mkTemplateStrings({a:1,b:2}, "a+b=${a+b}"));