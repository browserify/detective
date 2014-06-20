var esprima = require('esprima-fb');
var escodegen = require('escodegen');

var traverse = function (node, cb) {
    if (Array.isArray(node)) {
        node.forEach(function (x) {
            if(x != null) {
                x.parent = node;
                traverse(x, cb);
            }
        });
    }
    else if (node && typeof node === 'object') {
        cb(node);

        Object.keys(node).forEach(function (key) {
            if (key === 'parent' || !node[key]) return;
            node[key].parent = node;
            traverse(node[key], cb);
        });
    }
};

var walk = function (src, opts, cb) {
    var ast = esprima.parse(src, opts);
    traverse(ast, cb);
};

var exports = module.exports = function (src, opts) {
    return exports.find(src, opts).strings;
};

exports.find = function (src, opts) {
    if (!opts) opts = {};
    opts.parse = opts.parse || {};
    opts.parse.tolerant = true;
    
    var word = opts.word === undefined ? 'require' : opts.word;
    if (typeof src !== 'string') src = String(src);
    src = src.replace(/^#![^\n]*\n/, '');
    
    var modules = { strings : [], expressions : [] };
    if (opts.nodes) modules.nodes = [];
    
    // Ensure opt.word is an array
    var requireDict = {};
    if ('string' === typeof word) requireDict[word] = word;
    else if (word.constructor === Array) 
        word.forEach(function(elem) {
            requireDict[elem] = elem;
        });
    else requireDict = word;
    var passed = Object.keys(requireDict).some(function(elem, idx) {
        return src.indexOf(elem) !== -1;
    });
    if (!passed) return modules;
    
    var isRequire = opts.isRequire || function (node) {
        var c = node.callee;
        return c
            && node.type === 'CallExpression'
            && c.type === 'Identifier'
            && requireDict[c.name] !== undefined
        ;
    };    
    
    walk(src, opts.parse, function (node) {
        if (!isRequire(node)) return;
        var name = node.callee.name;
        if (node.arguments.length) {
            if (node.arguments[0].type === 'Literal') {
                var id = node.arguments[0].value;
                if ('function' === typeof requireDict[name]) {
                    id = requireDict[name](id);
                }
                modules.strings.push(id);
            }
            else {
                modules.expressions.push(escodegen.generate(node.arguments[0]));
            }
        }
        if (opts.nodes) modules.nodes.push(node);
    });
    
    return modules;
};
