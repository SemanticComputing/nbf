(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPersonpairs', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'popoverService', function($scope, popoverService){
		        
				$scope.people = null;
				
				popoverService.getPopoverPairs( ($scope.url).split(',') ).then(function(data) {
					
		        	data.forEach(function (person, i) {
		        		
		        		person.link = { personId: (person.id).replace(/^.+?(p[0-9_]+)$/, '$1') };
				        
		        		if (!(new RegExp(/\d/)).test(person.lifespan)) person.lifespan = '';
		        		
		        		person.placement = i>7 ? "top" : "bottom";
		        		
		        	});
		        	$scope.people = data;
		        	
		        	
		        });
			}],
			templateUrl: 'views/directive/nbf-persongroup.directive.html'
		}});
})();