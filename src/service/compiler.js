'use strict';

/**
 * @ngdoc function
 * @name angular.module.ng.$compile
 * @function
 *
 * @description
 * Compiles a piece of HTML string or DOM into a template and produces a template function, which
 * can then be used to link {@link angular.module.ng.$rootScope.Scope scope} and the template together.
 *
 * The compilation is a process of walking the DOM tree and trying to match DOM elements to
 * {@link angular.markup markup}, {@link angular.attrMarkup attrMarkup},
 * {@link angular.widget widgets}, and {@link angular.directive directives}. For each match it
 * executes corresponding markup, attrMarkup, widget or directive template function and collects the
 * instance functions into a single template function which is then returned.
 *
 * The template function can then be used once to produce the view or as it is the case with
 * {@link angular.widget.@ng:repeat repeater} many-times, in which case each call results in a view
 * that is a DOM clone of the original template.
 *
   <pre>
    angular.injector('ng').invoke(null, function($rootScope, $compile) {
      // Chose one:

      // A: compile the entire window.document.
      var element = $compile(window.document)($rootScope);

      // B: compile a piece of html
      var element = $compile('<div ng:click="clicked = true">click me</div>')($rootScope);

      // C: compile a piece of html and retain reference to both the dom and scope
      var element = $compile('<div ng:click="clicked = true">click me</div>')(scope);
      // at this point template was transformed into a view
    });
   </pre>
 *
 *
 * @param {string|DOMElement} element Element or HTML to compile into a template function.
 * @returns {function(scope[, cloneAttachFn])} a template function which is used to bind template
 * (a DOM element/tree) to a scope. Where:
 *
 *  * `scope` - A {@link angular.module.ng.$rootScope.Scope Scope} to bind to.
 *  * `cloneAttachFn` - If `cloneAttachFn` is provided, then the link function will clone the
 *               `template` and call the `cloneAttachFn` function allowing the caller to attach the
 *               cloned elements to the DOM document at the appropriate place. The `cloneAttachFn` is
 *               called as: <br/> `cloneAttachFn(clonedElement, scope)` where:
 *
 *      * `clonedElement` - is a clone of the original `element` passed into the compiler.
 *      * `scope` - is the current scope with which the linking function is working with.
 *
 * Calling the template function returns the element of the template. It is either the original element
 * passed in, or the clone of the element if the `cloneAttachFn` is provided.
 *
 * It is important to understand that the returned scope is "linked" to the view DOM, but no linking
 * (instance) functions registered by {@link angular.directive directives} or
 * {@link angular.widget widgets} found in the template have been executed yet. This means that the
 * view is likely empty and doesn't contain any values that result from evaluation on the scope. To
 * bring the view to life, the scope needs to run through a $digest phase which typically is done by
 * Angular automatically, except for the case when an application is being
 * {@link guide/dev_guide.bootstrap.manual_bootstrap} manually bootstrapped, in which case the
 * $digest phase must be invoked by calling {@link angular.module.ng.$rootScope.Scope#$apply}.
 *
 * If you need access to the bound view, there are two ways to do it:
 *
 * - If you are not asking the linking function to clone the template, create the DOM element(s)
 *   before you send them to the compiler and keep this reference around.
 *   <pre>
 *     var $injector = angular.injector('ng');
 *     var scope = $injector.invoke(null, function($rootScope, $compile){
 *       var element = $compile('<p>{{total}}</p>')($rootScope);
 *     });
 *   </pre>
 *
 * - if on the other hand, you need the element to be cloned, the view reference from the original
 *   example would not point to the clone, but rather to the original template that was cloned. In
 *   this case, you can access the clone via the cloneAttachFn:
 *   <pre>
 *     var original = angular.element('<p>{{total}}</p>'),
 *         scope = someParentScope.$new(),
 *         clone;
 *
 *     $compile(original)(scope, function(clonedElement, scope) {
 *       clone = clonedElement;
 *       //attach the clone to DOM document at the right place
 *     });
 *
 *     //now we have reference to the cloned DOM via `clone`
 *   </pre>
 *
 *
 * Compiler Methods For Widgets and Directives:
 *
 * The following methods are available for use when you write your own widgets, directives,
 * and markup.  (Recall that the compile function's this is a reference to the compiler.)
 *
 *  `compile(element)` - returns linker -
 *  Invoke a new instance of the compiler to compile a DOM element and return a linker function.
 *  You can apply the linker function to the original element or a clone of the original element.
 *  The linker function returns a scope.
 *
 *  * `comment(commentText)` - returns element - Create a comment element.
 *
 *  * `element(elementName)` - returns element - Create an element by name.
 *
 *  * `text(text)` - returns element - Create a text element.
 *
 *  * `descend([set])` - returns descend state (true or false). Get or set the current descend
 *  state. If true the compiler will descend to children elements.
 *
 *  * `directives([set])` - returns directive state (true or false). Get or set the current
 *  directives processing state. The compiler will process directives only when directives set to
 *  true.
 *
 * For information on how the compiler works, see the
 * {@link guide/dev_guide.compiler Angular HTML Compiler} section of the Developer Guide.
 */


