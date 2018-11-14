var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/generators.js');

test('generators', function (t) {
    t.plan(2);
    t.deepEqual(detective(src), [ 'a', 'b' ]);
    t.deepEqual(detective(src, { fullParse: true }), [ 'a', 'b' ]);
});
