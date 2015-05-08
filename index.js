var aparse = require('acorn').parse;
var booleanCondition = require('esmangle-evaluator').booleanCondition;
var defined = require('defined');

var requireRe = /\brequire\b/;

function parse (src, opts) {
    if (!opts) opts = {};
    return aparse(src, {
        ecmaVersion: defined(opts.ecmaVersion, 6),
        ranges: defined(opts.ranges, opts.range),
        locations: defined(opts.locations, opts.loc),
        allowReturnOutsideFunction: defined(
            opts.allowReturnOutsideFunction, true
        ),
        strictSemicolons: defined(opts.strictSemicolons, false),
        allowTrailingCommas: defined(opts.allowTrailingCommas, true),
        forbidReserved: defined(opts.forbidReserved, false)
    });
}
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
        if (cb(node) === false) return;

        Object.keys(node).forEach(function (key) {
            if (key === 'parent' || !node[key]) return;
            node[key].parent = node;
            traverse(node[key], cb);
        });
    }
};

var walk = function (src, opts, cb) {
    var ast = parse(src, opts);
    traverse(ast, cb);
};

var isUnreachable = function (node) {
    var p = node.parent;
    if (!p) return false;
    if (p.type === 'LogicalExpression') {
        if (p.right !== node) return false;
        var leftEval = booleanCondition(p.left);
        return (leftEval === true && p.operator === '||')
            || (leftEval === false && p.operator === '&&');
    }
    if (p.type === 'IfStatement' || p.type === 'ConditionalExpression') {
        var testEval = booleanCondition(p.test);
        return (testEval === true && p.alternate === node)
            || (testEval === false && p.consequent === node);
    }
    return false;
};

var exports = module.exports = function (src, opts) {
    return exports.find(src, opts).strings;
};

exports.find = function (src, opts) {
    if (!opts) opts = {};
    opts.parse = opts.parse || {};
    opts.parse.tolerant = true;
    
    var unreachables = opts.unreachables === true;
    var word = opts.word === undefined ? 'require' : opts.word;
    if (typeof src !== 'string') src = String(src);
    src = src.replace(/^#![^\n]*\n/, '');
    
    var isRequire = opts.isRequire || function (node) {
        var c = node.callee;
        return c
            && node.type === 'CallExpression'
            && c.type === 'Identifier'
            && c.name === word
        ;
    }
    
    var modules = { strings : [], expressions : [] };
    if (opts.nodes) modules.nodes = [];
    
    var wordRe = word === 'require' ? requireRe : RegExp('\\b' + word + '\\b');
    if (!wordRe.test(src)) return modules;
    
    walk(src, opts.parse, function (node) {
        if (!unreachables && isUnreachable(node)) return false;
        if (!isRequire(node)) return;
        if (node.arguments.length) {
            if (node.arguments[0].type === 'Literal') {
                modules.strings.push(node.arguments[0].value);
            }
            else {
                modules.expressions.push(escodegen.generate(node.arguments[0]));
            }
        }
        if (opts.nodes) modules.nodes.push(node);
    });
    
    return modules;
};
