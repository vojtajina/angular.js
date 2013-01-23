// extracted from angular-mocks.js
(function() {
  var currentSpec = null;

  beforeEach(function() {
    currentSpec = this;
  });

  afterEach(function() {
    currentSpec.$injector = null;
    currentSpec.$modules = null;
    currentSpec = null;
  });

  function isSpecRunning() {
    return currentSpec && currentSpec.queue.running;
  }

  window.module = function() {
    var moduleFns = Array.prototype.slice.call(arguments, 0);
    return isSpecRunning() ? workFn() : workFn;
    /////////////////////
    function workFn() {
      if (currentSpec.$injector) {
        throw Error('Injector already created, can not register a module!');
      } else {
        var modules = currentSpec.$modules || (currentSpec.$modules = []);
        angular.forEach(moduleFns, function(module) {
          modules.push(module);
        });
      }
    }
  };

  window.inject = function() {
    var blockFns = Array.prototype.slice.call(arguments, 0);
    var errorForStack = new Error('Declaration Location');
    return isSpecRunning() ? workFn() : workFn;
    /////////////////////
    function workFn() {
      var modules = currentSpec.$modules || [];
      var injector = currentSpec.$injector;

      modules.unshift('core');

      if (!injector) {
        injector = currentSpec.$injector = angular.injector(modules);
      }
      for(var i = 0, ii = blockFns.length; i < ii; i++) {
        try {
          injector.invoke(blockFns[i] || angular.noop, this);
        } catch (e) {
          if(e.stack) e.stack +=  '\n' + errorForStack.stack;
          throw e;
        } finally {
          errorForStack = null;
        }
      }
    }
  };
})();
