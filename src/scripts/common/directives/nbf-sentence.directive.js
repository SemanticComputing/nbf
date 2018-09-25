function() {
    angular.module('facetApp')
    /**/
    .directive('sentenceList', function() {

	return {
                        restrict:       'AE',
                        scope:          { url: '@', active: '@' },

                        controller: ['$scope', '$sce', function($scope, $sce){
				console.log("testing this");
                                $scope.loadBio = function () {
                                        if ($scope.active!='false') {
                                                $scope.src = $sce.trustAsResourceUrl($scope.url);
                                                // console.log('content loaded',$scope.url);
                                        }; // else { console.log('not loaded'); };
                                };
                        }],

                        link: function($scope, element, attrs, controllers) {
                                $scope.$watch('active', function(newValue, old) {
                                        // console.log('iframe.watch');
                        $scope.loadBio();
                        }, true);
                            },

                        templateUrl: 'views/directive/nbf-sentence-list.directive.html'
        }});
}
