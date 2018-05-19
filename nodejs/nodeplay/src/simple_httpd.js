var http = require('http');
var fs = require('fs');
var zlib = require('zlib');


http.createServer(function (req, res) {
    res.writeHead(200, { 'content-encoding': 'gzip' });
    const stream = fs.createReadStream(__dirname+"/inde111x.html");
    stream.pipe(zlib.createGzip()).pipe(res);

    // 错误处理
    stream.on('error', function (error) {
        console.trace();
        console.error(error.stack);
        console.error(error);
    });


}).listen(8000);