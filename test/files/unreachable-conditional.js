true ? require('1') : require('2');
false ? require('3') : require('4');

'production' !== 'development' ? require('5') : require('6');
'development' !== 'development' ? require('7') : require('8');

hello() ? require('9') : require('10');
