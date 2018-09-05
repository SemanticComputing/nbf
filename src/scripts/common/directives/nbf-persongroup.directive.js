(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPersongroup', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'popoverService', function($scope, popoverService){
		        
				popoverService.getPopoverGroup( ($scope.url).split(',') ).then(function(data) {
		        	
		        	data.forEach(function (person, i) {
		        		person.link = '#!/'+ (person.id).replace(new RegExp('/', 'g'), '~2F');
		        		
		        		//	(0800-0900) -> (800-900)
		        		person.lifespan = person.lifespan.replace(/(\D)0/g, "$1");
		        		
		        		if (!(new RegExp(/\d/)).test(person.lifespan)) person.lifespan = '';
		        		
		        		person.placement = i>7 ? "top" : "bottom";
		        	});
		        	$scope.people = data;
		        	
		        });
			}],
			templateUrl: 'views/directive/nbf-persongroup.directive.html'
		}});
})();