var assert = require('assert');
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/strings/src.js');

exports.single = function () {
    assert.deepEqual(detective(src), [ 'a', 'b', 'c' ]);
};