function $CompileProvider($injector){
  var directiveCache = {},
      directiveFactories = {},
      COMMENT_DIRECTIVE_REGEXP = /^\s*directive\:\s*([\d\w\-_]+)\s+(.*)$/,
      CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/,
      SPECIAL_CHARS_REGEXP = /[\:\-]/g,
      PREFIX_REGEXP = /^(x_data_|x_|data_)/;

  this.directive = function registerDirective(name, directive){
    // TODO(misko): this is too complex clean it up and merge with getDirective
    if (isString(name)) {
      assertArg(directive, 'directive');
      name = normalize(name);
      directiveCache[name] = false;
      directiveFactories[name] = function() {
        directive = $injector.invoke(null, directive);
        return directiveCache[name] = isFunction(directive)
          ? { priority:0, templateFn: valueFn(directive) }
          : extend({priority:0 }, directive);
      }
    } else {
      forEach(name, function(fn, name) {
        registerDirective(name, fn);
      });
    }
    return this;
  };


  this.$get = ['$interpolate', '$exceptionHandler',
       function($interpolate,   $exceptionHandler) {

     var recursiveCompileDirective = {
           priority: -9999, // ensure it is the last one to run;
           templateFn: function (element) {
             var linkFn = compileNodes(element[0].childNodes);
             return linkFn && function(scope, element) {
               linkFn(scope, element[0].childNodes);
             }
           }
         };

    return function(templateElement) {
      templateElement = jqLite(templateElement);
      var linkingFn = compileNodes(templateElement);
      return function(scope, cloneConnectFn){
        assertArg(scope, 'scope');
        // important!!: we must call our jqLite.clone() since the jQuery one is trying to be smart
        // and sometimes changes the structure of the DOM.
        var element = cloneConnectFn
          ? JQLitePrototype.clone.call(templateElement) // IMPORTANT!!!
          : templateElement;
        // TODO(misko): I don't thin we need this anymore
        //element.data($$scope, scope);
        cloneConnectFn && cloneConnectFn(element, scope);
        linkingFn(scope, element);
        return element;
      };
    };

    //================================

    /**
     * Sorting function for bound directives.
     * @param a
     * @param b
     */
    function byPriority(a, b) {
      return b.priority - a.priority;
    }

    /**
     * looks up the directive and decorates it with exception handling and proper parameters. We
     * call this the boundDirective.
     *
     * @param name name of the directive to look up.
     * @param templateAttrs list of current normalized attributes for the directive
     * @param attrName name of the non-normilize attribute where the value was read from.
     * @param attrValue value for the attribute.
     * @returns bound directive function.
     */
    function getDirective(name) {
      if (directiveFactories.hasOwnProperty(name)) {
        try {
          return directiveCache[name] || (directiveCache[name] = directiveFactories[name]());
        } catch(e) { $exceptionHandler(e); }
      }
    }

    /**
     * Once the directives have been collected they are sorted and then applied to the element
     * by priority order.
     *
     * @param directives
     * @param templateNode
     * @returns linkingFn
     */
    function applyDirectivesPerElement(directives, templateNode, templateAttrs) {
      directives.sort(byPriority);

      // executes all directives at a given element
      for(var i = 0, ii = directives.length,
            linkingFns = [], directive,
            element = templateAttrs.$element = jqLite(templateNode); i < ii; i++) {
        try {
          directive = directives[i];
          directive.templateFn && linkingFns.push(directive.templateFn(element, templateAttrs));
        } catch (e) {
          $exceptionHandler(e);
        }
        if (directive.terminal) {
          break; // prevent further processing of directives
        }
      }

      return function(scope, linkNode) {
        var attrs, element;
        if (templateNode === linkNode) {
          attrs = templateAttrs;
          element = attrs.$element;
        } else {
          attrs = {};
          // this is a shallow copy which replaces $element;
          for(var key in templateAttrs) {
            if (templateAttrs.hasOwnProperty(key)) {
              if (key == '$element') {
                element = attrs.$element = jqLite(linkNode);
              } else {
                attrs[key] = templateAttrs[key];
              }
            }
          }
        }
        for(var i = 0, ii = linkingFns.length, linkingFn; i < ii; i++) {
          if (linkingFn = linkingFns[i]) {
            try {
              scope = (linkingFn(scope, element, attrs) || scope);
            } catch (e) {
              $exceptionHandler(e);
            }
          }
        }
      };
    }

    function textInterpolateDirective(interpolateFn) {
      return {
        priority: 100,
        templateFn: valueFn(function(scope, node) {
          scope.$watch(function() { return interpolateFn(scope); }, function(scope, value){
            node[0].nodeValue = value;
          });
        })
      };
    }

    function attrInterpolateDirective(interpolateFn, name) {
      return {
        priority: 100,
        templateFn: valueFn(function(scope, element, attr) {
          scope.$watch(function() { return interpolateFn(scope); }, function(scope, value){
            attr.$set(name, value);
          });
        })
      };
    }

    /**
     * Compile function matches the nodeList against the directives, and then executes the
     * directive template function.
     * @param nodeList
     * @returns a composite linking function of all of the matched directives.
     */
    function compileNodes(nodeList) {
      var linkingFns = [];

      for(var i = 0; i < nodeList.length; i++) {
        var node = nodeList[i],
            directives = [],
            directive,
            expName = undefined,
            expValue = undefined,
            attrsMap = {},
            attrs = {
              $attr: attrsMap,
              $normalize: normalize,
              $set: attrSetter},
            match,
            text;

        switch(node.nodeType) {
          case 1: /* Element */
            // iterate over the attributes
            for (var attr, name, nName, value, nAttrs = node.attributes,
                     j = 0, jj = nAttrs && nAttrs.length; j < jj; j++) {
              attr = nAttrs[j];
              nName = normalize(name = attr.name);
              attrsMap[nName] = name;
              attrs[nName] = value = trim((msie && name == 'href')
                  ? decodeURIComponent(node.getAttribute(name, 2))
                  : attr.value);
              if (BOOLEAN_ATTR[nName]) {
                attrs[nName] = true; // presence means true
              } else if (nName == 'exp') {
                expName = name;
                expValue = value;
              }
              if (directive = $interpolate(value, true)) {
                directives.push(attrInterpolateDirective(directive, name));
              }
              if (directive = getDirective(nName)) {
                directives.push(directive);
              }
            }

            // use the node name: <directive>
            if (directive = getDirective(normalize(node.nodeName))) {
              // put at the begging of array, to make it look like the element directive
              // has priority over attribute directives.
              directives.unshift(directive);
            }

            // use class as directive
            text = node.className;
            while (match = CLASS_DIRECTIVE_REGEXP.exec(text)) {
              if (directive = getDirective(nName = normalize(match[2]))) {
                attrs[nName] = trim(match[3]);
                directives.push(directive);
              }
              text = text.substr(match.index + match[0].length);
            }

            // recurse to children
            if (node.childNodes.length) {
              directives.push(recursiveCompileDirective);
            }

            break;
          case 3: /* Text Node */
            if (directive = $interpolate(node.nodeValue, true)) {
              directives.push(textInterpolateDirective(directive));
            }
            break;
          case 8: /* Comment */
            match = COMMENT_DIRECTIVE_REGEXP.exec(node.nodeValue);
            if (match &&
              (directive = getDirective(nName = normalize(match[1]),  attrs))) {
              attrs[nName] = trim(match[2]);
              directives.push(directive);
            }
            break;
        }

        // only bother if you found any directives for this node
        linkingFns.push(directives.length ? applyDirectivesPerElement(directives, node, attrs) : null);
      }

      // return a linking function if we have found anything.
      return linkingFns.length
        ? function(scope, nodeList) {
            for(var linkingFn, i=0, ii=linkingFns.length; i<ii; i++) {
              if (linkingFn = linkingFns[i]) {
                linkingFn(scope, nodeList[i]);
              }
            }
          }
        : null;
    }
  }];

  // =============================

  /**
   * convert all accepted dirctive format into proper directive name.
   * All of these will become 'my:directive':
   *   my:DiRective
   *   my-directive
   *   x-my-directive
   *   data-my:directive
   *   x-data-my:directive
   * @param name name to normalize
   */
  function normalize(name) {
    return name.
      toLowerCase().
      replace(SPECIAL_CHARS_REGEXP, '_').
      replace(PREFIX_REGEXP, '');
  }

  // TODO(misko): it is not clear to me if the key should be normalize or not.
  // TODO(misko): this should also work for setting attributes in classes and comments
  function attrSetter(key, value) {
    if (key) {
      if (isUndefined(value)) {
        this.$element.removeAttr(key);
      } else {
        this.$element.attr(key, BOOLEAN_ATTR[lowercase(key)] ? toBoolean(value) : value);
      }
      this[normalize(key)] = value;
    }
  }
    
}
