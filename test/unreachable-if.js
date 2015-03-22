var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/unreachable-if.js');

test('unreachable-if', function (t) {
    t.plan(1);
    t.deepEqual(
      detective(src),
      [ '1', '3', '7', '9', '10', '13', '14', '15', '16', '17' ]);
});
