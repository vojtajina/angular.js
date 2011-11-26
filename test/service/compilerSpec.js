'use strict';

ddescribe('$compile2', function() {
  var element;
  beforeEach(inject(function(){
    element = null;
  }));

  afterEach(function(){
    dealoc(element);
  });


  describe('configuration', function() {
    it('should register a directive', inject(
      function($compileProvider) {
        $compileProvider.directive('abc', function() {
          return function(scope, element, attrName, text) {
            element.text('SUCCESS');
          };
        })
      },
      function($compile, $rootScope) {
        element = $compile('<abc></abc>')($rootScope);
        expect(element.text()).toEqual('SUCCESS');
      }
    ));
  });

  describe('directives', function (){
    beforeEach(inject(function ($compileProvider) {
      $compileProvider.directive('a', function() {
        return function(scope, element) {
          element.text('A');
        };
      });
      $compileProvider.directive('b', function() {
        return function(scope, element) {
          element.text( element.text() + 'B');
        };
      });
      $compileProvider.directive('c', function() {
        return function(scope, element) {
          element.text( element.text() + 'C');
        };
      });
      $compileProvider.directive('greet', function() {
        return function(scope, element, attrs) {
          element.text("Hello " + attrs.greet);
        };
      });
    }));


    it('should allow multiple directives per element', inject(function($compile, $rootScope){
      element = $compile('<a b="" x-c=""></a>')($rootScope);
      expect(element.text()).toEqual('ABC');
    }));


    it('should recurse to children', inject(function($compile, $rootScope){
      element = $compile('<div>0<a>1</a>2<b>3</b>4</div>')($rootScope);
      expect(element.text()).toEqual('0A23B4');
    }));


    it('should allow directives in classes', inject(function($compile, $rootScope) {
      element = $compile(
        '<div class="greet: angular; b:123; c"></div>')($rootScope);
      expect(element.html()).toEqual('Hello angularBC');
    }));


    it('should allow directives in comments', inject(function($compile, $rootScope) {
      element = $compile(
        '<div>0<!-- directive: greet angular -->1</div>')($rootScope);
      expect(element.html()).toEqual('0<!--Hello angular-->1');
    }));


    it('should send scope, element, and attributes', inject(
      function($compileProvider, $injector) {
        var injector = $injector;
        $compileProvider.directive('lOg' /* ignore case */, function($injector, $rootScope){
          expect($injector).toBe(injector); // verify that it is injectable
          return {
            templateFn: function(element, templateAttr) {
              var $normalize = templateAttr.$normalize;
              var $element = templateAttr.$element;
              var $set = templateAttr.$set;
              expect(typeof $normalize).toBe('function');
              expect(typeof $set).toBe('function');
              expect(isElement($element)).toBeTruthy();
              expect(element.text()).toEqual('raw');
              expect(templateAttr).toEqual({
                $normalize: $normalize,
                $set: $set,
                $element: $element,
                $attr:{ exp: 'exp', aa: 'aa', bb: 'x-bb', cc: 'data-cc' },
                'exp':'abc', aa: 'A', bb: 'B', cc: 'C' });
              return function(scope, element, attr) {
                expect(element.text()).toEqual('raw');
                expect(attr).toBe(templateAttr);
                expect(scope).toEqual($rootScope);
                element.text('worked');
              }
            }
          };
        });
      },
      function($rootScope, $compile) {
        element = $compile('<LoG exp="abc" aa="A" x-Bb="B" daTa-cC="C">raw</LoG>')($rootScope);
        expect(element.text()).toEqual('worked');
      }
    ));


    it('should process bindings', inject(function($rootScope, $compile){
      $rootScope.name = 'angular';
      element = $compile('<div name="attr: {{name}}">text: {{name}}</div>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual('text: angular');
      expect(element.attr('name')).toEqual('attr: angular');
    }));


    it('should honor priority', inject(
      function($compileProvider) {
        forEach({low:0, med:1, high:2}, function(priority, priorityName) {
          $compileProvider.directive(priorityName, valueFn({
            templateFn: function() {
              return function(scope, element) {
                element.text(element.text() + priorityName + ';');
              }
            },
            priority: priority
          }));
        });
      },
      function($rootScope, $compile) {
        element = $compile('<low high med></low>')($rootScope);
        expect(element.text()).toEqual('high;med;low;');
      }
    ));


    it('should handle exceptions', inject(
      function($compileProvider, $exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
        $compileProvider.directive('factory-error', function() { throw Error('FactoryError'); });
        $compileProvider.directive('template-error',
          valueFn({ templateFn: function() { throw Error('TemplateError'); } }));
        $compileProvider.directive('linking-error',
          valueFn(function() { throw Error('LinkingError'); }));
      },
      function($rootScope, $compile, $exceptionHandler) {
        element = $compile('<div factory-error template-error linking-error></div>')($rootScope);
        expect($exceptionHandler.errors).toEqual([
          Error('FactoryError'), Error('TemplateError'), Error('LinkingError')]);
      }
    ));


    it('should prevent further directives from running', inject(
      function($compileProvider) {
        $compileProvider.directive('stop', valueFn({
          priority: -100, // even with negative priority we still should be able to stop descend
          terminal: true
        }));
      },
      function($rootScope, $compile) {
        element = $compile('<div stop><a>OK</a></div>')($rootScope);
        expect(element.text()).toEqual('OK');
      }
    ));

    it('should allow setting of attributes', inject(
      function($compileProvider) {
        $compileProvider.directive({
          setter: valueFn(function(scope, element, attr) {
            attr.$set('name', 'abc');
            attr.$set('disabled', true);
            expect(attr.name).toBe('abc');
            expect(attr.disabled).toBe(true);
          })
        });
      },
      function($rootScope, $compile) {
        element = $compile('<div setter></div>')($rootScope);
        expect(element.attr('name')).toEqual('abc');
        expect(element.attr('disabled')).toEqual('disabled');
      }
    ));

    it('should read boolean attributes as boolean', inject(
      function($compileProvider) {
        $compileProvider.directive({
          div: valueFn(function(scope, element, attr) {
            element.text(attr.required);
          })
        });
      },
      function($rootScope, $compile) {
        element = $compile('<div required></div>')($rootScope);
        expect(element.text()).toEqual('true');
      }
    ));
  });

  it('should create new instance of attr for each template stamping', inject(
      function($compileProvider, $provide) {
        var state = { first: [], second: [] };
        $provide.value('state', state);
        $compileProvider.directive({
          first: valueFn({
            priority: 1,
            templateFn: function(templateElement, templateAttr) {
              return function(scope, element, attr) {
                state.first.push({
                  template: {element: templateElement, attr:templateAttr},
                  link: {element: element, attr: attr}
                });
              }
            }
          }),
          second: valueFn({
            priority: 2,
            templateFn: function(templateElement, templateAttr) {
              return function(scope, element, attr) {
                state.second.push({
                  template: {element: templateElement, attr:templateAttr},
                  link: {element: element, attr: attr}
                });
              }
            }
          })
        });
      },
      function($rootScope, $compile, state) {
        var template = $compile('<div first second>');
        dealoc(template($rootScope.$new(), noop));
        dealoc(template($rootScope.$new(), noop));

        // instance between directives should be shared
        expect(state.first[0].template.element).toBe(state.second[0].template.element);
        expect(state.first[0].template.attr).toBe(state.second[0].template.attr);

        // the template and the link can not be the same instance
        expect(state.first[0].template.element).not.toBe(state.first[0].link.element);
        expect(state.first[0].template.attr).not.toBe(state.first[0].link.attr);

        // each new template needs to be new instance
        expect(state.first[0].link.element).not.toBe(state.first[1].link.element);
        expect(state.first[0].link.attr).not.toBe(state.first[1].link.attr);
        expect(state.second[0].link.element).not.toBe(state.second[1].link.element);
        expect(state.second[0].link.attr).not.toBe(state.second[1].link.attr);
      }
    ));

  it('should not store linkingFns for noop branches', inject(function ($rootScope, $compile) {
    var element = jqLite('<div name="{{a}}"><span>ignore</span></div>');
    var template = $compile(element);
    // Now prune the branches with no directives
    element.find('span').remove();
    expect(element.find('span').length).toBe(0);
    // and we should still be able to compile without errors
    template($rootScope);
  }));

});
