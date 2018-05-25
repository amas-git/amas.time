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
    params: [],
    result: ""
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

        push : (name, params) => {
            let m    = Object.create(Maple);
            m.name   = name;
            m.params = params;
            maple.queue.push(m);

            return maple.queue.length > 1 ? maple.queue[maple.queue.length-2] : null;
        }
    };

    maple.handler["@e"]=(content)=>{
        return eval('`'+content.join('\n').replace(/`/g,'\\`')+'`');
    };

    maple.handler["@echo"]=(content)=>{
        return content.join('\n');
    };

    maple.handler["@js"]=(content)=>{
        eval(content.join('\n'));
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
            let handler = match[1];
            if(handler && maple.handler[handler]) {

                let m = maple.push(handler, []);
                if (m != null) {
                    m.content = maple.content;
                    m.result = maple.handler[m.name](maple.content);
                    if(m.result) {
                        console.log(m.result);
                    }
                }
                maple.content=[];
            } else {
                error("NOT FOUND HANDLER: " + handler);
            }
        } else {
            maple.content.push(line);
        }

    }).on('close',() => {
        //console.log(maple);
        //console.log(JSON.stringify(maple.queue,null,2));
    });


   // console.log(maple.handler["@echo"]("this is boob"));
}




//console.log(process.env);
console.log(process.cwd());
maple("maple/hello.mp");