const minimatch = require("minimatch")

/**
 * TODO:
 *  1. 用array.some()改写正则匹配部分
 *
 * @param text
 */
function error(text) {
    console.error(text);
}

function E(template) {
    return eval('`' + template.replace(/`/g, '\\`') + '`');
}

function isIterable(o) {
    return o == null ? false : typeof o[Symbol.iterator] === 'function';
}

function mkTemplateStrings(env, template) {
    function transId(xs) {
        return xs;
    }
    let keys = transId(Object.keys(env));
    return eval(`let {${keys.join(",")}} = env; \`${template.replace(/`/g, '\\`')}\``);
}

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

const SectionType = {
    ROOT: 'root',
    FUNC: 'func',
    TEXT: 'text',
    NORM: 'norm',
    PART: 'part'
};

Object.freeze(SectionType);

class Section {
    /**
     *
     * @param name section name
     * @param type section type
     * @param level section level
     */
    constructor(name, type, level) {
        this.name = name;
        this.type  = type;
        this.level = level;
        this.sections = [];
        this.contents = [];
    }

    addChildSection(section) {

    }

    isRoot() {
        return this.type == SectionType.ROOT;
    }

    isFunc() {
        return this.type == SectionType.FUNC;
    }

    static createRootNode() {
        return new Section("root",SectionType.ROOT,0);
    }
};

function treelize(sections, parent=Section.createRootNode()) {
    if(sections.length == 0) {
        return parent;
    }

    parent.addChildSection(treelize(sections))
    for(let s of sections) {
        if(s.level < parent.level) {
            parent.addChildSection(s);
        }
    }
}

class Maple {
    constructor(file) {
        this.currentSection = null;
        this.file = file;
        this.handlers = [];
        this.sections = [];
        this.functions= [];

    }

    toString() {
        return `MAPLE:${this.file}`;
    }

    addSection(name, params, level=0) {
        let type = SectionType.TEXT;
        if(!name) {
            type = SectionType.PART;
        } else {
            type = name.startsWith('@') ? SectionType.NORM : SectionType.FUNC;
        }


        this.currentSection = new Section(name, type, level);
        if(this.currentSection.isFunc()) {
            this.functions.push(this.currentSection);
        } else {
            this.sections.push(this.currentSection);
        }
    }

    addContent(content) {
        if(this.currentSection) {
            this.currentSection.contents.push(content);
        }
    }

    print() {
        console.log(JSON.stringify(this,null,4));
    }
};

function run_maple(file) {
    const maple = new Maple(file);

    readline(file, (line, num) => {
        if(line == null) {
            maple.print();
        }

        let match;

        if(match = /^#([-]{4,256})\|\s([@]*[a-z_A-Z]*)(.*)$/.exec(line)) {
            let level  = match[1].length;
            let name   = match[2].trim();
            let params = match[3].trim().split(/\s+/);
            maple.addSection(name, params, level);
        } else if(match = /^#([-]{4,256})[\|]*\s*$/.exec(line)) {
            let level = match[1].length;
            maple.addSection("", [], level);
        } else {
            maple.addContent(line);
        }

    });

}

function readline(file, cb) {
    let num = 0;
    require('readline').createInterface({
        input: require('fs').createReadStream(file)
    }).on('line', function (line) {
        cb(line,num++);
    }).on('close',() => {
        cb(null,num++);
    });
}



run_maple("maple/hello.mp");