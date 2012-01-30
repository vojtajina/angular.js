'use strict';


var URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
var EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/;


/**
 * @ngdoc inputType
 * @name angular.inputType.text
 *
 * @description
 * Standard HTML text input with angular data binding.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.text = 'guest';
           $scope.word = /^\w*$/;
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Single word: <input type="text" name="input" ng:model="text"
                               ng:pattern="word" required>
           <span class="error" ng:show="myForm.input.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.input.$error.PATTERN">
             Single word only!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('text')).toEqual('guest');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('text').enter('');
          expect(binding('text')).toEqual('');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if multi word', function() {
          input('text').enter('hello world');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc inputType
 * @name angular.inputType.email
 *
 * @description
 * Text input with email validation. Sets the `EMAIL` validation error key if not a valid email
 * address.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.text = 'me@example.com';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Email: <input type="email" name="input" ng:model="text" required>
           <span class="error" ng:show="myForm.input.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.input.$error.EMAIL">
             Not valid email!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
         <tt>myForm.$error.EMAIL = {{!!myForm.$error.EMAIL}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('text')).toEqual('me@example.com');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('text').enter('');
          expect(binding('text')).toEqual('');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if not email', function() {
          input('text').enter('xxx');
          expect(binding('text')).toEqual('xxx');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc inputType
 * @name angular.inputType.url
 *
 * @description
 * Text input with URL validation. Sets the `URL` validation error key if the content is not a
 * valid URL.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.text = 'http://google.com';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           URL: <input type="url" name="input" ng:model="text" required>
           <span class="error" ng:show="myForm.input.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.input.$error.url">
             Not valid url!</span>
         </form>
         <tt>text = {{text}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
         <tt>myForm.$error.url = {{!!myForm.$error.url}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('text')).toEqual('http://google.com');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('text').enter('');
          expect(binding('text')).toEqual('');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if not url', function() {
          input('text').enter('xxx');
          expect(binding('text')).toEqual('xxx');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc inputType
 * @name angular.inputType.list
 *
 * @description
 * Text input that converts between comma-seperated string into an array of strings.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.names = ['igor', 'misko', 'vojta'];
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           List: <input type="list" name="input" ng:model="names" required>
           <span class="error" ng:show="myForm.list.$error.REQUIRED">
             Required!</span>
         </form>
         <tt>names = {{names}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('names')).toEqual('["igor","misko","vojta"]');
          expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
          input('names').enter('');
          expect(binding('names')).toEqual('[]');
          expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */
var ngListDirective = function() {
  return function(scope, element, attr) {
    var parse = function(viewValue) {
      var list = [];
      forEach(viewValue.split(/\s*,\s*/), function(value) {
        if (value) list.push(value);
      });
      return list;
    };

    scope.$parsers.push(parse);
    scope.$formatters.push(function(value) {
      if (isArray(value) && !equals(parse(scope.$viewValue), value)) {
        return value.join(', ');
      }

      return undefined;
    });
  };
};

