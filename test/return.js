var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = [ 'require("a")\nreturn' ];

test('return', function (t) {
    t.plan(2);
    t.deepEqual(detective(src), [ 'a' ]);
    t.deepEqual(detective(src, { fullParse: true }), [ 'a' ]);
});
