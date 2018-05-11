var acorn = require('acorn-node');
var defined = require('defined');

var ST_NONE = 0;
var ST_SAW_NAME = 1;
var ST_INSIDE_CALL = 2;
var ST_MEMBER_EXPRESSION = 3;
var ST_REDEF_PATTERN = 4;
var ST_REDEFINED = 5;

var REQUIRE_REDEF_PATTERN = [
    function (token) { return token.type === acorn.tokTypes.braceL; }, // {
    function (token) { return token.type === acorn.tokTypes.num || token.type === acorn.tokTypes.string; }, // 0
    function (token) { return token.type === acorn.tokTypes.colon; }, // :
    function (token) { return token.type === acorn.tokTypes.bracketL; }, // [
    function (token) { return token.type === acorn.tokTypes._function; }, // function
    function (token) { return token.type === acorn.tokTypes.parenL; }, // (
    function (token, opts) { return token.type === acorn.tokTypes.name && token.value === opts.word; }, // require
];

module.exports = function findFast(src, opts) {
    if (!opts) opts = {};
    if (typeof src !== 'string') src = String(src);
    if (opts.word === undefined) opts.word = 'require';

    var tokenizer = acorn.tokenizer(src, opts.parse);
    var token;
    var state = ST_NONE;
    // Current index in the require redefinition pattern.
    var redefIndex = 0;
    // Block scope depth when require was redefined. This is used to match the
    // correct } with the opening { after the redefining function parameter list.
    var redefDepth = 0;

    var opener;
    var args = [];

    var modules = { strings: [], expressions: [] };
    if (opts.nodes) modules.nodes = [];

    while ((token = tokenizer.getToken()) && token.type !== acorn.tokTypes.eof) {
        if (state === ST_REDEFINED) {
            if (token.type === acorn.tokTypes.braceL) redefDepth++;
            if (token.type === acorn.tokTypes.braceR) redefDepth--;
            if (redefDepth === 0) {
                state = ST_NONE;
            }
            continue;
        }
        if (state === ST_REDEF_PATTERN) {
            if (redefIndex >= REQUIRE_REDEF_PATTERN.length) {
                // the { after the function() parameter list
                if (token.type === acorn.tokTypes.braceL) {
                    state = ST_REDEFINED;
                    redefDepth = 1;
                }
                continue;
            } else if (REQUIRE_REDEF_PATTERN[redefIndex](token, opts)) {
                redefIndex++;
                continue;
            } else {
                redefIndex = 0;
                state = ST_NONE;
            }
        }

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
                } else if (args.length === 3 // A template string without any expressions
                          && args[0].type === acorn.tokTypes.backQuote
                          && args[1].type === acorn.tokTypes.template
                          && args[2].type === acorn.tokTypes.backQuote) {
                    modules.strings.push(args[1].value);
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
        } else if (REQUIRE_REDEF_PATTERN[0](token)) {
            state = ST_REDEF_PATTERN;
            redefIndex = 1;
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
