(function() {
    'use strict';
	angular.module('facetApp')
	.directive('placelink', function() {
		
		return {
			restrict: 	'EC',
			scope: 		{ url: '@' },
			transclude: true, 
			controller: ['$scope', 'popoverService', function($scope, popoverService){
				
		        var res = $scope.url.match(/yso.fi.+?Y([^/]+)$/);
		        if (res && res.length) {
		        	
		        	// http://www.yso.fi/onto/yso/Y94351
		        	// https://finto.fi/yso-paikat/fi/page/p94351
		        	$scope.link = 'https://finto.fi/yso-paikat/fi/page/p' + res[1];
		        	$scope.label = 'YSO-tietokannan paikka';
		        	$scope.url = $scope.url;
		        	
		        	$scope.isYso = true;
		        	
		        } else {
		        	$scope.url = ($scope.url).replace(/^.+?([^/]+)$/, '$1');
		        	$scope.placeid = { placeId: $scope.url };
		        	$scope.link = '../../paikat/'+$scope.url;
		        	
		        	$scope.isYso = false;
		        	
		        }
		        
		        $scope.image = false; // 'https://maps.googleapis.com/maps/api/staticmap?center=Pohja,Finland&zoom=5&size=400x300'
			//$scope.image = "https://maps.googleapis.com/maps/api/staticmap?center="+data.label+"&zoom=13&size=400x300&maptype=roadmap&markers=color:blue%7Clabel:S%7C40.702147,-74.015794&markers=color:green%7Clabel:G%7C40.711614,-74.012318&markers=color:red%7Clabel:C%7C40.718217,-73.998284&key=AIzaSyCCpdk_ltTRwAtWkieAUL6DBx-iZkAfJ1A"; 
	        	$scope.lifespan = '';
	        	
		        popoverService.getPlacePopover($scope.url).then(function(data) {
		        	
		        	if (!data) return;
		        	if (data.length) data = data[0];
		        	$scope.label = data.label;
		        	
		        });
		        
			}],
			
			template: '<a ng-if="!isYso" uib-popover-template="\'views/tooltips/placeTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ui-sref="place({{ placeid }})"><small><span class="glyphicon glyphicon-globe"></span></small>&nbsp;<span ng-transclude></span></a>'+
			'<a ng-if="isYso" uib-popover-template="\'views/tooltips/placeTooltipTemplate.html\'" popover-trigger="\'mouseenter\'" ng-href="{{ link }}"><small><span class="glyphicon glyphicon-globe"></span></small>&nbsp;<span ng-transclude></span></a>'
			
		};
	}
	);
})();
