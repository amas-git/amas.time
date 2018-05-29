function nameOf(fn) {
    var f = typeof fn == 'function';
    var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
    return (!f && 'not a function') || (s && s[1] || 'anonymous');
}

function TEST_typeof() {
    const TAG = nameOf(TEST_typeof);
    function exec(expr) {
        let type = eval(`typeof ${expr}`);
        console.log(`[${TAG}] : ${expr} is ${type}`);
    }
    var a={};
    exec("'a'");
    exec('a');
    exec('null');
    exec('{}');
    exec('1');
    exec('1.');
    exec('"abcdefg"');
    exec('function(){}');
    exec('undefined');
    exec('b');
    exec('[1,2,3,4]');
}

function TEST_instanceof() {

}

function TEST_iterator() {
    let xs = [1,2,3,4];
    let object = {
        a:1,
        b:2,
    }

    for(let x in object) {
        console.log(x);
    }
    console.log(`xs is ${isIterable(xs)}`);
    console.log(`object is ${isIterable(object)}`);
    for(let y in ['a','b']) {
        console.log(y);
    }
    console.log(Object.keys(xs));
    console.log(Object.keys(1));
    console.log(Object.keys("abcdefg"));
}
function _nameOf(o) {
    return Object.keys({o})[0];
}
function TEST_walk() {
    let object = {
        num:1,
        data: [
            {name:'a', age:1},
            {name:'b', age:2},
            {name:'c', age:3}
        ],
        map: {
            A:1,
            B:2,
            C:3
        },
        NULL: null
    }

    walk(object, (context, name, value) => {
        console.log(`[walk] : ${JSON.stringify(context)}`);
    });

    let {num, NULL} = object;
    console.log("| -> "+ Object.keys(object))
}

//TEST_iterator();
//TEST_typeof();
//TEST_walk();