var acorn = require('acorn');
var defined = require('defined');

var ST_NONE = 0;
var ST_SAW_NAME = 1;
var ST_INSIDE_CALL = 2;
var ST_MEMBER_EXPRESSION = 3;

module.exports = function findFast(src, opts) {
    if (!opts) opts = {};
    if (typeof src !== 'string') src = String(src);
    if (opts.word === undefined) opts.word = 'require';

    var tokenizer = acorn.tokenizer(src, opts.parse);
    var token;
    var state = ST_NONE;

    var opener;
    var args = [];

    var modules = { strings: [], expressions: [] };
    if (opts.nodes) modules.nodes = [];

    while ((token = tokenizer.getToken()) && token.type !== acorn.tokTypes.eof) {
        if (state !== ST_INSIDE_CALL && token.type === acorn.tokTypes.dot) {
            state = ST_MEMBER_EXPRESSION;
        } else if (state === ST_NONE && token.type === acorn.tokTypes.name && mayBeRequire(token)) {
            state = ST_SAW_NAME;
            opener = token;
        } else if (state === ST_SAW_NAME && token.type === acorn.tokTypes.parenL) {
            state = ST_INSIDE_CALL;
            args = [];
        } else if (state === ST_INSIDE_CALL) {
            if (token.type === acorn.tokTypes.parenR) { // End of fn() call
                if (args.length === 1 && args[0].type === acorn.tokTypes.string) {
                    modules.strings.push(args[0].value);
                } else if (args.length > 0) {
                    modules.expressions.push(src.slice(args[0].start, args[args.length - 1].end));
                }

                if (opts.nodes) {
                    // Cut `src` at the end of this call, so that parseExpressionAt doesn't consider the `.abc` in
                    // `require('xyz').abc`
                    var chunk = src.slice(0, token.end);
                    var node = acorn.parseExpressionAt(chunk, opener.start, opts.parse);
                    modules.nodes.push(node);
                }

                state = ST_NONE;
            } else {
                args.push(token);
            }
        } else {
            state = ST_NONE;
        }
    }
    return modules;

    function mayBeRequire(token) {
        return token.type === acorn.tokTypes.name &&
            token.value === opts.word;
    }
}
