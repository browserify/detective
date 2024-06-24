var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/scope.js');

test('scope', function (t) {
    t.plan(1);
    t.deepEqual(detective(src), [ './x', './z' ]);
});
