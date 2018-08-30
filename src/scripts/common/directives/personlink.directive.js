(function() {
    'use strict';
	angular.module('facetApp')
	.directive('personlink', function() {
		return {
			restrict: 	'EC',
			scope: 		{ url: '@' },
			transclude: true,
			controller: ['$scope', 'nbfService', function($scope, nbfService){
		        if (!$scope.url) return;
		        
		        $scope.link = '#!/'+ ($scope.url).replace(new RegExp('/', 'g'), '~2F');
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        nbfService.getPopover($scope.url).then(function(data) {
		        	if (data.length) data = data[0];
		        	
		        	$scope.label = data.label;
		        	
		        	//	check if lifespan contains any numbers
		        	if ((new RegExp(/\d/)).test(data.lifespan)) {
		        		// remove leading zeros (0800-0900) -> (800-900)
		        		data.lifespan = data.lifespan.replace(/(\D)0/g, "$1");
		        		
		        		$scope.lifespan = data.lifespan;
		        	}
		        	
		        	if (data.hasOwnProperty('image')) $scope.image = data.image;
		        });
		        
			}],
			template: '<a uib-popover-template="\'views/personTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ng-href="{{ link }}"><span ng-transclude></span></a>'
		}});
})();