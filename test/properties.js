var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/properties.js');

test('word', function (t) {
    t.deepEqual(
        detective(src, { properties: ['async'] }),
        [ 'a', 'b', 'c', 'events', 'doom', 'y', 'events2' ]
    );
    t.end();
});
