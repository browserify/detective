var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/unreachable-logical.js');

test('unreachable-logical', function (t) {
    t.plan(1);
    t.deepEqual(detective(src), [ '1', '4', '5', '8', '9', '10' ]);
});
