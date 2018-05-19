'use strict'
const Koa = require('koa');
const app = new Koa();
const request = require('request');


console.log(typeof "hello");

app.use(async context => {
    context.body = "Hello KOA";
});

//app.listen(8888);

const object = {
    age: 18,
    sex: "M"
};

object.age = 18;
console.log(object.age);
Object.preventExtensions(object);
// object.a = "1234"; 因为使用preventExtensions阻止了继续向object中添加属性

Object.seal(object);

console.log(`${object.sex} ${JSON.stringify(Object.getOwnPropertyDescriptor(object, "age"))}`);




//## 删除属性
//delete object.age;
//console.log(object.age);


const object2 = {
    _foo_:0,
    get foo() {
        return this._foo_;
    },
    set foo(foo) {
        this._foo_ = foo*2;
    }
}

object2.foo = 100;

console.log(Object.getOwnPropertyDescriptors(object2, "foo"));
console.log(object2.foo );
console.log(object2.hasOwnProperty("foo"));  // 只检测当前对象
console.log(object2.hasOwnProperty("foo1"));
console.log(("foo" in object2)); // 检测当前对象及原型链
console.log(JSON.stringify(object2.prototype));


const object3 = {
    a: 1,
    b: 2,
    c: 3,
    d: {
        d1:  {
            hello: 0
        },
        d2: 'b'
    }
}

//Object.defineProperties(object3, "b", {enumerable: false});
console.log(`${object3.d.d1}`);
for (let k in object3) {
    console.log(`${k}=${object3[k]}`);
}

// for(let k of object3) {
//     console.log(k);
// }


[1,2,3,4,5,6].forEach(x => {
    console.log(x);
})

const xs = [1,2,3,4,5,6,7];

xs.map((e,i) => {
   console.log(`${i} ${e}`);
});

console.log(xs.map((e,i) => ++i));

const ys = xs.map(x => {
    return 2*x;
});
console.log(ys);
console.log(xs.filter(x => x % 2 == 0));
console.log(xs.every(x => x > 1));
console.log(xs.every(x => x > 0));
console.log(xs.some(x => x == 2));
console.log(Array(20).fill().map((e,i) => ++i));


for(let i in xs) {
    console.log(":"+i);
}


for(let v of xs) {
    console.log(":"+v);
}


// 定义了对象的迭代器之后就可以使用 for...of来遍历对象中的值了
const _random = {
    [Symbol.iterator] : () => {
        return {
            next : () => {
                return {value : Math.random()};
            }
        }
    }
}

for(let x of _random) {
    console.log(x);
    break; // 防止死循环
}


const r = request('http://www.baidu.com', (error,response,body) => {
    console.log("HEADER: " + response.statusCode+ " : " + response.statusMessage);
    console.log(JSON.stringify(response));
});

function random(min, max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
}

for (let i=0; i<100; ++i) {
    console.log(random(100,200));
}

const  task1 =  new Promise((resolve, reject) => {
    const delay = random(100, 200);
    const startTime = Date.now();
    setTimeout(()=>{
        console.log(`TASK 1 : DONE (delay=${delay}) ${Date.now() - startTime}`);
        resolve();
    }, random(100, 200));
})


const  task2 =  new Promise((resolve, reject) => {
    const delay = random(100, 200);
    const startTime = Date.now();
    setTimeout(()=>{
        console.log(`TASK 2 : DONE (delay=${delay}) ${Date.now() - startTime}`);
        resolve();
    }, random(100, 200));
})


Promise.all([task1, task2]).then(()=>{
    console.log("ALL DONE");
});

Promise.race([task1, task2]).then(()=>{
    console.log("ONE DONE");
});


Promise.resolve(1).then(x => {
    console.log(`x = ${x}`)
}, err => {
    console.log("ERROR");
}).catch(err => {
    console.log("ERROR!!!");
});
