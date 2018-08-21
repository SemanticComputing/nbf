(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPersongroup', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'nbfService', function($scope, nbfService){
		        
		        nbfService.getPopoverGroup( ($scope.url).split(',') ).then(function(data) {
		        	
		        	data.forEach(function (ob) {
		        		ob.link = '#!/'+ (ob.id).replace(new RegExp('/', 'g'), '~2F');
		        		if (ob.lifespan == '( - )') ob.lifespan = '';
		        	});
		        	$scope.people = data;
		        	
		        });
			}],
			templateUrl: 'views/directive/nbf-persongroup.directive.html'
		}});
})();