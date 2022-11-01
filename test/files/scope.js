(function(modules){
    modules[1](function(i){return modules[i]()})
})({1:[function (require,module,exports) {
    require('./y') // inside a bundle; should not be detected
},{'./y':2}],2:function(require,module,exports){
    console.log("abc")
}})

(function (require) {
    require('./x'); // not inside a bundle; should be detected
}(require)); // (because someone might do this)
require('./z')
