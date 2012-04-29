angular.module('docsApp', ['ngResource', 'ngCookies', 'ngSanitize']).
  config(function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  }).

  directive('dropdownToggle', function($document, $location) {
    return {
      restrict: 'C',
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          var close = angular.noop,
              unwatch = scope.$watch(function(){return $location.path();}, function() {
                close();
              });

          element.parent().addClass('open');
          setTimeout(function(){
            close = function () {
              unwatch();
              $document.unbind('click', close);
              element.parent().removeClass('open');
            }

            $document.bind('click', close);
          }, 0);
        });
      }
    };
  }).

  directive('code', function() {
    return { restrict:'E', terminal: true };
  }).

  controller('DocsController', function ($scope, $location, $window, $cookies, $filter) {
    var OFFLINE_COOKIE_NAME = 'ng-offline',
      DOCS_PATH = /^\/(api)|(guide)|(cookbook)|(misc)|(tutorial)/,
      INDEX_PATH = /^(\/|\/index[^\.]*.html)$/,
      filter = $filter('filter');

    $scope.$location = $location;
    $scope.versionNumber = angular.version.full;
    $scope.version = angular.version.full + "  " + angular.version.codeName;
    $scope.subpage = false;
    $scope.offlineEnabled = ($cookies[OFFLINE_COOKIE_NAME] == angular.version.full);
    $scope.futurePartialTitle = null;
    $scope.loading = 0;

    if (!$location.path() || INDEX_PATH.test($location.path())) {
      $location.path('/api').replace();
    }

    $scope.$watch('$location.path()', function(path) {
      // ignore non-doc links which are used in examples
      if (DOCS_PATH.test(path)) {
        var parts = path.split('/');
        $scope.sectionId = parts[1];
        $scope.partialId = parts[2] || 'index';
        $scope.pages = filter(NG_PAGES, {section: $scope.sectionId});

        var i = $scope.pages.length;
        while (i--) {
          if ($scope.pages[i].id == $scope.partialId) break;
        }
        if (i<0) {
          $scope.partialTitle = 'Error: Page Not Found!';
          delete $scope.partialId;
        } else {
          // TODO(i): this is not ideal but better than updating the title before a partial arrives,
          //   which results in the old partial being displayed with the new title
          $scope.futurePartialTitle = $scope.pages[i].name;
          $scope.loading++;
        }
      }
    });

    $scope.$watch('search', function(search) {
      var GLOBALS = /^angular\.([^\.]*)$/,
          MODULE = /^angular\.module\.([^\.]*)$/,
          MODULE_MOCK = /^angular\.mock\.([^\.]*)$/,
          MODULE_DIRECTIVE = /^angular\.module\.([^\.]*)(?:\.\$compileProvider)?\.directive\.([^\.]*)$/,
          MODULE_DIRECTIVE_INPUT = /^angular\.module\.([^\.]*)\.\$compileProvider\.directive\.input\.([^\.]*)$/,
          MODULE_FILTER = /^angular\.module\.([^\.]*)\.\$?filter\.([^\.]*)$/,
          MODULE_SERVICE = /^angular\.module\.([^\.]*)\.([^\.]*?)(Provider)?$/,
          MODULE_TYPE = /^angular\.module\.([^\.]*)\..*\.([A-Z][^\.]*)$/,
          cache = {},
          mockGlobals = [],
          sections = $scope.sections = {
            globals: [],
            types: [],
            modules: []
          };

      angular.forEach($scope.pages, function(page) {
        var match,
            id = page.id;

        if (!contains(page.keywords, search)) return

        if (match = id.match(GLOBALS)) {
          sections.globals.push(page);
        } else if (match = id.match(MODULE)) {
          module(match[1]);
        } else if (match = id.match(MODULE_SERVICE)) {
          module(match[1]).service(match[2])[match[3] ? 'provider' : 'instance'] = page;
        } else if (match = id.match(MODULE_FILTER)) {
          module(match[1]).filters.push(page);
        } else if (match = id.match(MODULE_DIRECTIVE)) {
          module(match[1]).directives.push(page);
        } else if (match = id.match(MODULE_DIRECTIVE_INPUT)) {
          module(match[1]).directives.push(page);
        } else if (match = id.match(MODULE_TYPE)) {
          module(match[1]).types.push(page);
        } else if (match = id.match(MODULE_MOCK)) {
          mockGlobals.push(page);
        } else {
          console.log('UNMATCHED', page.id, page);
        }

        function module(name) {
          var module = cache[name];
          if (!module) {
            module = cache[name] = {
              name: match[1],
              globals: match[1] == 'ngMock' ? mockGlobals : [],
              directives: [],
              services: [],
              service: function(name) {
                var service =  cache[this.name + ':' + name];
                if (!service) {
                  service = {name: name};
                  cache[this.name + ':' + name] = service;
                  this.services.push(service);
                }
                return service;
              },
              types: [],
              filters: []
            }
            sections.modules.push(module);
          }
          return module;
        }
      });

      $scope.sections = sections;

      console.log(sections)

      function contains(keywords, terms) {
        var found = true;
        terms && angular.forEach(terms.toLowerCase().split(' '), function(term) {
          found = found && (!term || keywords.indexOf(term) != -1);
        });
        return found;
      }
    });

    $scope.getUrl = function(page) {
      return page && page.section + (page.id == 'index' ? '' : '/' + page.id);
    };

    $scope.getCurrentPartial = function() {
      return this.partialId
        ? ('./partials/' + this.sectionId + '/' + this.partialId.replace('angular.Module', 'angular.IModule') + '.html')
        : '';
    };

    $scope.selectedSection = function(section) {
      return section == $scope.sectionId ? 'current' : '';
    };

    $scope.navClass = function(page1, page2) {
      return {
        last: this.$position == 'last',
        active: page1 && (this.partialId == page1.id) || page2 && (this.partialId == page2.id)
      };
    }

    $scope.afterPartialLoaded = function() {
      var currentPageId = $location.path();
      $scope.loading--;
      $scope.partialTitle = $scope.futurePartialTitle;
      SyntaxHighlighter.highlight();
      $window._gaq.push(['_trackPageview', currentPageId]);
      loadDisqus(currentPageId);
    };

    /** stores a cookie that is used by apache to decide which manifest ot send */
    $scope.enableOffline = function() {
      //The cookie will be good for one year!
      var date = new Date();
      date.setTime(date.getTime()+(365*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
      var value = angular.version.full;
      document.cookie = OFFLINE_COOKIE_NAME + "="+value+expires+"; path=" + $location.path;

      //force the page to reload so server can serve new manifest file
      window.location.reload(true);
    };

    // bind escape to hash reset callback
    angular.element(window).bind('keydown', function(e) {
      if (e.keyCode === 27) {
        $scope.$apply(function() {
          $scope.subpage = false;
        });
      }
    });

    function loadDisqus(currentPageId) {
      // http://docs.disqus.com/help/2/
      window.disqus_shortname = 'angularjs-next';
      window.disqus_identifier = currentPageId;
      window.disqus_url = 'http://docs-next.angularjs.org' + currentPageId;

      if ($location.host() == 'localhost') {
        return; // don't display disqus on localhost, comment this out if needed
        //window.disqus_developer = 1;
      }

      // http://docs.disqus.com/developers/universal/
      (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = 'http://angularjs.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] ||
          document.getElementsByTagName('body')[0]).appendChild(dsq);
      })();

      angular.element(document.getElementById('disqus_thread')).html('');
    }
  }).


  controller('TutorialInstructionsCtrl', function ($scope, $cookieStore) {
    $scope.selected = $cookieStore.get('selEnv') || 'git-mac';

    $scope.currentCls = function(id, cls) {
      return this.selected == id  ? cls || 'active' : '';
    };

    $scope.select = function(id) {
      this.selected = id;
      $cookieStore.put('selEnv', id);
    };
  })







SyntaxHighlighter['defaults'].toolbar = false;
SyntaxHighlighter['defaults'].gutter = true;

angular.module('ngdocs', ['ngdocs.directives', 'ngResource', 'ngCookies', 'ngSanitize'],
    function($locationProvider, $filterProvider, $compileProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');

  $compileProvider.directive('code', function() {
    return { restrict: 'E', terminal: true };
  });
});
