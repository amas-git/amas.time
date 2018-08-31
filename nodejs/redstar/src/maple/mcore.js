const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
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

function exec(content, cmd, ...argv) {
    const proc = spawn(cmd, [...argv]);
    proc.stdout.setEncoding("utf8");
    proc.stdin.setEncoding("utf8");

    new Promise((resolve,reject) => {
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
    }).then(({status, rs}) => {
        console.log(rs.join("\n"));
    });
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

module.exports = {
    walk,
    exec,
    object,
    type
};



function _exeval($os, $code) {
    return eval(expose($os, $code));
}

/**
 * @param $stack object array
 * @param $code code to evaluated under the given stack
 * @returns {string} result code to eval
 */
function expose($os, $code) {
    function convertId(keys) {
        return keys.map((key)=>{
            if(key.match(/\d+/)) {
                return `$${key}`;
            }
            // TODO: support more convertion
            // TODO: when the array keys is large, only keep 9 id
            return key;
        });
    }
    let rs  = [];
    let level = 0;

    $os.forEach((e,i) => {
        if(_.isEmpty(e)) return;

        let ids = convertId(Object.keys(e));
        if(_.isEmpty(ids)) return;

        rs.push(`let {${ids.join(',')}} = $os[${i}];{`);
        level+=1;
    });
    rs.push($code);
    rs.push("}".repeat(level));
    return rs.join("");
}