/**
 * @ngdoc inputType
 * @name angular.inputType.number
 *
 * @description
 * Text input with number validation and transformation. Sets the `NUMBER` validation
 * error if not a valid number.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} min Sets the `MIN` validation error key if the value entered is less then `min`.
 * @param {string=} max Sets the `MAX` validation error key if the value entered is greater then `min`.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.value = 12;
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Number: <input type="number" name="input" ng:model="value"
                          min="0" max="99" required>
           <span class="error" ng:show="myForm.list.$error.REQUIRED">
             Required!</span>
           <span class="error" ng:show="myForm.list.$error.NUMBER">
             Not valid number!</span>
         </form>
         <tt>value = {{value}}</tt><br/>
         <tt>myForm.input.$valid = {{myForm.input.$valid}}</tt><br/>
         <tt>myForm.input.$error = {{myForm.input.$error}}</tt><br/>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br/>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
         expect(binding('value')).toEqual('12');
         expect(binding('myForm.input.$valid')).toEqual('true');
        });

        it('should be invalid if empty', function() {
         input('value').enter('');
         expect(binding('value')).toEqual('');
         expect(binding('myForm.input.$valid')).toEqual('false');
        });

        it('should be invalid if over max', function() {
         input('value').enter('123');
         expect(binding('value')).toEqual('123');
         expect(binding('myForm.input.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc inputType
 * @name angular.inputType.checkbox
 *
 * @description
 * HTML checkbox.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} ng:true-value The value to which the expression should be set when selected.
 * @param {string=} ng:false-value The value to which the expression should be set when not selected.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.value1 = true;
           $scope.value2 = 'YES'
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           Value1: <input type="checkbox" ng:model="value1"> <br/>
           Value2: <input type="checkbox" ng:model="value2"
                          ng:true-value="YES" ng:false-value="NO"> <br/>
         </form>
         <tt>value1 = {{value1}}</tt><br/>
         <tt>value2 = {{value2}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should change state', function() {
          expect(binding('value1')).toEqual('true');
          expect(binding('value2')).toEqual('YES');

          input('value1').check();
          input('value2').check();
          expect(binding('value1')).toEqual('false');
          expect(binding('value2')).toEqual('NO');
        });
      </doc:scenario>
    </doc:example>
 */



/**
 * @ngdoc inputType
 * @name angular.inputType.radio
 *
 * @description
 * HTML radio button.
 *
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string} value The value to which the expression should be set when selected.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.color = 'blue';
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           <input type="radio" ng:model="color" value="red">  Red <br/>
           <input type="radio" ng:model="color" value="green"> Green <br/>
           <input type="radio" ng:model="color" value="blue"> Blue <br/>
         </form>
         <tt>color = {{color}}</tt><br/>
       </div>
      </doc:source>
      <doc:scenario>
        it('should change state', function() {
          expect(binding('color')).toEqual('blue');

          input('color').select('red');
          expect(binding('color')).toEqual('red');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc widget
 * @name angular.module.ng.$compileProvider.directive.input
 *
 * @description
 * HTML input element widget with angular data-binding. Input widget follows HTML5 input types
 * and polyfills the HTML5 validation behavior for older browsers.
 *
 * The {@link angular.inputType custom angular.inputType}s provide a shorthand for declaring new
 * inputs. This is a sharthand for text-box based inputs, and there is no need to go through the
 * full {@link angular.module.ng.$formFactory $formFactory} widget lifecycle.
 *
 *
 * @param {string} type Widget types as defined by {@link angular.inputType}. If the
 *    type is in the format of `@ScopeType` then `ScopeType` is loaded from the
 *    current scope, allowing quick definition of type.
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 *
 * @example
    <doc:example>
      <doc:source>
       <script>
         function Ctrl($scope) {
           $scope.user = {name: 'guest', last: 'visitor'};
         }
       </script>
       <div ng:controller="Ctrl">
         <form name="myForm">
           User name: <input type="text" name="userName" ng:model="user.name" required>
           <span class="error" ng:show="myForm.userName.$error.REQUIRED">
             Required!</span><br>
           Last name: <input type="text" name="lastName" ng:model="user.last"
             ng:minlength="3" ng:maxlength="10">
           <span class="error" ng:show="myForm.lastName.$error.MINLENGTH">
             Too short!</span>
           <span class="error" ng:show="myForm.lastName.$error.MAXLENGTH">
             Too long!</span><br>
         </form>
         <hr>
         <tt>user = {{user}}</tt><br/>
         <tt>myForm.userName.$valid = {{myForm.userName.$valid}}</tt><br>
         <tt>myForm.userName.$error = {{myForm.userName.$error}}</tt><br>
         <tt>myForm.lastName.$valid = {{myForm.lastName.$valid}}</tt><br>
         <tt>myForm.userName.$error = {{myForm.lastName.$error}}</tt><br>
         <tt>myForm.$valid = {{myForm.$valid}}</tt><br>
         <tt>myForm.$error.REQUIRED = {{!!myForm.$error.REQUIRED}}</tt><br>
         <tt>myForm.$error.MINLENGTH = {{!!myForm.$error.MINLENGTH}}</tt><br>
         <tt>myForm.$error.MAXLENGTH = {{!!myForm.$error.MAXLENGTH}}</tt><br>
       </div>
      </doc:source>
      <doc:scenario>
        it('should initialize to model', function() {
          expect(binding('user')).toEqual('{"last":"visitor","name":"guest"}');
          expect(binding('myForm.userName.$valid')).toEqual('true');
          expect(binding('myForm.$valid')).toEqual('true');
        });

        it('should be invalid if empty when required', function() {
          input('user.name').enter('');
          expect(binding('user')).toEqual('{"last":"visitor","name":""}');
          expect(binding('myForm.userName.$valid')).toEqual('false');
          expect(binding('myForm.$valid')).toEqual('false');
        });

        it('should be valid if empty when min length is set', function() {
          input('user.last').enter('');
          expect(binding('user')).toEqual('{"last":"","name":"guest"}');
          expect(binding('myForm.lastName.$valid')).toEqual('true');
          expect(binding('myForm.$valid')).toEqual('true');
        });

        it('should be invalid if less than required min length', function() {
          input('user.last').enter('xx');
          expect(binding('user')).toEqual('{"last":"xx","name":"guest"}');
          expect(binding('myForm.lastName.$valid')).toEqual('false');
          expect(binding('myForm.lastName.$error')).toMatch(/MINLENGTH/);
          expect(binding('myForm.$valid')).toEqual('false');
        });

        it('should be valid if longer than max length', function() {
          input('user.last').enter('some ridiculously long name');
          expect(binding('user'))
            .toEqual('{"last":"some ridiculously long name","name":"guest"}');
          expect(binding('myForm.lastName.$valid')).toEqual('false');
          expect(binding('myForm.lastName.$error')).toMatch(/MAXLENGTH/);
          expect(binding('myForm.$valid')).toEqual('false');
        });
      </doc:scenario>
    </doc:example>
 */


