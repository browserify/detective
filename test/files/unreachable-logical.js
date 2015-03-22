true && require('1');
true || require('2');

false && require('3');
false || require('4');

'production' !== 'development' && require('5');
'production' !== 'development' || require('6');

'development' !== 'development' && require('7');
'development' !== 'development' || require('8');

hello() && require('9');
hello() || require('10');
