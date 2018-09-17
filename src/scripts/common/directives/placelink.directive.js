(function() {
    'use strict';
	angular.module('facetApp')
	.directive('placelink', function() {
		return {
			restrict: 	'EC',
			scope: 		{ url: '@' },
			transclude: true,
			controller: ['$scope', 'popoverService', function($scope, popoverService){
		        if (!$scope.url) return;
		        
		        $scope.link = '#!/'+ ($scope.url).replace(new RegExp('/', 'g'), '~2F');
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        popoverService.getPlacePopover($scope.url).then(function(data) {
		        	
		        	if (!data) return;
		        	if (data.length) data = data[0];
		        	$scope.label = data.label;
		        	
		        	// if (data.hasOwnProperty('image')) $scope.image = data.image;
		        });
		        
			}],
			template: '<span uib-popover-template="\'views/placeTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ><span ng-transclude></span></span>'
		}});
})();