/**
 * @ngdoc widget
 * @name angular.module.ng.$compileProvider.directive.textarea
 *
 * @description
 * HTML textarea element widget with angular data-binding. The data-binding and validation
 * properties of this element are exactly the same as those of the
 * {@link angular.module.ng.$compileProvider.directive.input input element}.
 *
 * @param {string} type Widget types as defined by {@link angular.inputType}. If the
 *    type is in the format of `@ScopeType` then `ScopeType` is loaded from the
 *    current scope, allowing quick definition of type.
 * @param {string} ng:model Assignable angular expression to data-bind to.
 * @param {string=} name Property name of the form under which the widgets is published.
 * @param {string=} required Sets `REQUIRED` validation error key if the value is not entered.
 * @param {number=} ng:minlength Sets `MINLENGTH` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ng:maxlength Sets `MAXLENGTH` validation error key if the value is longer than
 *    maxlength.
 * @param {string=} ng:pattern Sets `PATTERN` validation error key if the value does not match the
 *    RegExp pattern expression. Expected value is `/regexp/` for inline patterns or `regexp` for
 *    patterns defined as scope expressions.
 * @param {string=} ng:change Angular expression to be executed when input changes due to user
 *    interaction with the input element.
 */
var inputType = {
  'text': textInputType,
  'number': numberInputType,
  'url': urlInputType,
  'email': emailInputType,

  'radio': radioInputType,
  'checkbox': checkboxInputType,

  'hidden': noop,
  'button': noop,
  'submit': noop,
  'reset': noop
};

