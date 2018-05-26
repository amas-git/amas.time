const REGEX_SECTION = /^#[-]{4,256}\|\s(@[a-z_A-Z]*)(.*)$/;

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 *
 * @param text
 */
// function e(template) {
//     return eval('`'+template.replace(/`/g,'\\`')+'`');
// }

function error(text) {
    console.error(text);
}

const Maple = {
    name: "",
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

function _info(text) {
    _('info', text);
}

function maple(file) {
    const maple = {
        filename: '',
        content: [],
        lines: 0,
        length: 0,
        handler: {},
        queue: [],
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

            let c = maple.queue.length > 1 ? maple.queue[maple.queue.length-2] : null;
            if(c) {
                c.content = maple.content;
                maple.content=[];
            }
        },

        end() {
            if(maple.content && maple.queue.length > 0) {
                maple.queue[maple.queue.length-1].content = maple.content;
                maple.content = [];
            }
        },

        eval() {
          for(let m of maple.queue) {
              m.result = maple.handler[m.name](m.content, m.params);
              console.error(m.result);
          }
        }
    };

    maple.handler["@e"]=(content, params)=>{
        let rs = [];
        for(let p of params) {
            eval(`var $$ = ${p};`);
            if(isIterable($$)) {
                for($ of $$) {
                    rs.push(eval('`'+content.join('\n').replace(/`/g,'\\`')+'`'));
                }
            }
        }
        return rs.join("\n");
    };

    maple.handler["@echo"]=(content, params)=>{
        return content.join('\n');
    };

    maple.handler["@js"]=(content, params)=>{
        eval(content.join('\n'));
        return null;
    };

    maple.handler["@select"]=(content, params) => {

    }

    maple.filename = file;

    require('readline').createInterface({
        input: require('fs').createReadStream(file)
    }).on('line', function (line) {
        maple.lines +=1;
        maple.length+=line.length;

        let match = null;
        if(match = REGEX_SECTION.exec(line)) {
            let handler = match[1];
            if(handler && maple.handler[handler]) {
                maple.push(handler, match[2]);
            } else {
                error("NOT FOUND HANDLER: " + handler);
            }
        } else {
            maple.content.push(line);
        }

    }).on('close',() => {
        maple.end();
        maple.eval(maple);
    });
}
//console.log(process.env);
console.log(process.cwd());
maple("maple/hello.mp");
