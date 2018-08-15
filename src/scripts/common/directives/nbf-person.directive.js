(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPerson', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'nbfService', function($scope, nbfService){
		        
		        $scope.link = '#!/'+ ($scope.url).replace(new RegExp('/', 'g'), '~2F');
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        nbfService.getPopover($scope.url).then(function(data) {
		        	if (data.length) data = data[0];
		        	
		        	$scope.label = data.label;
		        	if (data.lifespan != '( - )') $scope.lifespan = data.lifespan;
		        	
		        	if (data.hasOwnProperty('image')) $scope.image = data.image;
		        	
		        });
			}],
			template: '<a uib-popover-template="\'views/personTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ng-href="{{ link }}">{{ label }}</a>'
		}});
})();