(function() {
    'use strict';
	angular.module('facetApp')
	.directive('personlink', function() {
		return {
			restrict: 	'EC',
			scope: 		{ url: '@' },
			transclude: true,
			controller: ['$scope', 'popoverService', function($scope, popoverService){
		        if (!$scope.url) return;
		        
		        $scope.personId = { personId: ($scope.url).replace(/^.+?(p[0-9]+)$/, '$1') };
		        $scope.image = false;
		        $scope.lifespan = '';
		        
		        popoverService.getPopover($scope.url).then(function(data) {
		        	if (data.length) data = data[0];
		        	
		        	$scope.label = data.label; 
		        	$scope.color = data.hasbio ? "#337ab7" : "#222";
		        	
		        	//	check if lifespan contains any numbers
		        	if ((new RegExp(/\d/)).test(data.lifespan)) {
		        		// remove leading zeros (0800-0900) -> (800-900)
		        		data.lifespan = data.lifespan.replace(/(\D)0/g, "$1");
		        		
		        		$scope.lifespan = data.lifespan;
		        	}
		        	
		        	if (data.hasOwnProperty('image')) $scope.image = data.image;
		        });
		        
			}],
			template: '<a uib-popover-template="\'views/tooltips/personTooltipTemplate.html\'" class="notranslate" popover-trigger="\'mouseenter\'" ui-sref="person.detail({{ personId }})"><span ng-transclude style="color:{{ color }};"></span></a>'
		}});
})();
