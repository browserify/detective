var acorn = require('acorn');
var defined = require('defined');
var hasOwn = Object.prototype.hasOwnProperty;
var cachedRegExps = {
    require: /\b(?:require|import|export)\b/g
};

function getOrCreateRegExp(word) {
    var regExp = hasOwn.call(cachedRegExps, word)
        ? cachedRegExps[word]
        : cachedRegExps[word] = new RegExp(
            cachedRegExps.require.source.replace("require", word),
            "g"
        );
    regExp.lastIndex = 0;
    return regExp;
}

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

function isNode(value) {
    return value
        && typeof value === "object"
        && typeof value.type === "string"
        && typeof value.start === "number"
        && typeof value.end === "number";
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

    var wordRe = getOrCreateRegExp(word);

    // Use the wordRe regular expression to determine all possible indexes
    // where the desired word might appear in the source. As we walk the
    // AST, we will examine the .start and .end offsets of each node, and
    // ignore nodes that do not contain any of the possible indexes. Some
    // of the possible indexes may be be spurious, but the AST traversal
    // will prune out those false positives.
    var possibleIndexes = [], match;
    while ((match = wordRe.exec(src))) {
        possibleIndexes.push(match.index);
    }

    if (!possibleIndexes.length) {
        return modules;
    }

    var ast = parse(src, opts.parse);

    function walk(node, left, right) {
        if (left >= right) {
            // The window of possible indexes is empty, so we can ignore
            // the entire subtree rooted at this node.
        } else if (Array.isArray(node)) {
            for (var i = 0, len = node.length; i < len; ++i) {
                walk(node[i], left, right);
            }
        } else if (isNode(node)) {
            var start = node.start;
            var end = node.end;

            // Narrow the left-right window to exclude possible indexes
            // that fall outside of the current node.
            while (left < right && possibleIndexes[left] < start) ++left;
            while (left < right && end < possibleIndexes[right - 1]) --right;

            if (left < right) {
                if (node.type === "CallExpression" && isRequire(node)) {
                    var args = node.arguments;
                    var argc = args.length;
                    if (argc > 0) {
                        var arg = args[0];
                        if (arg.type === "Literal" &&
                            typeof arg.value === "string") {
                            modules.strings.push(arg.value);
                        } else {
                            modules.expressions.push(src.slice(arg.start, arg.end));
                        }
                    }

                } else if (node.type === "ImportDeclaration" ||
                           node.type === "ExportNamedDeclaration" ||
                           node.type === "ExportAllDeclaration") {
                    if (node.source) {
                        // The .source of an ImportDeclaration or
                        // Export{Named,All}Declaration is always a
                        // string-valued Literal node, if not null.
                        modules.strings.push(node.source.value);
                    }

                } else {
                    // Continue traversing the children of this node.
                    var keys = Object.keys(node);
                    for (var i = 0, len = keys.length; i < len; ++i) {
                        var key = keys[i];

                        switch (key) {
                        case "type":
                        case "loc":
                        case "start":
                        case "end":
                            // Ignore common keys that are never nodes.
                            continue;
                        }

                        walk(node[key], left, right);
                    }

                    return;
                }

                if (opts.nodes) {
                    modules.nodes.push(node);
                }
            }
        }
    }

    walk(ast, 0, possibleIndexes.length);
    
    return modules;
};
