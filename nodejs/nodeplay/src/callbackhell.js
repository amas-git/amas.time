var MyLibs = require('./mylibs');


console.log("START CALLBACK HELL");


function add(pa,pb) {
    return Promise.all([pa, pb]).then(function (value) {
        return value[0] + value[1];
    }).catch(function (reason) { console.error(reason) });
}

function getA() {
    //return Promise.resolve(1);
    return new Promise(function(r, reject) {
        setTimeout(function () {
            //r(1);
        }, 1000)
    });
}

function getB() {
    return new Promise(function(r, reject) {
        setTimeout(function () {
            //r(3);
        }, 2000)
    });
}

add(getA(), getB()).then(function (value) {
    console.log(value);
})


console.log(MyLibs.hellowold());
console.log(require.resolve('http'));


// 原型
function People(name) {
    this.name = name;
}

People.prototype.age = 1983;

console.log(new People('A'));
console.log(new People('B'));


console.log(typeof Object); //function
console.log(typeof Function); //function
console.log(typeof (new Object())); //object
var f = function () {

};
console.log(typeof f); // function


function id() {
    return this.name.toUpperCase();
}

function speek() {
    var message = "Hello, I'm " + id.call(this);
    console.log(message);
}

var a = {
    name : 'a'
};

var b = {
    name : 'b'
};

// id.call(a);
// id.call(b);

speek.call(a);
speek.call(b);

function func(num) {
    this.count ++;
    console.log(num);
}

func.count = 0;

for(let i=0; i<10; ++i) {
    func.call(func, i);
}

console.log(func.count); // ? 0




function foo() {
    console.log(this.a);
}

var o1 = {
    a: 1,
    foo: foo
}

var o2= {
    a: 2,
    o1: o1
}


o2.o1.foo();

var a = 100;

foo.call(o1);

fb = function() {
    foo.call(o2);
}

function bind(fn,obj) {
    return function () {
        fn.apply(obj);
    }
}
// fb = o2.o1.foo;
// fb();
//
//

console.log("---------------------");
// setTimeout(bind(foo, o1), 0);
// setTimeout(bind(foo, o2), 0);
// setTimeout(foo.bind(o1), 0);
// setTimeout(foo.bind(o2), 0);


function bar(ctx) {
    console.log(ctx.a);
}

bar(o1);

console.log("---------------------");

function fx(a) {
    console.log(this.a);
    if(this.a != 1) {
        this.a = a;
    }
    console.log(this.a);
}
fx.prototype.a = 0;

var fx_hardbind = fx.bind(o1);

fx_hardbind(111);
var x2 = new fx_hardbind(200);
//new fx_hardbind(111);