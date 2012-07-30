var esprima = require('esprima');

var traverse = function (node, cb) {
    if (Array.isArray(node)) {
        node.forEach(function (x) {
            traverse(x, cb);
        });
    }
    else if (node && typeof node === 'object') {
        cb(node);
        Object.keys(node).forEach(function (key) {
            traverse(node[key], cb);
        });
    }
};

var walk = function (src, cb, opts) {
    var ast = esprima.parse(src.toString());
    traverse(ast, cb);
};

var exports = module.exports = function (src, opts) {
    return exports.find(src, opts).strings;
};

exports.find = function (src, opts) {
    if (!opts) opts = {};
    var word = opts.word === undefined ? 'require' : opts.word;
    
    var modules = { strings : [], expressions : [] };
    
    if (src.toString().indexOf(word) == -1) return modules;
    
    walk(src, function (node) {
        var isRequire =
            node.type === 'CallExpression'
            && node.callee.type === 'Identifier'
            && node.callee.name === word
        ;
        if (isRequire) {
            if (node.arguments.length && node.arguments[0].type === 'Literal') {
                modules.strings.push(node.arguments[0].value);
            }
            else {
                modules.expressions.push('...');
            }
        }
    });
    
    return modules;
};
