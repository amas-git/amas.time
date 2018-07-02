const request = require('request');

module.exports = {
    http_get
};

async function http_get(url) {
    return new Promise((resolve,reject) => {
        request(url, function (error, response, body) {
            if(error) {
                resolve("");
            }
            resolve(response.body);
        });
    })
}

