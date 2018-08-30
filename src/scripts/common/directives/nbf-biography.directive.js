(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfBiography', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@' },
			controller: ['$scope', 'biographyService', function($scope, biographyService){
				
					biographyService.getBio( $scope.url ).then(function(bio) {
						// console.log('biography loaded', $scope.url);
						$scope.bio = bio;
			        });
		        
			}],
			templateUrl: 'views/directive/nbf-biography.directive.html'
		}});
})();