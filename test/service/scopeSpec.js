'use strict';

describe('Scope', function() {

  describe('$root', function() {
    it('should point to itself', inject(function($rootScope) {
      expect($rootScope.$root).toEqual($rootScope);
      expect($rootScope.hasOwnProperty('$root')).toBeTruthy();
    }));


    it('should not have $root on children, but should inherit', inject(function($rootScope) {
      var child = $rootScope.$new();
      expect(child.$root).toEqual($rootScope);
      expect(child.hasOwnProperty('$root')).toBeFalsy();
    }));

  });


  describe('$parent', function() {
    it('should point to itself in root', inject(function($rootScope) {
      expect($rootScope.$root).toEqual($rootScope);
    }));


    it('should point to parent', inject(function($rootScope) {
      var child = $rootScope.$new();
      expect($rootScope.$parent).toEqual(null);
      expect(child.$parent).toEqual($rootScope);
      expect(child.$new().$parent).toEqual(child);
    }));
  });


  describe('$id', function() {
    it('should have a unique id', inject(function($rootScope) {
      expect($rootScope.$id < $rootScope.$new().$id).toBeTruthy();
    }));
  });


  describe('this', function() {
    it('should have a \'this\'', inject(function($rootScope) {
      expect($rootScope['this']).toEqual($rootScope);
    }));
  });


  describe('$new()', function() {
    it('should create a child scope', inject(function($rootScope) {
      var child = $rootScope.$new();
      $rootScope.a = 123;
      expect(child.a).toEqual(123);
    }));

    it('should create a non prototypically inherited child scope', inject(function($rootScope) {
      var child = $rootScope.$new(true);
      $rootScope.a = 123;
      expect(child.a).toBeUndefined();
      expect(child.$parent).toEqual($rootScope);
      expect(child.$new).toBe($rootScope.$new);
      expect(child.$root).toBe($rootScope);
    }));
  });


  describe('$watch/$digest', function() {
    it('should watch and fire on simple property change', inject(function($rootScope) {
      var spy = jasmine.createSpy();
      $rootScope.$watch('name', spy);
      $rootScope.$digest();
      spy.reset();

      expect(spy).not.wasCalled();
      $rootScope.$digest();
      expect(spy).not.wasCalled();
      $rootScope.name = 'misko';
      $rootScope.$digest();
      expect(spy).wasCalledWith('misko', undefined, $rootScope);
    }));


    it('should watch and fire on expression change', inject(function($rootScope) {
      var spy = jasmine.createSpy();
      $rootScope.$watch('name.first', spy);
      $rootScope.$digest();
      spy.reset();

      $rootScope.name = {};
      expect(spy).not.wasCalled();
      $rootScope.$digest();
      expect(spy).not.wasCalled();
      $rootScope.name.first = 'misko';
      $rootScope.$digest();
      expect(spy).wasCalled();
    }));


    it('should delegate exceptions', function() {
      module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });
      inject(function($rootScope, $exceptionHandler, $log) {
        $rootScope.$watch('a', function() {throw new Error('abc');});
        $rootScope.a = 1;
        $rootScope.$digest();
        expect($exceptionHandler.errors[0].message).toEqual('abc');
        $log.assertEmpty();
      });
    });


    it('should fire watches in order of addition', inject(function($rootScope) {
      // this is not an external guarantee, just our own sanity
      var log = '';
      $rootScope.$watch('a', function() { log += 'a'; });
      $rootScope.$watch('b', function() { log += 'b'; });
      $rootScope.$watch('c', function() { log += 'c'; });
      $rootScope.a = $rootScope.b = $rootScope.c = 1;
      $rootScope.$digest();
      expect(log).toEqual('abc');
    }));


    it('should call child $watchers in addition order', inject(function($rootScope) {
      // this is not an external guarantee, just our own sanity
      var log = '';
      var childA = $rootScope.$new();
      var childB = $rootScope.$new();
      var childC = $rootScope.$new();
      childA.$watch('a', function() { log += 'a'; });
      childB.$watch('b', function() { log += 'b'; });
      childC.$watch('c', function() { log += 'c'; });
      childA.a = childB.b = childC.c = 1;
      $rootScope.$digest();
      expect(log).toEqual('abc');
    }));


    it('should allow $digest on a child scope with and without a right sibling', inject(
        function($rootScope) {
      // tests a traversal edge case which we originally missed
      var log = '',
          childA = $rootScope.$new(),
          childB = $rootScope.$new();

      $rootScope.$watch(function() { log += 'r'; });
      childA.$watch(function() { log += 'a'; });
      childB.$watch(function() { log += 'b'; });

      // init
      $rootScope.$digest();
      expect(log).toBe('rabrab');

      log = '';
      childA.$digest();
      expect(log).toBe('a');

      log = '';
      childB.$digest();
      expect(log).toBe('b');
    }));


    it('should repeat watch cycle while model changes are identified', inject(function($rootScope) {
      var log = '';
      $rootScope.$watch('c', function(v) {$rootScope.d = v; log+='c'; });
      $rootScope.$watch('b', function(v) {$rootScope.c = v; log+='b'; });
      $rootScope.$watch('a', function(v) {$rootScope.b = v; log+='a'; });
      $rootScope.$digest();
      log = '';
      $rootScope.a = 1;
      $rootScope.$digest();
      expect($rootScope.b).toEqual(1);
      expect($rootScope.c).toEqual(1);
      expect($rootScope.d).toEqual(1);
      expect(log).toEqual('abc');
    }));


    it('should repeat watch cycle from the root elemnt', inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$watch(function() { log += 'a'; });
      child.$watch(function() { log += 'b'; });
      $rootScope.$digest();
      expect(log).toEqual('abab');
    }));


    it('should prevent infinite recursion and print watcher expression',inject(
        function($rootScope) {
      $rootScope.$watch('a', function() {$rootScope.b++;});
      $rootScope.$watch('b', function() {$rootScope.a++;});
      $rootScope.a = $rootScope.b = 0;

      expect(function() {
        $rootScope.$digest();
      }).toThrow('100 $digest() iterations reached. Aborting!\n'+
          'Watchers fired in the last 5 iterations: ' +
          '[["a; newVal: 96; oldVal: 95","b; newVal: 97; oldVal: 96"],' +
           '["a; newVal: 97; oldVal: 96","b; newVal: 98; oldVal: 97"],' +
           '["a; newVal: 98; oldVal: 97","b; newVal: 99; oldVal: 98"],' +
           '["a; newVal: 99; oldVal: 98","b; newVal: 100; oldVal: 99"],' +
           '["a; newVal: 100; oldVal: 99","b; newVal: 101; oldVal: 100"]]');
    }));


    it('should prevent infinite recursion and print print watcher function name or body',
        inject(function($rootScope) {
      $rootScope.$watch(function watcherA() {return $rootScope.a;}, function() {$rootScope.b++;});
      $rootScope.$watch(function() {return $rootScope.b;}, function() {$rootScope.a++;});
      $rootScope.a = $rootScope.b = 0;

      try {
        $rootScope.$digest();
        throw Error('Should have thrown exception');
      } catch(e) {
        expect(e.message.match(/"fn: (watcherA|function)/g).length).toBe(10);
      }
    }));


    it('should not fire upon $watch registration on initial $digest', inject(function($rootScope) {
      var log = '';
      $rootScope.a = 1;
      $rootScope.$watch('a', function() { log += 'a'; });
      $rootScope.$watch('b', function() { log += 'b'; });
      $rootScope.$digest();
      log = '';
      $rootScope.$digest();
      expect(log).toEqual('');
    }));


    it('should watch objects', inject(function($rootScope) {
      var log = '';
      $rootScope.a = [];
      $rootScope.b = {};
      $rootScope.$watch('a', function(value) {
        log +='.';
        expect(value).toBe($rootScope.a);
      });
      $rootScope.$watch('b', function(value) {
        log +='!';
        expect(value).toBe($rootScope.b);
      });
      $rootScope.$digest();
      log = '';

      $rootScope.a.push({});
      $rootScope.b.name = '';

      $rootScope.$digest();
      expect(log).toEqual('.!');
    }));


    it('should watch functions', function() {
      module(provideLog);
      inject(function($rootScope, log) {
        $rootScope.fn = function() {return 'a'};
        $rootScope.$watch('fn', function(fn) {
          log(fn());
        });
        $rootScope.$digest();
        expect(log).toEqual('a');
        $rootScope.fn = function() {return 'b'};
        $rootScope.$digest();
        expect(log).toEqual('a; b');
      })
    });


    it('should prevent $digest recursion', inject(function($rootScope) {
      var callCount = 0;
      $rootScope.$watch('name', function() {
        expect(function() {
          $rootScope.$digest();
        }).toThrow('$digest already in progress');
        callCount++;
      });
      $rootScope.name = 'a';
      $rootScope.$digest();
      expect(callCount).toEqual(1);
    }));


    it('should return a function that allows listeners to be unregistered', inject(
        function($rootScope) {
      var listener = jasmine.createSpy('watch listener'),
          listenerRemove;

      listenerRemove = $rootScope.$watch('foo', listener);
      $rootScope.$digest(); //init
      expect(listener).toHaveBeenCalled();
      expect(listenerRemove).toBeDefined();

      listener.reset();
      $rootScope.foo = 'bar';
      $rootScope.$digest(); //triger
      expect(listener).toHaveBeenCalledOnce();

      listener.reset();
      $rootScope.foo = 'baz';
      listenerRemove();
      $rootScope.$digest(); //trigger
      expect(listener).not.toHaveBeenCalled();
    }));


    it('should not infinitely digest when current value is NaN', inject(function($rootScope) {
      $rootScope.$watch(function() { return NaN;});

      expect(function() {
        $rootScope.$digest();
      }).not.toThrow();
    }));


    it('should always call the watchr with newVal and oldVal equal on the first run',
        inject(function($rootScope) {
      var log = [];
      function logger(scope, newVal, oldVal) {
        var val = (newVal === oldVal || (newVal !== oldVal && oldVal !== newVal)) ? newVal : 'xxx';
        log.push(val);
      }

      $rootScope.$watch(function() { return NaN;}, logger);
      $rootScope.$watch(function() { return undefined;}, logger);
      $rootScope.$watch(function() { return '';}, logger);
      $rootScope.$watch(function() { return false;}, logger);
      $rootScope.$watch(function() { return {};}, logger);
      $rootScope.$watch(function() { return 23;}, logger);

      $rootScope.$digest();
      expect(isNaN(log.shift())).toBe(true); //jasmine's toBe and toEqual don't work well with NaNs
      expect(log).toEqual([undefined, '', false, {}, 23]);
      log = [];
      $rootScope.$digest();
      expect(log).toEqual([]);
    }));
  });


  describe('$destroy', function() {
    var first = null, middle = null, last = null, log = null;

    beforeEach(inject(function($rootScope) {
      log = '';

      first = $rootScope.$new();
      middle = $rootScope.$new();
      last = $rootScope.$new();

      first.$watch(function() { log += '1';});
      middle.$watch(function() { log += '2';});
      last.$watch(function() { log += '3';});

      $rootScope.$digest();
      log = '';
    }));


    it('should ignore remove on root', inject(function($rootScope) {
      $rootScope.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('123');
    }));


    it('should remove first', inject(function($rootScope) {
      first.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('23');
    }));


    it('should remove middle', inject(function($rootScope) {
      middle.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('13');
    }));


    it('should remove last', inject(function($rootScope) {
      last.$destroy();
      $rootScope.$digest();
      expect(log).toEqual('12');
    }));

    it('should fire a $destroy event', inject(function($rootScope) {
      var destructedScopes = [];
      middle.$on('$destroy', function(event) {
        destructedScopes.push(event.currentScope);
      });
      middle.$destroy();
      expect(destructedScopes).toEqual([middle]);
    }));

  });


  describe('$eval', function() {
    it('should eval an expression', inject(function($rootScope) {
      expect($rootScope.$eval('a=1')).toEqual(1);
      expect($rootScope.a).toEqual(1);

      $rootScope.$eval(function(self) {self.b=2;});
      expect($rootScope.b).toEqual(2);
    }));
  });

  describe('$evalAsync', function() {

    it('should run callback before $watch', inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$evalAsync(function(scope) { log += 'parent.async;'; });
      $rootScope.$watch('value', function() { log += 'parent.$digest;'; });
      child.$evalAsync(function(scope) { log += 'child.async;'; });
      child.$watch('value', function() { log += 'child.$digest;'; });
      $rootScope.$digest();
      expect(log).toEqual('parent.async;parent.$digest;child.async;child.$digest;');
    }));

    it('should cause a $digest rerun', inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.value = 0;
      $rootScope.$watch('value', 'log = log + ".";');
      $rootScope.$watch('init', function() {
        $rootScope.$evalAsync('value = 123; log = log + "=" ');
        expect($rootScope.value).toEqual(0);
      });
      $rootScope.$digest();
      expect($rootScope.log).toEqual('.=.');
    }));

    it('should run async in the same order as added', inject(function($rootScope) {
      $rootScope.log = '';
      $rootScope.$evalAsync("log = log + 1");
      $rootScope.$evalAsync("log = log + 2");
      $rootScope.$digest();
      expect($rootScope.log).toBe('12');
    }));

  });


  describe('$apply', function() {
    it('should apply expression with full lifecycle', inject(function($rootScope) {
      var log = '';
      var child = $rootScope.$new();
      $rootScope.$watch('a', function(a) { log += '1'; });
      child.$apply('$parent.a=0');
      expect(log).toEqual('1');
    }));


    it('should catch exceptions', function() {
      module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      });
      inject(function($rootScope, $exceptionHandler, $log) {
        var log = '';
        var child = $rootScope.$new();
        $rootScope.$watch('a', function(a) { log += '1'; });
        $rootScope.a = 0;
        child.$apply(function() { throw new Error('MyError'); });
        expect(log).toEqual('1');
        expect($exceptionHandler.errors[0].message).toEqual('MyError');
        $log.error.logs.shift();
      });
    });


    describe('exceptions', function() {
      var log;
      beforeEach(module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      }));
      beforeEach(inject(function($rootScope) {
        log = '';
        $rootScope.$watch(function() { log += '$digest;'; });
        $rootScope.$digest();
        log = '';
      }));


      it('should execute and return value and update', inject(
          function($rootScope, $exceptionHandler) {
        $rootScope.name = 'abc';
        expect($rootScope.$apply(function(scope) {
          return scope.name;
        })).toEqual('abc');
        expect(log).toEqual('$digest;');
        expect($exceptionHandler.errors).toEqual([]);
      }));


      it('should catch exception and update', inject(function($rootScope, $exceptionHandler) {
        var error = new Error('MyError');
        $rootScope.$apply(function() { throw error; });
        expect(log).toEqual('$digest;');
        expect($exceptionHandler.errors).toEqual([error]);
      }));
    });


    describe('recursive $apply protection', function() {
      it('should throw an exception if $apply is called while an $apply is in progress', inject(
          function($rootScope) {
        expect(function() {
          $rootScope.$apply(function() {
            $rootScope.$apply();
          });
        }).toThrow('$apply already in progress');
      }));


      it('should throw an exception if $apply is called while flushing evalAsync queue', inject(
          function($rootScope) {
        expect(function() {
          $rootScope.$apply(function() {
            $rootScope.$evalAsync(function() {
              $rootScope.$apply();
            });
          });
        }).toThrow('$digest already in progress');
      }));


      it('should throw an exception if $apply is called while a watch is being initialized', inject(
          function($rootScope) {
        var childScope1 = $rootScope.$new();
        childScope1.$watch('x', function() {
          childScope1.$apply();
        });
        expect(function() { childScope1.$apply(); }).toThrow('$digest already in progress');
      }));


      it('should thrown an exception if $apply in called from a watch fn (after init)', inject(
          function($rootScope) {
        var childScope2 = $rootScope.$new();
        childScope2.$apply(function() {
          childScope2.$watch('x', function(newVal, oldVal) {
            if (newVal !== oldVal) {
              childScope2.$apply();
            }
          });
        });

        expect(function() { childScope2.$apply(function() {
          childScope2.x = 'something';
        }); }).toThrow('$digest already in progress');
      }));
    });
  });


  describe('events', function() {

    describe('$on', function() {

      it('should add listener for both $emit and $broadcast events', inject(function($rootScope) {
        var log = '',
            child = $rootScope.$new();

        function eventFn() {
          log += 'X';
        }

        child.$on('abc', eventFn);
        expect(log).toEqual('');

        child.$emit('abc');
        expect(log).toEqual('X');

        child.$broadcast('abc');
        expect(log).toEqual('XX');
      }));


      it('should return a function that deregisters the listener', inject(function($rootScope) {
        var log = '',
            child = $rootScope.$new(),
            listenerRemove;

        function eventFn() {
          log += 'X';
        }

        listenerRemove = child.$on('abc', eventFn);
        expect(log).toEqual('');
        expect(listenerRemove).toBeDefined();

        child.$emit('abc');
        child.$broadcast('abc');
        expect(log).toEqual('XX');

        log = '';
        listenerRemove();
        child.$emit('abc');
        child.$broadcast('abc');
        expect(log).toEqual('');
      }));
    });


    describe('$emit', function() {
      var log, child, grandChild, greatGrandChild;

      function logger(event) {
        log += event.currentScope.id + '>';
      }

      beforeEach(module(function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
      }));
      beforeEach(inject(function($rootScope) {
        log = '';
        child = $rootScope.$new();
        grandChild = child.$new();
        greatGrandChild = grandChild.$new();

        $rootScope.id = 0;
        child.id = 1;
        grandChild.id = 2;
        greatGrandChild.id = 3;

        $rootScope.$on('myEvent', logger);
        child.$on('myEvent', logger);
        grandChild.$on('myEvent', logger);
        greatGrandChild.$on('myEvent', logger);
      }));

      it('should bubble event up to the root scope', function() {
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>0>');
      });


      it('should dispatch exceptions to the $exceptionHandler',
          inject(function($exceptionHandler) {
        child.$on('myEvent', function() { throw 'bubbleException'; });
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>0>');
        expect($exceptionHandler.errors).toEqual(['bubbleException']);
      }));


      it('should allow cancelation of event propagation', function() {
        child.$on('myEvent', function(event) { event.cancel(); });
        grandChild.$emit('myEvent');
        expect(log).toEqual('2>1>');
      });


      it('should forward method arguments', function() {
        child.$on('abc', function(event, arg1, arg2) {
          expect(event.name).toBe('abc');
          expect(arg1).toBe('arg1');
          expect(arg2).toBe('arg2');
        });
        child.$emit('abc', 'arg1', 'arg2');
      });

      describe('event object', function() {
        it('should have methods/properties', function() {
          var event;
          child.$on('myEvent', function(e) {
            expect(e.targetScope).toBe(grandChild);
            expect(e.currentScope).toBe(child);
            expect(e.name).toBe('myEvent');
            event = e;
          });
          grandChild.$emit('myEvent');
          expect(event).toBeDefined();
        });
      });
    });


    describe('$broadcast', function() {
      describe('event propagation', function() {
        var log, child1, child2, child3, grandChild11, grandChild21, grandChild22, grandChild23,
            greatGrandChild211;

        function logger(event) {
          log += event.currentScope.id + '>';
        }

        beforeEach(inject(function($rootScope) {
          log = '';
          child1 = $rootScope.$new();
          child2 = $rootScope.$new();
          child3 = $rootScope.$new();
          grandChild11 = child1.$new();
          grandChild21 = child2.$new();
          grandChild22 = child2.$new();
          grandChild23 = child2.$new();
          greatGrandChild211 = grandChild21.$new();

          $rootScope.id = 0;
          child1.id = 1;
          child2.id = 2;
          child3.id = 3;
          grandChild11.id = 11;
          grandChild21.id = 21;
          grandChild22.id = 22;
          grandChild23.id = 23;
          greatGrandChild211.id = 211;

          $rootScope.$on('myEvent', logger);
          child1.$on('myEvent', logger);
          child2.$on('myEvent', logger);
          child3.$on('myEvent', logger);
          grandChild11.$on('myEvent', logger);
          grandChild21.$on('myEvent', logger);
          grandChild22.$on('myEvent', logger);
          grandChild23.$on('myEvent', logger);
          greatGrandChild211.$on('myEvent', logger);

          //          R
          //       /  |   \
          //     1    2    3
          //    /   / | \
          //   11  21 22 23
          //       |
          //      211
        }));


        it('should broadcast an event from the root scope', inject(function($rootScope) {
          $rootScope.$broadcast('myEvent');
          expect(log).toBe('0>1>11>2>21>211>22>23>3>');
        }));


        it('should broadcast an event from a child scope', function() {
          child2.$broadcast('myEvent');
          expect(log).toBe('2>21>211>22>23>');
        });


        it('should broadcast an event from a leaf scope with a sibling', function() {
          grandChild22.$broadcast('myEvent');
          expect(log).toBe('22>');
        });


        it('should broadcast an event from a leaf scope without a sibling', function() {
          grandChild23.$broadcast('myEvent');
          expect(log).toBe('23>');
        });


        it('should not not fire any listeners for other events', inject(function($rootScope) {
          $rootScope.$broadcast('fooEvent');
          expect(log).toBe('');
        }));
      });


      describe('listener', function() {
        it('should receive event object', inject(function($rootScope) {
          var scope = $rootScope,
              child = scope.$new(),
              event;

          child.$on('fooEvent', function(e) {
            event = e;
          });
          scope.$broadcast('fooEvent');

          expect(event.name).toBe('fooEvent');
          expect(event.targetScope).toBe(scope);
          expect(event.currentScope).toBe(child);
        }));


        it('should support passing messages as varargs', inject(function($rootScope) {
          var scope = $rootScope,
              child = scope.$new(),
              args;

          child.$on('fooEvent', function() {
            args = arguments;
          });
          scope.$broadcast('fooEvent', 'do', 're', 'me', 'fa');

          expect(args.length).toBe(5);
          expect(sliceArgs(args, 1)).toEqual(['do', 're', 'me', 'fa']);
        }));
      });
    });
  });
});
