'use strict';

/**
 * This is very simple implementation of testing browser's features.
 * It's used only internally by $browser, $location
 */
function $SnifferProvider(){
  this.$get = ['$window', function($window){
    return {
      history: !!($window.history && $window.history.pushState),
      hashchange: 'onhashchange' in $window &&
                  // IE8 compatible mode lies
                  (!$window.document.documentMode || $window.document.documentMode > 7)
    };
  }];
}
