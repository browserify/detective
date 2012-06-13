var parse = require('esprima').parse;

exports = module.exports = function (src, opts) {
    return exports.find(src, opts).strings;
};

exports.find = function (src, opts) {
    if (!opts) opts = {};
    var word = opts.word === undefined ? 'require' : opts.word;
    
    var modules = { strings : [], expressions : [] };
    
    src = '' + src;
    if (src.indexOf(word) == -1) return modules;
    
    var ast = parse(src, {
        range: true
    });

    var chunks = src.split('');

    var node2String = function(node) {
        if (node.range) {
            return chunks.slice(node.range[0], node.range[1] + 1).join('');
        } else {
            return '';
        }
    };

    var processAttr = function(node) {
        switch (node.type) {
            case 'Literal':
                return node.value;
            case 'BinaryExpression':
                return processAttr(node.left) + processAttr(node.right);
            default:
                throw new Error('Invalid expression ' + node.type + ': ' + node2String(node));
        }
    };

    var fn = function(node) {
        if (node.type === 'CallExpression' && node.callee.name === word && node.callee.type === 'Identifier') {
            var args = node['arguments'];
            for (var i = 0, len = args.length; i < len; i++) {
                var a = args[i];
                try {
                    modules.strings.push(processAttr(a));
                } catch (e) {
                    modules.expressions.push(node2String(a));
                }
            }
        }
    };

    var walk = function(node) {
        Object.keys(node).forEach(function(key) {
            var child = node[key];
            if (Array.isArray(child)) {
                child.forEach(function(c) {
                    if (c && typeof c === 'object' && c.type) {
                        walk(c, node);
                    }
                });
            } else if (child && typeof child === 'object' && child.type) {
                walk(child, node);
            }
        });
        fn(node);
    };
    walk(ast);

    return modules;
};
