'use strict';

var directive = {};

directive.dropdownToggle =
          ['$document', '$location', '$window',
  function ($document,   $location,   $window) {
    var openElement = null, close;
    return {
      restrict: 'C',
      link: function(scope, element, attrs) {
        scope.$watch(function(){return $location.path();}, function() {
          close && close();
        });

        element.parent().bind('click', function(event) {
          close && close();
        });

        element.bind('click', function(event) {
          event.preventDefault();
          event.stopImmediatePropagation();

          var iWasOpen = false;

          if (openElement) {
            iWasOpen = openElement === element;
            close();
          }

          if (!iWasOpen){
            element.parent().addClass('open');
            openElement = element;

            close = function (event) {
              event && event.preventDefault();
              event && event.stopImmediatePropagation();
              $document.unbind('click', close);
              element.parent().removeClass('open');
              close = null;
              openElement = null;
            }

            $document.bind('click', close);
          }
        });
      }
    };
  }];


directive.tabbable = function() {
  return {
    restrict: 'C',
    compile: function(element) {
      var navTabs = angular.element('<ul class="nav nav-tabs"></ul>'),
          tabContent = angular.element('<div class="tab-content"></div>');

      tabContent.append(element.contents());
      element.append(navTabs).append(tabContent);
    },
    controller: ['$scope', '$element', function($scope, $element) {
      var navTabs = $element.contents().eq(0),
          selected = null;

      $element.prepend(navTabs);

      function tab(element, tab) {
        return element.data('nav-tab', tab);
      }

      function select(element) {
        if (selected) {
          selected.removeClass('active');
          tab(selected).removeClass('active');
        }
        selected = element;
        selected.addClass('active');
        tab(selected).addClass('active');
      }

      this.addPane = function(element, attr) {
        var li = angular.element('<li><a href></a></li>'),
            a = li.find('a');

        a.text(attr.title) || attr.$observe('title', function(title) {
          a.text(title);
        });

        navTabs.append(li);
        tab(element, li);
        li.bind('click', function(event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          select(element);
        });
        if (!selected) select(element);

        return function() {
          tab(element).remove();
        };
      }
    }]
  };
};


directive.tabPane = function() {
  return {
    require: '^tabbable',
    restrict: 'C',
    link: function(scope, element, attrs, tabsCtrl) {
      element.bind('$remove', tabsCtrl.addPane(element, attrs));
    }
  };
};


angular.module('bootstrap', []).directive(directive);