function textInputType(scope, element, attr) {
  element.bind('keydown change input', function(event) {
    var key = event.keyCode;
    if (/*command*/   key !== 91 &&
        /*modifiers*/ !(15 < key && key < 19) &&
        /*arrow*/     !(37 < key && key < 40)) {
      // TODO(vojta): why do we need it async ?
//      $defer(function() {
      scope.$apply(function() {
        scope.$touch();

        var value = trim(element.val());
        if (scope.$viewValue !== value ) {
          scope.$viewValue = element.val();
          scope.$read();
        }
      });
//      });
    }
  });

  // pattern validator
  var pattern = attr.ngPattern,
      patternValidator;

  var emit = function(regexp, value) {
    if (regexp.test(value)) {
      scope.$emit('$valid', 'PATTERN');
      return value;
    } else {
      scope.$emit('$invalid', 'PATTERN');
      return undefined;
    }
  };

  if (pattern) {
    if (pattern.match(/^\/(.*)\/$/)) {
      pattern = new RegExp(pattern.substr(1, pattern.length - 2));
      patternValidator = function(value) {
        return emit(pattern, value)
      };
    } else {
      patternValidator = function(value) {
        var patternObj = scope.$eval(pattern);
        if (!patternObj || !patternObj.test) {
         throw new Error('Expected ' + pattern + ' to be a RegExp but was ' + patternObj);
        }
        return emit(patternObj, value);
      };
    }

    scope.$formatters.push(patternValidator);
    scope.$parsers.push(patternValidator);
  }

  // min length validator
  if (attr.ngMinLength) {
    var minlength = parseInt(attr.ngMinlength, 10);
    var minLengthValidator = function(value) {
      if (value.length < minlength) {
        scope.$emit('$invalid', 'MINLENGTH');
        return undefined;
      } else {
        scope.$emit('$valid', 'MINLENGTH');
        return value;
      }
    };

    scope.$parsers.push(minLengthValidator);
    scope.$formatters.push(minLengthValidator);
  }

  // max length validator
  if (attr.ngMaxLength) {
    var maxlength = parseInt(attr.ngMinlength, 10);
    var maxLengthValidator = function(value) {
      if (value.length > maxlength) {
        scope.$emit('$invalid', 'MAXLENGTH');
        return undefined;
      } else {
        scope.$emit('$valid', 'MAXLENGTH');
        return value;
      }
    };

    scope.$parsers.push(maxLengthValidator);
    scope.$formatters.push(maxLengthValidator);
  }

  // required validator
  // TODO(vojta): move it to input
  if (attr.required) {
    var $touch = scope.$touch;
    scope.$touch = function() {
      if (!scope.$viewValue) scope.$emit('$invalid', 'REQUIRED');
      $touch.call(this);
    };

    scope.$parsers.push(function(value) {
      scope.$emit(value ? '$valid' : '$invalid', 'REQUIRED');
      return value;
    });

    scope.$formatters.push(function(value) {
      scope.$emit(value ? '$valid' : '$invalid', 'REQUIRED');
      return value;
    });
  }
};

function numberInputType(scope, element, attr) {
  textInputType(scope, element, attr);

  scope.$parsers.push(function(value) {
    if (NUMBER_REGEXP.test(value)) {
      scope.$emit('$valid', 'NUMBER');
      return parseFloat(value);
    } else {
      scope.$emit('$invalid', 'NUMBER');
      return undefined;
    }
  });

  scope.$formatters.push(function(value) {
    if (isNumber(value)) {
      scope.$emit('$valid', 'NUMBER');
      return '' + value;
    } else {
      scope.$emit('$invalid', 'NUMBER');
      return undefined;
    }
  });

  if (attr.min) {
    var min = parseFloat(attr.min);
    var minValidator = function(value) {
      if (value < min) {
        scope.$emit('$invalid', 'MIN');
        return undefined;
      } else {
        scope.$emit('$valid', 'MIN');
        return value;
      }
    };

    scope.$parsers.push(minValidator);
    scope.$formatters.push(minValidator);
  }

  if (attr.max) {
    var max = parseFloat(attr.max);
    var maxValidator = function(value) {
      if (value > max) {
        scope.$emit('$invalid', 'MAX');
        return undefined;
      } else {
        scope.$emit('$valid', 'MAX');
        return value;
      }
    };

    scope.$parsers.push(maxValidator);
    scope.$formatters.push(maxValidator);
  }
}

function urlInputType(scope, element, attr) {
  textInputType(scope, element, attr);

  var urlValidator = function(value) {
    if (!value || URL_REGEXP.test(value)) {
      scope.$emit('$valid', 'URL');
      return value;
    } else {
      scope.$emit('$invalid', 'URL');
      return undefined;
    }
  };

  scope.$formatters.push(urlValidator);
  scope.$parsers.push(urlValidator);
}

