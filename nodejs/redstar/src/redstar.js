const cheerio = require('cheerio');
const request = require('request');




async function httpGet(url) {
    return new Promise((resolve,reject) => {
        request(url, function (error, response, body) {
            if(error) {
                resolve("");
            }
            console.log(response);
            resolve(response.body);
        });
    })
}

// (async () => {
//     const response = await httpGet("http://www.baidu.com");
//     console.log(response);
// })()



var person = {
    age: 19,
    sex: 'M'
};

function evalTemplate(template) {
    eval('var str=`' + template + '`');
    return str;
}

console.log(evalTemplate('Zhoujb age=${person.age}'));


const obj = [
    {level:1, id:"1", nodes:[]},
    {level:2, id:"1.1", nodes:[]},
    {level:3, id:"1.1.1", nodes:[]},
    {level:2, id:"1.2", nodes:[]},
    {level:3, id:"1.2.1", nodes:[]},
    {level:3, id:"1.1.2", nodes:[]}
];




function mktree(xs, parent={level:0, id:"root", nodes:[]}, level="level", child='nodes') {
    let stack = [parent];
    let top = stack.pop();

    for(let i=0; i<xs.length; ++i) {
        let x = xs[i];

        while (x[level] <= top[level] && stack.length > 0) {
            top = stack.pop();
        }
        top[child].push(x);
        stack.push(top);
        stack.push(x);
        top = x;
    }
    return parent;
}

function _cp(xs, ys) {
    const rs=[];
    for(let x of xs) {
        for(let y of ys) {
            rs.push(Array.isArray(x) ? [...x,y] : [x, y]);
        }
    }
    return rs;
}

function cp(r, ...xs){
    xs.forEach((x) => { r = _cp(r, x);});
    return r;
}

function foldl(xs, f, z) {
    if(xs.length === 0) {
        return z;
    }
    return foldl(xs.slice(1),f,f(z,xs[0]));
}



console.log(JSON.stringify(mktree(obj),null,2));


console.log(foldl([1,2,3,4],(x,y)=>{ return x-y;}, 0))


console.log(cp([{a:1},2,3,4,5,6,7,8],['a','b'], ['A','B']));


function eprint(expr) {
    console.log('${expr}  -> ' + eval(expr));
}

eprint("");
eprint(12);
eprint('true');
eprint('false');
eprint('1>0 && 2<1');