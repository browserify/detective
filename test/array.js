var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/array.js');

test('array', function (t) {
    t.deepEqual(detective(src), [ 'a', 'b' ]);
    t.end();
});
