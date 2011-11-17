'use strict';

function $InterpolateProvider(){
  this.$get = ['$parse', function($parse){
    return function(text, templateOnly) {
      var bindings = parseBindings(text);
      if (hasBindings(bindings) || !templateOnly) {
        var fn = compileBindTemplate(text);
        return function(scope) {
          return fn(scope);
        }
      }
    };
  }];
}
