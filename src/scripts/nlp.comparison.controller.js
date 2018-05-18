(function() {

    'use strict';

    angular.module('facetApp')

    .controller('NlpComparisonController', NlpComparisonController);

    /* @ngInject */
    function NlpComparisonController($log, $scope, $state, _, nlpService, FacetHandler) {

        var vm = this;

        vm.removeFacetSelections = removeFacetSelections;
        vm.upos = nlpService.upos;

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        nlpService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = nlpService.getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            return fetchResults(facetSelections);
        }


        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.results = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return nlpService.getResults(facetSelections).then(function(results) {
                if (latestUpdate !== updateId) {
                    return;
                }
                vm.results = results;
                vm.isLoadingResults = false;
            }).catch(function(error) { return handleError(error, updateId); });
        }

        function handleError(error, updateId) {
            if (updateId === latestUpdate) {
                vm.isLoadingResults = false;
                vm.error = error;
                $log.error(error);
            }
        }
    }
})();
