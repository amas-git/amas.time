


function randomIn(min, max) {
    return Math.round(Math.random() * (max - min))  + min;
}

const TAGS = new Set(["g_memory"]);
function print(tag, o) {
    TAGS.has(tag) && console.log(`${tag.toUpperCase()} : ${typeof o === 'string' ? o : JSON.stringify(o) }`);
}

class Task {
    constructor(name, time = randomIn(1,100)) {
       this.name = name;
       this.time = time;
    }

    process(params, callback) {
        setTimeout(() => {
            callback(this._do(params));
        }, this.time);
    }

    _do(params) {
        let result = { task: this.name, result : randomIn(10,99) };
        print(`CALL Task@${this.name} WITH ${JSON.stringify(params)}`, ` = ${JSON.stringify(result)}`);
        return result;
    }

    _process(params) {
        return new Promise( resolve => {
            setTimeout(() => {
                resolve(this._do(params));
            }, this.time);
        });
    }

    __process(next, params) {
        this.process(params, (result) => {
            next(result);
        });
    }


    static createTasks(n) {
        let rs = [];
        for(let i=0; i<n; ++i) {
            rs.push(new Task(`task-${i}`));
        }
        return rs;
    }
}


let task1 = new Task("task1");
let task2 = new Task("task2");
let task3 = new Task("task3");

// task1.process("");
// task2.process("");
// task3.process("");

//callback 顺序执行
// task1.process("init", (result) => {
//     task2.process(result, (result) => {
//         task3.process(result, (result) => {
//             print(`ALL DONE: ${result}`);
//         }) ;
//     });
// });

//
task1._process("init")
    .then(result => {
        return task2._process(result);
    })
    .then(result => {
        return task3._process(result);
    }).then((result) => {
        //print("ALL DONE", result);
    });

(async () => {
    let r1 = await task1._process("init");
    let r2 = await task2._process(r1);
    let r3 = await task3._process(r2);
    print("ALL DONE", r3);
})();

const g = runGenorator();
function * runGenorator() {
    let r1 = yield task1.__process(g.next.bind(g), "init");
    let r2 = yield task2.__process(g.next.bind(g), r1);
    let r3 = yield task3.__process(g.next.bind(g), r2);
    print("ALL DONE", r3);
}

//g.next();

function * range(min, max) {
    for(let i=min; i<max; ++i) {
        yield i;
    }
}

let [...xs] = range(1, 10);

function * runTasks(generator, tasks=[], param) {
    for(let task of tasks) {
        r = yield task.__process(generator.next.bind(gg), r);
    }

    return r;
}

console.log(xs);

function runGenerator(gFn, ...argv) {
    let g = gFn(argv);
    return g.next();
}

let r  = runGenorator(range, 1, 10);
console.error(JSON.stringify(r));

function async(generatorFunction) {
    function callback(...argv) {
        generator.next(argv);
    }

    let generator = generatorFunction(callback);
    generator.next();
}

function fn() {
    print("ARGUMENGS", arguments);
    print("ARGUMENGS", [].slice.call(arguments, 1));
}

fn(1,2,3);


r = async(function * (callback) {
    let a = new Task("a");

    let ra  = yield a.process("init", callback);

    let b = new Task("b");
    let rb  = yield b.process(ra, callback);
});

print("r", r);

function cp(from, to) {
   async(function * (callback) {
        const fs = require('fs');
        let [err, data] = yield fs.readFile(from, "utf8", callback);
        if(data) {
            // console.log(data);
        }
   });
}

cp("/etc/hosts", "");


function * add() {
    let a = yield;
    let b = yield;
    return a + b;
}

let Add = add();
print("",Add.next());
print("",Add.next(1));
print("",Add.next(2));



function * g_memory(value) {
    while (true) yield value;
}

let cache = g_memory(100);

print("g_memory", `cache=${cache.next().value}`);

const fs = require("fs");
const stream = require("stream");

class Yes extends stream.Readable {

    constructor(value, size) {
        super();
        this.value = value;
        this.size  = size;
        this.counter = 0;
    }

    _read(size) {
        if(this.counter == this.size) {
            this.push(null);
            return;
        }
        this.push(this.value);
        this.counter++;
    }

}

class Echo extends stream.Transform {
    constructor() {
        super({encoding: "utf8", highWaterMark : 1024});
    }

    _transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
    }

    _flush(callback) {
        this.push("GAME OVER");
        callback();
    }
}

class R1 extends stream.Readable {
    constructor() {
        super();
    }

    _read(size) {

    }
}

class W1 extends stream.Writable {
    _write(chunk, encoding, callback) {
        //process.stdout.write(chunk.toString().toUpperCase());
        this.writableBuffer.push("aaa");
        callback();
    }
}
//class UpperCaseStream extends s


let yes = new Yes("o\n", 100);
let echo = new Echo();

//process.stdin.pipe(echo).pipe(process.stdout);


//process.stdin.pipe(new R1()).pipe(process.stdout);


var proxy = new Proxy({a: 10}, {
    get: function(target, property, receiver) {

        console.log(target[property]);
        return 35;
    }
});


function watchConstruct(obj) {
    return new Proxy(obj, { construct(target, args) {
            console.log(`new ${target}`);
            return new target(...args);
        }});
}

class A {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

}

new (watchConstruct(A)("name1",17));