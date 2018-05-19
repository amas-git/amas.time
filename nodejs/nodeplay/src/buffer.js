var fs = require('fs');
fs.readFile('/etc/passwd', function (error, buffer) {
    var isBuffer = Buffer.isBuffer(buffer);
    console.log(isBuffer);
});