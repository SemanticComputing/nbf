(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nlpBiography', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@', active: '@' },
			
			controller: ['$scope', 'biographyService', function($scope, biographyService){
				
				$scope.loadBio = function () {
					if ($scope.active!='false') {
						biographyService.getNlpBio( $scope.url ).then(function(data) {
							$scope.data = data;
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
			    
			templateUrl: 'views/directive/nlp-biography.directive.html'
		}});
})();