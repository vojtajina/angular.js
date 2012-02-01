'use strict';

/**
 * @ngdoc object
 * @name angular.module.ng.$formFactory
 *
 * @description
 * Use `$formFactory` to create a new instance of a {@link angular.module.ng.$formFactory.Form Form}
 * controller or to find the nearest form instance for a given DOM element.
 *
 * The form instance is a collection of widgets, and is responsible for life cycle and validation
 * of widget.
 *
 * Keep in mind that both form and widget instances are {@link api/angular.module.ng.$rootScope.Scope scopes}.
 *
 * @param {Form=} parentForm The form which should be the parent form of the new form controller.
 *   If none specified default to the `rootForm`.
 * @returns {Form} A new {@link angular.module.ng.$formFactory.Form Form} instance.
 *
 * @example
 *
 * This example shows how one could write a widget which would enable data-binding on
 * `contenteditable` feature of HTML.
 *
    <doc:example module="formModule">
      <doc:source>
        <script>
          function EditorCntl($scope) {
            $scope.htmlContent = '<b>Hello</b> <i>World</i>!';
          }

          HTMLEditorWidget.$inject = ['$scope', '$element', '$sanitize'];
          function HTMLEditorWidget(scope, element, $sanitize) {
            scope.$parseModel = function() {
              // need to protect for script injection
              try {
                scope.$viewValue = $sanitize(
                  scope.$modelValue || '');
                if (this.$error.HTML) {
                  // we were invalid, but now we are OK.
                  scope.$emit('$valid', 'HTML');
                }
              } catch (e) {
                // if HTML not parsable invalidate form.
                scope.$emit('$invalid', 'HTML');
              }
            }

            scope.$render = function() {
              element.html(this.$viewValue);
            }

            element.bind('keyup', function() {
              scope.$apply(function() {
                scope.$emit('$viewChange', element.html());
              });
            });
          }

       angular.module('formModule', [], function($compileProvider){
         $compileProvider.directive('ngHtmlEditorModel', function ($formFactory) {
           return function(scope, element, attr) {
             var form = $formFactory.forElement(element),
                 widget;
             element.attr('contentEditable', true);
             widget = form.$createWidget({
               scope: scope,
               model: attr.ngHtmlEditorModel,
               controller: HTMLEditorWidget,
               controllerArgs: {$element: element}});
             // if the element is destroyed, then we need to
             // notify the form.
             element.bind('$destroy', function() {
               widget.$destroy();
             });
           };
         });
       });
     </script>
     <form name='editorForm' ng:controller="EditorCntl">
       <div ng:html-editor-model="htmlContent"></div>
       <hr/>
       HTML: <br/>
       <textarea ng:model="htmlContent" cols="80"></textarea>
       <hr/>
       <pre>editorForm = {{editorForm|json}}</pre>
     </form>
   </doc:source>
   <doc:scenario>
     it('should enter invalid HTML', function() {
       expect(element('form[name=editorForm]').prop('className')).toMatch(/ng-valid/);
       input('htmlContent').enter('<');
       expect(element('form[name=editorForm]').prop('className')).toMatch(/ng-invalid/);
     });
   </doc:scenario>
 </doc:example>
 */

/**
 * @ngdoc object
 * @name angular.module.ng.$formFactory.Form
 * @description
 * The `Form` is a controller which keeps track of the validity of the widgets contained within it.
 */

function $FormFactoryProvider() {
  this.$get = ['$rootScope', '$controller', function($rootScope, $controller) {
    /**
     * @ngdoc proprety
     * @name rootForm
     * @propertyOf angular.module.ng.$formFactory
     * @description
     * Static property on `$formFactory`
     *
     * Each application ({@link guide/dev_guide.scopes.internals root scope}) gets a root form which
     * is the top-level parent of all forms.
     */
    formFactory.rootForm = formFactory($rootScope);

    /**
     * @ngdoc method
     * @name forElement
     * @methodOf angular.module.ng.$formFactory
     * @description
     * Static method on `$formFactory` service.
     *
     * Retrieve the closest form for a given element or defaults to the `root` form. Used by the
     * {@link angular.module.ng.$compileProvider.directive.form form} element.
     * @param {Element} element The element where the search for form should initiate.
     */
    formFactory.forElement = function(element) {
      return element.inheritedData('$form') || formFactory.rootForm;
    };

    return formFactory;

    function formFactory(scope) {
      return $controller(FormController, scope);
    }
  }];



  /**
   * @ngdoc property
   * @name $error
   * @propertyOf angular.module.ng.$formFactory.Form
   * @description
   * Property of the form and widget instance.
   *
   * Summary of all of the errors on the page. If a widget emits `$invalid` with `REQUIRED` key,
   * then the `$error` object will have a `REQUIRED` key with an array of widgets which have
   * emitted this key. `form.$error.REQUIRED == [ widget ]`.
   */

  /**
   * @ngdoc property
   * @name $invalid
   * @propertyOf angular.module.ng.$formFactory.Form
   * @description
   * Property of the form and widget instance.
   *
   * True if any of the widgets of the form are invalid.
   */

  /**
   * @ngdoc property
   * @name $valid
   * @propertyOf angular.module.ng.$formFactory.Form
   * @description
   * Property of the form and widget instance.
   *
   * True if all of the widgets of the form are valid.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$valid
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType listen on form
   * @description
   * Upon receiving the `$valid` event from the widget update the `$error`, `$valid` and `$invalid`
   * properties of both the widget as well as the from.
   *
   * @param {string} validationKey The validation key to be used when updating the `$error` object.
   *    The validation key is what will allow the template to bind to a specific validation error
   *    such as `<div ng:show="form.$error.KEY">error for key</div>`.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$invalid
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType listen on form
   * @description
   * Upon receiving the `$invalid` event from the widget update the `$error`, `$valid` and `$invalid`
   * properties of both the widget as well as the from.
   *
   * @param {string} validationKey The validation key to be used when updating the `$error` object.
   *    The validation key is what will allow the template to bind to a specific validation error
   *    such as `<div ng:show="form.$error.KEY">error for key</div>`.
   */

  /**
   * @ngdoc event
   * @name angular.module.ng.$formFactory.Form#$viewChange
   * @eventOf angular.module.ng.$formFactory.Form
   * @eventType listen on widget
   * @description
   * A widget is responsible for emitting this event whenever the view changes do to user interaction.
   * The event takes a `$viewValue` parameter, which is the new value of the view. This
   * event triggers a call to `$parseView()` as well as `$validate` event on widget.
   *
   * @param {*} viewValue The new value for the view which will be assigned to `widget.$viewValue`.
   */


}
