describe('directive controller', function() {
  var element;

  var MyCtrl = function($scope) {
    $scope.name = 'name from controller';
  };

  angular.module('test-ctrl').controller('MyCtrl', MyCtrl);

  beforeEach(module(function() {
    return function($compile, $rootScope) {
      element = $('<div><div controller="MyCtrl"><span bind="name"></span></div></div>');

      var template = $compile([element[0]]);
      var block = template([element[0]]);

      block.attach($rootScope);
      $rootScope.$apply();
    };
  }));


  it('should instantiate the controller and inject scope', function() {
    module(function($provide) {
      $provide.service('controller:MyCtrl', MyCtrl, true);
    });

    inject(function() {
      expect(element.text()).toContain('name from controller');
    });
  });


  it('should allow registering on module', function() {
    module('test-ctrl');

    inject(function() {
      expect(element.text()).toContain('name from controller');
    });
  });


  it('should create new scope', function() {
    module('test-ctrl');

    inject(function($rootScope) {
      expect(element.text()).toContain('name from controller');

      $rootScope.$apply(function() {
        $rootScope.name = 'name on root scope';
      });

      expect(element.text()).toContain('name from controller');
    });
  });
});
