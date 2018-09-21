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
		        
		        var res = $scope.url.match(/yso.fi.+?Y([^/]+)$/);
		        if (res && res.length) {
		        	// http://www.yso.fi/onto/yso/Y94351
		        	// https://finto.fi/yso-paikat/fi/page/p94351
		        	$scope.link = 'https://finto.fi/yso-paikat/fi/page/p' + res[1];
		        	$scope.label = 'YSO-tietokannan paikka';
		        	return;
		        }
		        
		        $scope.url = ($scope.url).replace(/^.+?([^/]+)$/, '$1');
		        $scope.placeid = { placeId: $scope.url };
		        
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        popoverService.getPlacePopover($scope.url).then(function(data) {
		        	
		        	if (!data) return;
		        	if (data.length) data = data[0];
		        	$scope.label = data.label;
		        	
		        });
		        
			}],
			template: '<a uib-popover-template="\'views/placeTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ui-sref="place({{ placeid }})"><span ng-transclude></span></a>'
			
			// template: '<a uib-popover-template="\'views/placeTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ng-href="{{ link }}"><span ng-transclude></span></a>'
		}});
})();