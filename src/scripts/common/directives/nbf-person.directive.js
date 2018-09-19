(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPerson', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'popoverService', function($scope, popoverService){
		        
		        // $scope.link = '#!/'+ ($scope.url).replace(new RegExp('/', 'g'), '~2F');
		        $scope.link = '#!/'+ ($scope.url).replace(/^.+?(p[0-9]+)$/, '$1');
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        popoverService.getPopover($scope.url).then(function(data) {
		        	if (data.length) data = data[0];
		        	
		        	$scope.label = data.label;
		        	
		        	//	lifespan is valid if contains any numeric char
		        	if ((new RegExp(/\d/)).test(data.lifespan)) {
		        		// (0800-0900) -> (800-900)
		        		data.lifespan = data.lifespan.replace(/(\D)0/g, "$1");
		        		
		        		$scope.lifespan = data.lifespan;
		        	}
		        	
		        	if (data.hasOwnProperty('image')) $scope.image = data.image;
		        	
		        });
			}],
			template: '<a uib-popover-template="\'views/personTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ng-href="{{ link }}">{{ label }}</a>'
		}});
})();