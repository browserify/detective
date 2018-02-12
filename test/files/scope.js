(function(modules){
    modules[1](function(i){return modules[i]()})
})({1:[function (require,module,exports) {
    require('./y')
},{'./y':2}],2:function(require,module,exports){
    console.log("abc")
}})
require('./z')
