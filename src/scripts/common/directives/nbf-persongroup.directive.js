(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPersongroup', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'nbfService', function($scope, nbfService){
		        
		        nbfService.getPopoverGroup( ($scope.url).split(',') ).then(function(data) {
		        	
		        	data.forEach(function (person, i) {
		        		person.link = '#!/'+ (person.id).replace(new RegExp('/', 'g'), '~2F');
		        		if (person.lifespan == '( - )') person.lifespan = '';
		        		person.placement = i>7 ? "top" : "bottom";
		        	});
		        	$scope.people = data;
		        	
		        });
			}],
			templateUrl: 'views/directive/nbf-persongroup.directive.html'
		}});
})();