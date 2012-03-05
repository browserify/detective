var uglify = require('uglify-js');

var traverse = function (node, cb) {
    // Call cb on all good AST nodes.
    if (Array.isArray(node) && node[0]
    && typeof node[0] === 'object' && node[0].name) {
        cb({ name : node[0].name, value : node.slice(1) });
    }
    
    // Traverse down the tree on arrays and objects.
    if (Array.isArray(node)
    || Object.prototype.toString.call(node) === "[object Object]") {
        for (var key in node) traverse(node[key], cb);
    }
};

var walk = function (src, cb) {
    var ast = uglify.parser.parse(src.toString(), false, true);
    traverse(ast, cb);    
};

var deparse = function (ast) {
    return uglify.uglify.gen_code(ast);
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
        var isRequire = node.name === 'call'
            && node.value[0][0] === 'name'
            && node.value[0][1] === word
        ;
        if (isRequire) {
            var expr = node.value[1][0];
            
            if (expr[0].name === 'string') {
                modules.strings.push(expr[1]);
            }
            else {
                modules.expressions.push(deparse(expr));
            }
        }
        
        var isDotRequire = (node.name === 'dot' || node.name === 'call')
            && node.value[0][0] === 'call'
            && node.value[0][1][0] === 'name'
            && node.value[0][1][1] === word
        ;
        
        if (isDotRequire) {
            var expr = node.value[0][2][0];
            if (expr[0].name === 'string') {
                modules.strings.push(expr[1]);
            }
            else {
                modules.expressions.push(deparse(expr));
            }
        }
        
        var isDotCallRequire = node.name === 'call'
            && node.value[0][0] === 'dot'
            && node.value[0][1][0] === 'call'
            && node.value[0][1][1][0] === 'name'
            && node.value[0][1][1][1] === word
        ;
        if (isDotCallRequire) {
            var expr = node.value[0][1][2][0];
            if (expr[0].name === 'string') {
                modules.strings.push(expr[1]);
            }
            else {
                modules.expressions.push(deparse(expr));
            }
        }
    });
    
    return modules;
};
