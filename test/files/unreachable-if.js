if (true) {
    require('1');
} else {
    require('2');
}

if (true) {
    require('3');
} else if (true) {
    require('4');
} else {
    require('5');
}

if (false) {
    require('6');
} else {
    require('7');
}

if (false) {
    require('7');
} else if (false) {
    require('8');
} else {
    require('9');
}

if ('production' !== 'development') {
    require('10');
} else {
    require('11');
}

if ('development' !== 'development') {
    require('12');
} else {
    require('13');
}

if (hello()) {
    require('14');
} else {
    require('15');
}

if (hello()) {
    require('16');
} else if (true) {
    require('17');
} else {
    require('18');
}
