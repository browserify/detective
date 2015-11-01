var acorn = require('acorn');
var walk = require('acorn/dist/walk');
var defined = require('defined');

var requireRe = /\brequire\b/;

function parse (src, opts) {
    if (!opts) opts = {};
    return acorn.parse(src, {
        ecmaVersion: defined(opts.ecmaVersion, 6),
        sourceType: opts.sourceType,
        ranges: defined(opts.ranges, opts.range),
        locations: defined(opts.locations, opts.loc),
        allowReserved: defined(opts.allowReserved, true),
        allowReturnOutsideFunction: defined(
            opts.allowReturnOutsideFunction, true
        ),
        allowHashBang: defined(opts.allowHashBang, true)
    });
}

var exports = module.exports = function (src, opts) {
    return exports.find(src, opts).strings;
};

exports.find = function (src, opts) {
    if (!opts) opts = {};
    
    var word = opts.word === undefined ? 'require' : opts.word;
    if (typeof src !== 'string') src = String(src);
    
    var isRequire = opts.isRequire || function (node) {
        return node.callee.type === 'Identifier'
            && node.callee.name === word
        ;
    };
    
    var modules = { strings : [], expressions : [] };
    if (opts.nodes) modules.nodes = [];
    
    var wordRe = word === 'require' ? requireRe : RegExp('\\b' + word + '\\b');
    if (!wordRe.test(src)) return modules;
    
    var ast = parse(src, opts.parse);
    
    walk.simple(ast, {
        CallExpression: function (node) {
            if (!isRequire(node)) return;
            if (node.arguments.length) {
                var arg = node.arguments[0];
                if (arg.type === 'Literal') {
                    modules.strings.push(arg.value);
                }
                else {
                    modules.expressions.push(src.slice(arg.start, arg.end));
                }
            }
            if (opts.nodes) modules.nodes.push(node);
        }
    });
    
    return modules;
};
