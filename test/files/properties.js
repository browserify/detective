var a = require('a');
var b = require.async('b');
var c = require.async('c');
var abc = a.b(c);

var EventEmitter = require('events').EventEmitter;

var x = require.async('doom')(5,6,7);
x(8,9);
c.load('notthis');
var y = require.async('y') * 100;

var EventEmitter2 = require('events2').EventEmitter();
