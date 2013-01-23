'use strict';

goog.provide('angular.core.directives');

goog.require('angular.core.module');
goog.require('angular.core.Scope');
goog.require('angular.core.$Anchor');
goog.require('angular.core.Directive');

angular.core.module.value({
  'directive:[bind]': ['$text', '$value',
    /**
     * @param textSetter
     * @param expr
     * @constructor
     * @implements {angular.core.Directive}
     */
    function(textSetter, expr) {
      /**
       * @param {angular.core.Scope} scope
       */
      this.attach = function(scope) {
        //TODO(misko): no matter how much type annotation I put here it still
        // lets me do the wrong thing. Change .$watch to .attach to see that no
        // error is produced.
        scope.$watch(expr, textSetter);
      };
    }
  ],

  'directive:[bindAttr]': ['@*', '$value', function(attrSetter, attrName, expr) {
    attrSetter = attrSetter(attrName);
    return {
      attach: function(scope) {
        scope.$watch(expr, attrSetter);
      }
    }
  }],

  'directive:[click]': ['$on_click', '$value', function(onClick, expr) {
    return {
      attach: function(scope) {
        onClick(function(event) {
          event.preventDefault();
          scope.$apply(expr);
        });
      }
    }
  }],

  'directive:[mouseOver]': ['$on_mouseOver', '$value', function(onMouseOver, expr) {
    return {
      attach: function(scope) {
        onMouseOver(function(event) {
          event.preventDefault();
          scope.$apply(expr);
        });
      }
    }
  }],

  'directive:[fadeOut]': ['$on_remove', function(onRemove) {
    return {
      attach: function(scope) {
        onRemove(function(event) {
          var defaultFn = event.preventDefault();

          setTimeout(defaultFn, 500);
          event.element.className += ' fadeout';
        });
      }
    }
  }],

  'directive:[fadeIn]': ['$on_insert', function(onInsert) {
    return {
      attach: function(scope) {
        onInsert(function(event) {
          var defaultFn = event.preventDefault(),
              originalClass = event.element.className;

          event.element.className = originalClass + ' reverse fadeout';
          defaultFn();
          setTimeout(function() {
            event.element.className = originalClass + ' reverse';
          }, 0)
          setTimeout(function() {
            event.element.className = originalClass;
          }, 500)
        });
      }
    }
  }]
}).
factory('directive:[controller]', ['$injector', function($injector) {
  WrapperController.$inject = ['$value', '$anchor'];
  WrapperController.$transclude = '.';

  function WrapperController(value, anchor) {
    this.attach = function(scope) {
      var childScope = scope.$new();

      // create new instance (block) and attach it
      var block = anchor.newBlock();
      block.attach(childScope);
      block.insertAfter(anchor);

      // TODO(vojta): use locals() once it's fixed
      var localInjector = $injector.load([['$provide', function($provide) {
        $provide.value('$scope', childScope);
      }]]);

      // instantiate the controller
      localInjector.get('controller:' + value);
    };
  }

  return WrapperController;
}]).

value('directive:input[type=text]', ['ngModel', '$on_keydown_change', '$prop_value', function(model, onChange, value){
  this.attach = function(scope) {
    onChange(function() {
      setTimeout(function() {
        scope.$apply(function() {
          model.setValue(value());
        });
      }, 0);
    });
  };
}]).
factory('directive:[ngModel]', ['$parse', function($parse) {

  NgModelController.$inject = ['$value'];
  NgModelController.$name = 'ngModel';
  NgModelController.$templateUrl = '';

  function NgModelController (expr) {
    var getter = $parse(expr),
        setter = getter.assign;

    this.setValue = function(value) {
      setter(this.scope, value);
    }

    this.attach = function(scope) {
      this.scope = scope;
    }
  }

  return NgModelController;
}]).
factory('directive:[repeat]', function($parse) {
  RepeatController.$transclude = '.';
  RepeatController.$inject = ['$anchor', '$value'];
  /**
   * @param {angular.core.Anchor} anchor
   * @param {string|Array.<string>} parameter
   * @constructor
   */
  function RepeatController(anchor, parameter) {
    var collectionGetter,
        itemSetter;

    assertArg(parameter, 'parameter');

    if (isString(parameter)) {
      parameter = parameter.split(' in ');
    }

    collectionGetter = $parse(parameter[1]);
    itemSetter = $parse(parameter[0]).assign;

    this.attach = function(scope) {
      var previousBlockMap = new HashMap();

      scope.$watch(function() {
        var collection = collectionGetter(scope) || EMPTY_ARRAY,
            currentBlockMap = new HashMap(),
            i, ii = collection.length,
            value, block, previousBlock,
            iterationScope;

        // find which blocks need to be removed
        for(i = 0; i < ii; i++) {
          value = collection[i];
          block = previousBlockMap.remove(value);
          if (block) {
            currentBlockMap.put(value, block);
          }
        }
        // remove blocks
        for(var key in previousBlockMap) {
          if (previousBlockMap.hasOwnProperty(key)) {
            previousBlockMap[key].remove();
          }
        }
        previousBlockMap = currentBlockMap;
        previousBlock = anchor;

        for(i = 0; i < ii; i++) {
          value = collection[i];
          block = previousBlockMap.get(value);

          if (!block) {
            block = anchor.newBlock();
            iterationScope = scope.$new();
            itemSetter(iterationScope, value);
            previousBlockMap.put(value, block);
            block.$valueHashKey = hashKey(value);
            iterationScope.$index = i;
            block.attach(iterationScope);
            block.insertAfter(previousBlock);
          } else if (previousBlock.next == block) {
            // do nothing
          } else {
            // move block.
            block.moveAfter(previousBlock);
          }
          previousBlock = block;
        }

      });
    }
  }
  return RepeatController;
});
