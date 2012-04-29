var docsApp = {
  controller: {},
  directive: {},
  serviceFactory: {}
};


docsApp.directive.focused = function() {
  return function(scope, element, attrs) {
    element[0].focus();
    element.bind('focus', function() {
      scope.$apply(attrs.focused + '=true');
    });
    element.bind('blur', function() {
      scope.$apply(attrs.focused + '=false');
    });
    scope.$eval(attrs.focused + '=true')
  }
};


docsApp.directive.code = function() {
  return { restrict:'E', terminal: true };
};

docsApp.directive.sourceEdit = function(getEmbededTemplate) {
  return {
    template: '<button ng-click="fiddle($event)" class="btn btn-primary pull-right"><i class="icon-pencil"></i> Edit</button>\n',
    scope: true,
    controller: function($scope, $attrs, openJsFiddle) {
      var sources = {
        module: $attrs.sourceEdit,
        deps: read($attrs.sourceEditDeps),
        html: read($attrs.sourceEditHtml),
        css: read($attrs.sourceEditCss),
        js: read($attrs.sourceEditJs),
        unit: read($attrs.sourceEditUnit),
        scenario: read($attrs.sourceEditScenario)
      };
      $scope.fiddle = function(e) {
        e.stopPropagation();
        openJsFiddle(sources);
      }
    }
  }

  function read(text) {
    var files = [];
    angular.forEach(text ? text.split(' ') : [], function(refId) {
      files.push({name: refId.split('-')[0], content: getEmbededTemplate(refId)});
    });
    return files;
  }
};


docsApp.serviceFactory.angularUrls = function($document) {
  var urls = {};

  angular.forEach($document.find('script'), function(script) {
    var match = script.src.match(/^.*\/(angular[^\/]*\.js)$/);
    if (match) {
      urls[match[1].replace(/\-\d.*\.js$/, '.js')] = match[0];
    }
  });

  return urls;
}


docsApp.serviceFactory.formPostData = function($document) {
  return function(url, fields) {
    var form = angular.element('<form style="display: none;" method="post" action="' + url + '" target="_blank"></form>');
    angular.forEach(fields, function(value, name) {
      var input = angular.element('<input type="hidden" name="' +  name + '">');
      input.attr('value', value);
      form.append(input);
    });
    $document.find('body').append(form);
    form[0].submit();
    form.remove();
  };
};


docsApp.serviceFactory.openJsFiddle = function(templateMerge, getEmbededTemplate, formPostData, angularUrls) {
  var HTML = '<div ng-app="{{module}}">\n{{html:2}}</div>',
      CSS = '</style> <!-- Ugly Hack due to jsFiddle issue: http://goo.gl/BUfGZ --> \n{{head:0}}<style>\n​.ng-invalid { border: 1px solid red; }​\n{{css}}',
      SCRIPT = '{{script}}',
      SCRIPT_CACHE = '\n\n<!-- {{file}} -->\n<script type="text/ng-template" id="{{name}}">\n{{content:2}}</script>';

  return function(content) {
    var prop = {
          module: content.module,
          html: '',
          css: '',
          script: ''
        };

    prop.head = templateMerge('<script src="{{url}}"></script>', {url: angularUrls['angular.js']})

    angular.forEach(content.html, function(file, index) {
      if (index) {
        prop.html += templateMerge(SCRIPT_CACHE, file);
      } else {
        prop.html += file.content;
      }
    });

    angular.forEach(content.js, function(file, index) {
      prop.script += file.content;
    });

    angular.forEach(content.css, function(file, index) {
      prop.css += file.content;
    });

    formPostData("http://jsfiddle.net/api/post/library/pure/", {
      title: 'AngularJS Example',
      html: templateMerge(HTML, prop),
      js: templateMerge(SCRIPT, prop),
      css: templateMerge(CSS, prop)
    });
  };
};



