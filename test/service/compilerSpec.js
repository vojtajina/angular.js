'use strict';

describe('compiler', function() {
  var compiler, textMmarkup, attrMarkup, directives, widgets, compile, log, $rootScope;

  beforeEach(inject(function($provide){
    textMmarkup = [];
    attrMarkup = [];
    widgets = extensionMap({}, 'widget');
    directives = {
      hello: function(expression, element){
        log += "hello ";
        return function() {
          log += expression;
        };
      },

      observe: function(expression, element){
        return function() {
          this.$watch(expression, function(scope, val){
            if (val)
              log += ":" + val;
          });
        };
      }

    };
    log = "";
    $provide.value('$textMarkup', textMmarkup);
    $provide.value('$attrMarkup', attrMarkup);
    $provide.value('$directive', directives);
    $provide.value('$widget', widgets);
  }));


  it('should not allow compilation of multiple roots', inject(function($rootScope, $compile) {
    expect(function() {
      $compile('<div>A</div><span></span>');
    }).toThrow("Cannot compile multiple element roots: " + ie("<div>A</div><span></span>"));
    function ie(text) {
      return msie < 9 ? uppercase(text) : text;
    }
  }));


  it('should recognize a directive', inject(function($rootScope, $compile) {
    var e = jqLite('<div directive="expr" ignore="me"></div>');
    directives.directive = function(expression, element){
      log += "found";
      expect(expression).toEqual("expr");
      expect(element).toEqual(e);
      return function initFn() {
        log += ":init";
      };
    };
    var linkFn = $compile(e);
    expect(log).toEqual("found");
    linkFn($rootScope);
    expect(e.hasClass('ng-directive')).toEqual(true);
    expect(log).toEqual("found:init");
  }));


  it('should recurse to children', inject(function($rootScope, $compile) {
    $compile('<div><span hello="misko"/></div>')($rootScope);
    expect(log).toEqual("hello misko");
  }));


  it('should observe scope', inject(function($rootScope, $compile) {
    $compile('<span observe="name"></span>')($rootScope);
    expect(log).toEqual("");
    $rootScope.$digest();
    $rootScope.name = 'misko';
    $rootScope.$digest();
    $rootScope.$digest();
    $rootScope.name = 'adam';
    $rootScope.$digest();
    $rootScope.$digest();
    expect(log).toEqual(":misko:adam");
  }));


  it('should prevent descend', inject(function($rootScope, $compile) {
    directives.stop = function() { this.descend(false); };
    $compile('<span hello="misko" stop="true"><span hello="adam"/></span>')($rootScope);
    expect(log).toEqual("hello misko");
  }));


  it('should allow creation of templates', inject(function($rootScope, $compile) {
    directives.duplicate = function(expr, element){
      element.replaceWith(document.createComment("marker"));
      element.removeAttr("duplicate");
      var linker = this.compile(element);
      return function(marker) {
        this.$watch('value', function() {
          var scope = $rootScope.$new;
          linker(scope, noop);
          marker.after(scope.$element);
        });
      };
    };
    $compile('<div>before<span duplicate="expr">x</span>after</div>')($rootScope);
    expect(sortedHtml($rootScope.$element)).
      toEqual('<div>' +
                'before<#comment></#comment>' +
                'after' +
              '</div>');
    $rootScope.value = 1;
    $rootScope.$digest();
    expect(sortedHtml($rootScope.$element)).
      toEqual('<div>' +
          'before<#comment></#comment>' +
          '<span>x</span>' +
          'after' +
        '</div>');
    $rootScope.value = 2;
    $rootScope.$digest();
    expect(sortedHtml($rootScope.$element)).
      toEqual('<div>' +
          'before<#comment></#comment>' +
          '<span>x</span>' +
          '<span>x</span>' +
          'after' +
        '</div>');
    $rootScope.value = 3;
    $rootScope.$digest();
    expect(sortedHtml($rootScope.$element)).
      toEqual('<div>' +
          'before<#comment></#comment>' +
          '<span>x</span>' +
          '<span>x</span>' +
          '<span>x</span>' +
          'after' +
        '</div>');
  }));


  it('should process markup before directives', inject(function($rootScope, $compile) {
    textMmarkup.push(function(text, textNode, parentNode) {
      if (text == 'middle') {
        expect(textNode.text()).toEqual(text);
        parentNode.attr('hello', text);
        textNode[0].nodeValue = 'replaced';
      }
    });
    $compile('<div>before<span>middle</span>after</div>')($rootScope);
    expect(sortedHtml($rootScope.$element[0], true)).
      toEqual('<div>before<span class="ng-directive" hello="middle">replaced</span>after</div>');
    expect(log).toEqual("hello middle");
  }));


  it('should replace widgets', inject(function($rootScope, $compile) {
    widgets['NG:BUTTON'] = function(element) {
      expect(element.hasClass('ng-widget')).toEqual(true);
      element.replaceWith('<div>button</div>');
      return function(element) {
        log += 'init';
      };
    };
    $compile('<div><ng:button>push me</ng:button></div>')($rootScope);
    expect(lowercase($rootScope.$element[0].innerHTML)).toEqual('<div>button</div>');
    expect(log).toEqual('init');
  }));


  it('should use the replaced element after calling widget', inject(function($rootScope, $compile) {
    widgets['H1'] = function(element) {
      // HTML elements which are augmented by acting as widgets, should not be marked as so
      expect(element.hasClass('ng-widget')).toEqual(false);
      var span = angular.element('<span>{{1+2}}</span>');
      element.replaceWith(span);
      this.descend(true);
      this.directives(true);
      return noop;
    };
    textMmarkup.push(function(text, textNode, parent){
      if (text == '{{1+2}}')
        parent.text('3');
    });
    $compile('<div><h1>ignore me</h1></div>')($rootScope);
    expect($rootScope.$element.text()).toEqual('3');
  }));


  it('should allow multiple markups per text element', inject(function($rootScope, $compile) {
    textMmarkup.push(function(text, textNode, parent){
      var index = text.indexOf('---');
      if (index > -1) {
        textNode.after(text.substring(index + 3));
        textNode.after("<hr/>");
        textNode.after(text.substring(0, index));
        textNode.remove();
      }
    });
    textMmarkup.push(function(text, textNode, parent){
      var index = text.indexOf('===');
      if (index > -1) {
        textNode.after(text.substring(index + 3));
        textNode.after("<p>");
        textNode.after(text.substring(0, index));
        textNode.remove();
      }
    });
    $compile('<div>A---B---C===D</div>')($rootScope);
    expect(sortedHtml($rootScope.$element)).toEqual('<div>A<hr></hr>B<hr></hr>C<p></p>D</div>');
  }));


  it('should add class for namespace elements', inject(function($rootScope, $compile) {
    var element = $compile('<ng:space>abc</ng:space>')($rootScope);
    expect(element.hasClass('ng-space')).toEqual(true);
  }));
});

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
