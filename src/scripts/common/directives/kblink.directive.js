(function() {
    'use strict';
	angular.module('facetApp')
	.directive('kblink', function() {
		return {
			restrict: 	'EC',
			scope: 		{ href: '@' },
			transclude: true,
			controller: ['$scope', 'popoverService', function($scope, popoverService){
				
				if (!$scope.href) return;
		        
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        popoverService.getHrefPopover($scope.href).then(function(data) {
		        	if (data.length) data = data[0];
		        	
		        	$scope.label = data.label;
		        	
		        	$scope.link = '#!/henkilo/'+ (data.id).replace(/^.+?(p[0-9_]+)$/, '$1');
		        	
		        	//	check if lifespan contains any numbers
		        	if ((new RegExp(/\d/)).test(data.lifespan)) {
		        		// remove leading zeros (0800-0900) -> (800-900)
		        		data.lifespan = data.lifespan.replace(/(\D)0/g, "$1");
		        		
		        		$scope.lifespan = data.lifespan;
		        	}
		        	
		        	if (data.hasOwnProperty('image')) $scope.image = data.image;
		        });
		        
			}],
			template: '<a uib-popover-template="\'views/tooltips/personTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ng-href="{{ link }}" ng-transclude></a>'
		}});
})();