'use strict';

describe('form', function() {
  var doc;

  afterEach(function() {
    dealoc(doc);
  });


  it('should instantiate form and attach it to DOM', inject(function($rootScope, $compile) {
    doc = jqLite('<form>');
    $compile(doc)($rootScope);
    expect(doc.data('$form')).toBeTruthy();
    expect(doc.data('$form') instanceof FormController).toBe(true);
  }));


  it('should prevent form submission', inject(function($rootScope, $compile) {
    var startingUrl = '' + window.location;
    doc = angular.element('<form name="myForm"><input type=submit val=submit>');
    $compile(doc)($rootScope);
    browserTrigger(doc.find('input'));
    waitsFor(
        function() { return true; },
        'let browser breath, so that the form submision can manifest itself', 10);
    runs(function() {
      expect('' + window.location).toEqual(startingUrl);
    });
  }));


  it('should not prevent form submission if action attribute present',
      inject(function($compile, $rootScope) {
    var callback = jasmine.createSpy('submit').andCallFake(function(event) {
      expect(event.isDefaultPrevented()).toBe(false);
      event.preventDefault();
    });

    doc = angular.element('<form name="x" action="some.py" />');
    $compile(doc)($rootScope);
    doc.bind('submit', callback);

    browserTrigger(doc, 'submit');
    expect(callback).toHaveBeenCalledOnce();
  }));


  it('should publish form to scope', inject(function($rootScope, $compile) {
    doc = angular.element('<form name="myForm"></form>');
    $compile(doc)($rootScope);
    expect($rootScope.myForm).toBeTruthy();
    expect(doc.data('$form')).toBeTruthy();
    expect(doc.data('$form')).toEqual($rootScope.myForm);
  }));


  it('should allow name to be an expression', inject(function($rootScope, $compile) {
    doc = jqLite('<form name="obj.myForm"></form>');
    $compile(doc)($rootScope);

    expect($rootScope.obj).toBeDefined();
    expect($rootScope.obj.myForm).toBeTruthy();
  }));


  it('should chain nested forms', inject(function($rootScope, $compile) {
    doc = angular.element(
        '<ng:form name=parent>' +
          '<ng:form name=child>' +
            '<input type=text ng:model=text name=text>' +
          '</ng:form>' +
        '</ng:form>');
    $compile(doc)($rootScope);
    var parent = $rootScope.parent;
    var child = $rootScope.child;
    var input = child.text;

    input.$emit('$invalid', 'MyError');
    expect(parent.$error.MyError).toEqual([input]);
    expect(child.$error.MyError).toEqual([input]);

    input.$emit('$valid', 'MyError');
    expect(parent.$error.MyError).toBeUndefined();
    expect(child.$error.MyError).toBeUndefined();
  }));


  it('should chain nested forms in repeater', inject(function($rootScope, $compile) {
    doc = angular.element(
       '<ng:form name=parent>' +
        '<ng:form ng:repeat="f in forms" name=child>' +
          '<input type=text ng:model=text name=text>' +
         '</ng:form>' +
       '</ng:form>');
    $compile(doc)($rootScope);
    $rootScope.forms = [1];
    $rootScope.$digest();

    var parent = $rootScope.parent;
    var child = doc.find('input').scope().child;
    var input = child.text;
    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    expect(input).toBeDefined();

    input.$emit('$invalid', 'myRule');
    expect(input.$error.myRule).toEqual(true);
    expect(child.$error.myRule).toEqual([input]);
    expect(parent.$error.myRule).toEqual([input]);

    input.$emit('$valid', 'myRule');
    expect(parent.$error.myRule).toBeUndefined();
    expect(child.$error.myRule).toBeUndefined();
  }));


  it('should publish widgets', inject(function($compile, $rootScope) {
    doc = jqLite('<form name="form"><input type="text" name="w1" ng:model="some" /></form>');
    $compile(doc)($rootScope);

    var widget = $rootScope.form.w1;
    expect(widget).toBeDefined();
    expect(widget.$pristine).toBe(true);
    expect(widget.$dirty).toBe(false);
    expect(widget.$valid).toBe(true);
    expect(widget.$invalid).toBe(false);
  }));


  describe('validation', function() {
    var formElement, form, widgetScope;

    beforeEach(inject(function($compile, $rootScope) {
      formElement = doc = jqLite('<form name="form"><input type="text" ng:model="name" name="name" /></form>');
      $compile(doc)($rootScope);
      $rootScope.$digest();
      widgetScope = formElement.find('input').scope();
      form = formElement.data('$form');
    }));


    it('should have ng-valid/ng-invalid css class', function() {
      expect(formElement).toBeValid();

      widgetScope.$emit('$invalid', 'ERROR');
      widgetScope.$apply();
      expect(formElement).toBeInvalid();

      widgetScope.$emit('$invalid', 'ANOTHER');
      widgetScope.$apply();

      widgetScope.$emit('$valid', 'ERROR');
      widgetScope.$apply();
      expect(formElement).toBeInvalid();

      widgetScope.$emit('$valid', 'ANOTHER');
      widgetScope.$apply();
      expect(formElement).toBeValid();
    });


    it('should have ng-pristine/ng-dirty css class', function() {
      expect(formElement).toBePristine();

      widgetScope.$emit('$viewTouch');
      widgetScope.$apply();
      expect(formElement).toBeDirty();
    });
  });
});
