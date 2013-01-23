// patch closure to append timestamps to use Testacular's caching
var importScript_ = goog.importScript_;
goog.importScript_ = function(src) {
  return importScript_(src + '?' + window.__testacular__.files[src]);
};

// this should get refactored, so that requiring whole angular is simpler
goog.require('angular.module');
goog.require('angular.injector');
goog.require('angular.core.directives');
goog.require('angular.core.$rootScope');
goog.require('angular.core.$compile');
