var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/nested.js');

test('nested', function (t) {
    t.deepEqual(detective(src), [ 'a', 'c' ]);
    t.end();
});

test('nested with unreachables', function (t) {
    t.deepEqual(detective(src, {unreachables: true}), [ 'a', 'b', 'c' ]);
    t.end();
});
