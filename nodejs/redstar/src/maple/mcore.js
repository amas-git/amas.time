const spawn = require('child_process').spawn;
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

module.exports = {
    walk,
    exec
};