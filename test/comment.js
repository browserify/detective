var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/comment.js');

test('comment', function (t) {
    var modules = detective.find(src);
    t.deepEqual(modules.strings, [ 'beep' ]);
    t.notOk(modules.nodes, 'has no nodes');
    t.end();
});
