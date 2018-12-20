(function() {
    'use strict';
	angular.module('facetApp')
	.directive('organizationlink', function() {
		
		return {
			restrict: 	'EC',
			scope: 		{ url: '@' },
			transclude: true,
			controller: ['$scope', function($scope){
				
				$scope.link = $scope.url;
	        	$scope.label = 'YSO-tietokannan organisaatio';
	        	
			}],
			
			template: '<a ng-href="{{ link }}" uib-popover-template="\'views/tooltips/organizationTooltipTemplate.html\'" popover-trigger="\'mouseenter\'"><small><span class="glyphicon glyphicon-briefcase"></span></small>&nbsp;<span ng-transclude></span></a>'
			
		};
	}
	);
})();
