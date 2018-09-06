const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const proc = require('process');

const type = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

/**
 * 遍历指定的objects
 * @param o
 * @param f
 * @param context
 */
function walk(o, f, context = {path:[], level:0}) {
    if((o === null) || Object.keys(o).length === 0 || (typeof o === 'string') || (typeof o === 'number')) {
        return;
    }

    for(let k in o) {
        let ctx = {path: [...context.path, k], level: context.level+1};

        if(f) {
            f(ctx, k, o[k]);
        }
        walk(ctx, o[k], f);
    }
}

async function exec(content, cmd, ...argv) {
    const proc = spawn(cmd, [...argv]);
    proc.stdout.setEncoding("utf8");
    proc.stdin.setEncoding("utf8");

    return new Promise((resolve,reject) => {
        try {
            let rs = [];
            proc.stdin.write(content);
            proc.stdin.end();
            proc.stdout.on("data", function (data) {
                rs.push(data.toString());
                //console.log(data)
            });
            proc.on("close", function (status) {
                resolve({status:status, rs: rs});
            });

        } catch (e) {
            reject({status: -1, error: e.toString()});
        }
    });
}

function mktree(xs, root=xs[0], level="level", child='nodes') {
    function parentOf(xs, x, anchor) {
        for(let i=anchor-1; i>=0; i--) {
            if(xs[i][level] > x[level]) { // TODO: override with isParent function & export it
                return xs[i];
            }
        }
        return null;
    }

    for(let i=1; i<xs.length; ++i) {
        let p = parentOf(xs, xs[i], i);
        p[child].push(xs[i]);
    }

    //console.error(root);
    return root;
}

function object(maple_path, name) {
    let mpath   = [];
    let scriptd = path.dirname(name);
    if(scriptd) {
        mpath.push(scriptd);
    }
    mpath.push(...maple_path);
    let target = search_target(mpath, path.basename(name));
    return target ? fs.readFileSync(target) : "";
}

/**
 * Search specify target file under CWD, SCRIPT_DIR, MAPLE_PATH
 * @param search_path
 * @param name
 * @returns undefined if not found
 */
function search_target(search_path, name) {
    for (let dir of search_path) {
        let fullpath = path.join(dir, name);
        if (fs.existsSync(fullpath)) {
            return fullpath;
        }
    }
    return undefined;
}

function joinObjects(os) {
    let r = os.reduce((r,e) => { return _.assign(r, e); }, {});
    return r;
}

function convertId(keys=[]) {
    //println(keys, "bind");
    return keys.map((key)=>{
        if(key.match(/\d+/)) {
            return `$${key}`;
        }
        // TODO: support more convertion
        // TODO: when the array keys is large, only keep 9 id
        return key;
    });
}

function mcall(os, code) {
    return new Function(convertId(Object.keys(os)), code).apply(null, Object.values(os));
}

function exeval($os, $code) {
    return mcall(joinObjects($os), `${$code}`);
}

function template(env, template) {
    let $T       = template.replace(/`/g, '\\`');
    return exeval(env.expose(), `return \`${$T}\`;`);
}

function flat(input){
    const stack = [...input];
    const res = [];
    while (stack.length) {
        // pop value from stack
        const next = stack.pop();
        if (Array.isArray(next)) {
            // push back array items, won't modify the original input
            stack.push(...next);
        } else {
            res.push(next);
        }
    }
    //reverse to restore input order
    return res.reverse();
}

function shuffle(xs=[]) {
    return xs.sort(() => { return Math.random() - 0.5; });
}

module.exports = {
    exeval,
    template,
    mktree,
    walk,
    exec,
    flat,
    object,
    type,
    shuffle
};