var events = require('events');
var util = require('util');


function asyncFunction() {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Async Hello world');
        }, 1000);
    });
}

console.log("Let's GOGOGOG");

// asyncFunction().then(function ( ) {
//     console.log(value);    // => 'Async Hello world'
// }).catch(function (error) {
//     console.log(error);
// });
//
//
//
// function syncFunction() {
//     return new Promise(function (resolve, reject) {
//         setTimeout(function () {
//             resolve('xxxx');
//         }, 10000);
//     });
// }
//
//
// async function sleep() {
//     console.log("A");
//     const ret = await syncFunction();
//     console.log("B");
// }
//
//
// sleep();
//
//
//
//
//
// Promise.resolve(12).then(function (value) {
//    console.log("value="+value);
// });


function add(a) {
    return a+1;
}

function double(a) {
    return 2*a;
}
function onRejected(error) {
    console.log(error);// => "throw Error @ Task A"
}

function finalTask(value) {
    console.log("result="+value);
}

var promise = Promise.resolve(2);
promise
    .then(add)
    .then(double)
    .then(double)
    .then(double)
    .then(double)
    .then(finalTask);d

var fs = require('fs');
fs.readFile('/etc/passwd', function (error, buffer) {
    var isBuffer = Buffer.isBuffer(buffer);
    console.log(buffer.toString('base64'));
});



var messages = new Messages();
util.inherits(Messages,events.EventEmitter);

function Messages() {
    events.EventEmitter.call(this);
}

messages.on('start', function (message) {
    console.log(message);
});

messages.emit("start", "MESSAGE START");
