(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfBiography', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@', active: '@' },
			
			controller: ['$scope', 'biographyService', function($scope, biographyService){
				
				$scope.loadBio = function () {
					if ($scope.active!='false') {
						biographyService.getBio( $scope.url ).then(function(bio) {
							$scope.bio = bio;
				        });
					}; // else { console.log('not loaded'); };
				};
			}],
			
			link: function($scope, element, attrs, controllers) {
				$scope.$watch('active', function(newValue, old) {
	                if (newValue)
	                	$scope.loadBio();
	                }, true);
			    },
			    
			templateUrl: 'views/directive/nbf-biography.directive.html'
		}});
})();