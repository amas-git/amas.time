

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