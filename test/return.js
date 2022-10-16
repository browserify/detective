var test = require('tape');
var detective = require('../');
var fs = require('fs');
var src = [ 'require("a")\nreturn' ];

test('return', function (t) {
    t.plan(1);
    t.deepEqual(detective(src), [ 'a' ]);
});
