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

function maple(file) {
    const maple = {
        filename: '',
        content: [],
        lines: 0,
        length: 0,
        handler: {},
        queue:[
            {
                handler: "@e",
                params: [],
                content: [],
                result: null    
            }
        ],
        config: {
            editer: "vim",
            trace: true
        },
        trace: []
    };

    maple.handler["@e"]=(content)=>{
        return eval('`'+content.join('\n').replace(/`/g,'\\`')+'`');
    };

    maple.handler["@echo"]=(content)=>{
        return content.join('\n');
    }


    maple.filename = file;

    require('readline').createInterface({
        input: require('fs').createReadStream(file)
    }).on('line', function (line) {
        maple.lines +=1;
        maple.length+=line.length;


        let match = null;
        if(match = REGEX_SECTION.exec(line)) {
            //console.log(match[1]);
            let handler = match[1];
            if(handler && maple.handler[handler]) {
                let result = maple.handler[handler](maple.content);
                if(maple.config.trace) {
                    console.log(handler + " <- " + maple.content.join('\n'));
                }
                console.log(result);
                maple.content=[];
            } else {
                error("NOT FOUND HANDLER: " + handler);
            }
        } else {
            maple.content.push(line);
        }

    }).on('close',() => {
        //console.log(maple);
    });


   // console.log(maple.handler["@echo"]("this is boob"));
}




// console.log(process.env);
console.log(process.cwd());
maple("maple/hello.mp");