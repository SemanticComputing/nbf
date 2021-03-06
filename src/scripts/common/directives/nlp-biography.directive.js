(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nlpBiography', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@', active: '@', alive:'@', skspage:'@' },
			 
			controller: ['$scope', 'biographyService', function($scope, biographyService){
				
				$scope.loadBio = function () {
					if ($scope.active!='false') {
						biographyService.getNlpBio( $scope ).then(function(data) {
							$scope.data = data;
							let patt = /\d+/i;
							let result = parseInt(($scope.url).match(patt));
							$scope.number = result;
						});
					};
					
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