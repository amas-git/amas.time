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