function emailInputType(scope, element, attr) {
  textInputType(scope, element, attr);

  var emailValidator = function(value) {
    if (!value || EMAIL_REGEXP.test(value)) {
      scope.$emit('$valid', 'EMAIL');
      return value;
    } else {
      scope.$emit('$invalid', 'EMAIL');
      return undefined;
    }
  };

  scope.$formatters.push(emailValidator);
  scope.$parsers.push(emailValidator);
}

function radioInputType(scope, element, attr) {
  // correct the name
  element.attr('name', attr.id + '@' + attr.name);

  element.bind('click', function() {
    if (element[0].checked) {
      scope.$apply(function() {
        scope.$viewValue = attr.value;
        scope.$touch();
        scope.$read();
      });
    };
  });

  scope.$render = function() {
    var value = attr.value;
    element[0].checked = isDefined(value) && (value == scope.$viewValue);
  };
}

function checkboxInputType(scope, element, attr) {
  var trueValue = attr.ngTrueValue,
      falseValue = attr.ngFalseValue;

  if (!isString(trueValue)) trueValue = true;
  if (!isString(falseValue)) falseValue = false;

  element.bind('click', function() {
    scope.$apply(function() {
      scope.$viewValue = element[0].checked;
      scope.$touch();
      scope.$read();
    });
  });

  scope.$render = function() {
    element[0].checked = scope.$viewValue;
  };

  scope.$formatters.push(function(value) {
    return value === trueValue;
  });

  scope.$parsers.push(function(value) {
    return value ? trueValue : falseValue;
  });
}

var inputDirective = ['$formFactory', function($formFactory) {
  return {
    restrict: 'E',
    scope: true,
    link: function(scope, element, attr) {
      if (!attr.ngModel) return;

      scope.$viewValue = '';
      scope.$modelValue = Number.NaN;
      scope.$parsers = [];
      scope.$formatters = [];
      scope.$validators = [];
      scope.$error = {};
      scope.$pristine = true;
      scope.$dirty = false;
      scope.$valid = true;
      scope.$invalid = false;
      scope.$read = noop;

      scope.$render = function() {
        element.val(scope.$viewValue);
      };

      var form = $formFactory.forElement(element);
      scope.$touch = function() {
        scope.$dirty = true;
        scope.$pristine = false;
        form.$dirty = true;
        form.$pristine = false;
      };

      form.registerWidget(scope, attr.name);
      (inputType[attr.type] || inputType.text)(scope, element, attr);

      forEach(['valid', 'invalid', 'pristine', 'dirty'], function(name) {
        scope.$watch('$' + name, function(value) {
          element[value ? 'addClass' : 'removeClass']('ng-' + name);
        });
      });

      // TODO(vojta): do we need that now, that widget does not create parallel scopes ?
      element.bind('$destroy', function() {
        scope.$destroy();
      });
    }
  };
}];

var ngModelDirective = ['$parse', function($parse) {
  return function(scope, element, attr) {
    var getter = $parse(attr.ngModel),
        setter = getter.assign;

    // view -> model
    scope.$read = function() {
      var value = scope.$viewValue;

      forEach(scope.$parsers, function(fn) {
        if (isDefined(value)) value = fn(value);
      });

      if (isDefined(value)) {
        scope.$modelValue = value;
        setter(scope.$parent, scope.$modelValue);
      }
    };

    // model -> value
    scope.$watch(getter, function(value, last) {
      if (scope.$modelValue === value) return;

      scope.$modelValue = value;

      forEach(scope.$formatters, function(fn) {
        if (isDefined(value)) value = fn(value);
      });

      if (isDefined(value)) {
        scope.$viewValue = value;
        scope.$render();
      }
    });

    // read init value ?


    // don't $emit $valid if already $valid, the same for $invalid
    // TODO(vojta): should we rather add new method ? $emitValidation(event, error) ???
    var $emit = scope.$emit;
    scope.$emit = function(event, args) {
      if (event === '$invalid' && this.$error[args]) return;
      if (event === '$valid' && !this.$error[args]) return;
      return $emit.call(this, event, args);
    };
  };
}];