docsApp.serviceFactory.sections = function sections() {
  var sections = {
    guide: [],
    api: [],
    tutorial: [],
    misc: [],
    cookbook: [],
    getPage: function(sectionId, partialId) {
      var pages = sections[sectionId];

      for (var i = 0, ii = pages.length; i < ii; i++) {
        if (pages[i].id == partialId) {
          return pages[i];
        }
      }
      return null;
    }
  };

  angular.forEach(NG_PAGES, function(page) {
    var isIndex = page.id == 'index';

    page.url = page.section + (isIndex ? '' : '/' + page.id);
    page.partialUrl = 'partials/' + page.url + '.html';

    !(isIndex && page.section == 'api') && sections[page.section].push(page);
  });

  return sections;
};


docsApp.controller.DocsController = function($scope, $location, $window, $cookies, sections) {
  var OFFLINE_COOKIE_NAME = 'ng-offline',
      DOCS_PATH = /^\/(api)|(guide)|(cookbook)|(misc)|(tutorial)/,
      INDEX_PATH = /^(\/|\/index[^\.]*.html)$/,
      GLOBALS = /^angular\.([^\.]*)$/,
      MODULE = /^angular\.module\.([^\.]*)$/,
      MODULE_MOCK = /^angular\.mock\.([^\.]*)$/,
      MODULE_DIRECTIVE = /^angular\.module\.([^\.]*)(?:\.\$compileProvider)?\.directive\.([^\.]*)$/,
      MODULE_DIRECTIVE_INPUT = /^angular\.module\.([^\.]*)\.\$compileProvider\.directive\.input\.([^\.]*)$/,
      MODULE_FILTER = /^angular\.module\.([^\.]*)\.\$?filter\.([^\.]*)$/,
      MODULE_SERVICE = /^angular\.module\.([^\.]*)\.([^\.]*?)(Provider)?$/,
      MODULE_TYPE = /^angular\.module\.([^\.]*)\..*\.([A-Z][^\.]*)$/,
      URL = {
        module: 'guide/module',
        directive: 'guide/directive',
        input: 'api/angular.module.ng.$compileProvider.directive.input',
        filter: 'guide/dev_guide.templates.filters',
        service: 'guide/dev_guide.services',
        type: 'guide/types'
      };


  /**********************************
   Publish methods
   ***********************************/

  $scope.navClass = function(page1, page2) {
    return {
      last: this.$position == 'last',
      active: page1 && this.currentPage == page1 || page2 && this.currentPage == page2
    };
  }

  $scope.submitForm = function() {
    $scope.bestMatch && $location.path($scope.bestMatch.page.url);
  };

  $scope.afterPartialLoaded = function() {
    var currentPageId = $location.path();
    $scope.partialTitle = $scope.currentPage.name;
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



  /**********************************
   Watches
   ***********************************/

  var SECTION_NAME = {
    api: 'API Reference',
    guide: 'Developer Guide',
    misc: 'Miscellaneous',
    tutorial: 'Tutorial',
    cookbook: 'Examples'
  };
  $scope.$watch(function() {return $location.path(); }, function(path) {
    // ignore non-doc links which are used in examples
    if (DOCS_PATH.test(path)) {
      var parts = path.split('/'),
        sectionId = parts[1],
        partialId = parts[2],
        sectionName = SECTION_NAME[sectionId] || sectionId,
        page = sections.getPage(sectionId, partialId);

      $scope.currentPage = sections.getPage(sectionId, partialId);

      if (!$scope.currentPage) {
        $scope.partialTitle = 'Error: Page Not Found!';
      }

      updateSearch();


      // Update breadcrumbs
      var breadcrumb = $scope.breadcrumb = [],
        match;

      if (partialId) {
        breadcrumb.push({ name: sectionName, url: sectionId });
        if (match = partialId.match(GLOBALS)) {
          breadcrumb.push({ name: partialId });
        } else if (match = partialId.match(MODULE)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: match[1] });
        } else if (match = partialId.match(MODULE_SERVICE)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: match[1], url: sectionId + '/angular.module.' + match[1] });
          breadcrumb.push({ name: 'service', url: URL.service });
          breadcrumb.push({ name: match[2] });
        } else if (match = partialId.match(MODULE_FILTER)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: match[1], url: sectionId + '/angular.module.' + match[1] });
          breadcrumb.push({ name: 'filter', url: URL.filter });
          breadcrumb.push({ name: match[2] });
        } else if (match = partialId.match(MODULE_DIRECTIVE)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: match[1], url: sectionId + '/angular.module.' + match[1] });
          breadcrumb.push({ name: 'directive', url: URL.directive });
          breadcrumb.push({ name: match[2] });
        } else if (match = partialId.match(MODULE_DIRECTIVE_INPUT)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: match[1], url: sectionId + '/angular.module.' + match[1] });
          breadcrumb.push({ name: 'directive', url: URL.directive });
          breadcrumb.push({ name: 'input', url: URL.input });
          breadcrumb.push({ name: match[2] });
        } else if (match = partialId.match(MODULE_TYPE)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: match[1], url: sectionId + '/angular.module.' + match[1] });
          breadcrumb.push({ name: 'type', url: URL.type });
          breadcrumb.push({ name: match[2] });
        } else if (match = partialId.match(MODULE_MOCK)) {
          breadcrumb.push({ name: 'module', url: URL.module });
          breadcrumb.push({ name: 'mock', url: sectionId + '/angular.mock' });
          breadcrumb.push({ name: 'angular.mock.' + match[1] });
        } else {
          breadcrumb.push({ name: page.shortName });
        }
      } else {
        breadcrumb.push({ name: sectionName });
      }
    }
  });

  $scope.$watch('search', updateSearch);



  /**********************************
   Initialize
   ***********************************/

  $scope.versionNumber = angular.version.full;
  $scope.version = angular.version.full + "  " + angular.version.codeName;
  $scope.subpage = false;
  $scope.offlineEnabled = ($cookies[OFFLINE_COOKIE_NAME] == angular.version.full);
  $scope.futurePartialTitle = null;
  $scope.loading = 0;
  $scope.URL = URL;

  if (!$location.path() || INDEX_PATH.test($location.path())) {
    $location.path('/api').replace();
  }
  // bind escape to hash reset callback
  angular.element(window).bind('keydown', function(e) {
    if (e.keyCode === 27) {
      $scope.$apply(function() {
        $scope.subpage = false;
      });
    }
  });

  /**********************************
   Private methods
   ***********************************/

  function updateSearch() {
    var cache = {},
        pages = sections[$location.path().split('/')[1]],
        modules = $scope.modules = [],
        otherPages = $scope.pages = [],
        search = $scope.search,
        bestMatch = {page: null, rank:0};

    angular.forEach(pages, function(page) {
      var match,
        id = page.id;

      if (!(match = rank(page, search))) return;

      if (match.rank > bestMatch.rank) {
        bestMatch = match;
      }

      if (match = id.match(GLOBALS)) {
        module('ng').globals.push(page);
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
        module('ngMock').globals.push(page);
      } else {
        otherPages.push(page);
      }

    });

    $scope.bestMatch = bestMatch;

    /*************/

    function module(name) {
      var module = cache[name];
      if (!module) {
        module = cache[name] = {
          name: name,
          url: 'api/angular.module.' + name,
          globals: [],
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
        modules.push(module);
      }
      return module;
    }

    function rank(page, terms) {
      var ranking = {page: page, rank:0},
        keywords = page.keywords,
        title = page.shortName.toLowerCase();

      terms && angular.forEach(terms.toLowerCase().split(' '), function(term) {
        var index;

        if (ranking) {
          if (keywords.indexOf(term) == -1) {
            ranking = null;
          } else {
            ranking.rank ++; // one point for each term found
            if ((index = title.indexOf(term)) != -1) {
              ranking.rank += 20 - index; // ten points if you match title
            }
          }
        }
      });
      return ranking;
    }
  }


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
}


docsApp.controller.TutorialInstructionsCtrl = function ($scope, $cookieStore) {
  $scope.selected = $cookieStore.get('selEnv') || 'git-mac';

  $scope.currentCls = function (id, cls) {
    return this.selected == id  ? cls || 'active' : '';
  };

  $scope.select = function (id) {
    this.selected = id;
    $cookieStore.put('selEnv', id);
  };
}


angular.module('docsApp', ['ngResource', 'ngCookies', 'ngSanitize', 'bootstrap', 'bootstrapPrettify']).
  config(function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  }).
  factory(docsApp.serviceFactory).
  directive(docsApp.directive).
  controller(docsApp.controller);
