(function() {
    'use strict';
	angular.module('facetApp')
	.directive('nbfPersonlist', function() {
		return {
			restrict: 	'AE',
			scope: 		{ url: '@', numPerPage: '@' },
			controller: ['$scope', 'popoverService', function($scope, popoverService){
		        
				$scope.data = null;
				
				if (!$scope.numPerPage) $scope.numPerPage = 16;
				
				popoverService.getPopoverGroup( ($scope.url).split(',') ).then(function(data) {
		        	
		        	data.forEach(function (person, i) {
		        		person.link = '#!/'+ (person.id).replace(/^.+?(p[0-9]+)$/, '$1');
				        
		        		//	(0800-0900) -> (800-900)
		        		person.lifespan = person.lifespan.replace(/(\D)0/g, "$1");
		        		
		        		if (!(new RegExp(/\d/)).test(person.lifespan)) person.lifespan = '';
		        		
		        		person.placement = i>7 ? "top" : "bottom";
		        	});
		        	
		        	$scope.data = data;
		        	$scope.currentPage = 1;
        			$scope.maxSize = 5;
        			$scope.show = data.length>$scope.numPerPage;
        			
        			if ($scope.show) {
			        	$scope.$watch('currentPage + numPerPage', function() {
		                    var begin = (($scope.currentPage - 1) * $scope.numPerPage)
		                    , end = begin + $scope.numPerPage;
		                    $scope.filteredData = $scope.data.slice(begin, end);
		                });
		            } else $scope.filteredData = $scope.data;
		        });
			}],
			templateUrl: 'views/directive/nbf-personlist.directive.html'
		}});
})();