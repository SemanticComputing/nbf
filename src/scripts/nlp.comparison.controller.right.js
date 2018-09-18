// created with script createRightPageController.sh as a copy of file ../scripts/nlp.comparison.controller.js
(function() {

    'use strict';

    angular.module('facetApp')

    .controller('NlpComparisonControllerRight', NlpComparisonControllerRight);

    /* @ngInject */
    function NlpComparisonControllerRight($log, $scope, $state, _, nlpService, 
    		FacetHandler, facetUrlStateHandlerService2) {

        var vm = this;

	vm.facetParam1="höpö";
	vm.facetParam2Ex1="pöpö";
	vm.facetParam2="pöpö";
	vm.facetParam2Ex1="pöpö";
        vm.hasResults = hasResults;
        vm.removeFacetSelections = removeFacetSelections;
        vm.upos = nlpService.upos;

        nlpService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        function hasResults() {
            return _.keys(vm.results).length > 0;
        }

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

	function calculatePercentage(data) {
            var obj;
            var word;
            console.log(vm.lemmaCount.count);
            for (obj in data) {
                console.log(obj)
                console.log(data[obj])
                var class_sum = getPosTotal(obj);
                for (word in data[obj]) {
                    console.log(data[obj][word].count);
                    data[obj][word].percentage = ((data[obj][word].count/vm.lemmaCount.count)*100).toFixed(2);
                    data[obj][word].class_percentage = ((data[obj][word].count/class_sum)*100).toFixed(2);
                }
            }
            console.log(data);
            return data;
        }

	function getPosTotal(postag){
            if (postag == "VERB") {
                return vm.lemmaCount.verbCount;
            } else if (postag == "ADJ") {
                return vm.lemmaCount.adjCount;
            } else if (postag == "NOUN") {
                return vm.lemmaCount.nounCount;
            } else if (postag == "PROPN") {
                return vm.lemmaCount.pnounCount;
            } else {
                console.log("Unidentifiable pos-tag", postag);
                return vm.lemmaCount.count;
            }

        }

	function getFacetOptions() {
        var options = nlpService.getFacetOptions();
        options.initialState = facetUrlStateHandlerService2.getFacetValuesFromUrlParams();
        return options;
    }

    function updateResults(event, facetSelections) {
        if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
            return;
        }
        vm.previousSelections = _.clone(facetSelections.constraint);
        facetUrlStateHandlerService2.updateUrlParams(facetSelections);
        return fetchResults(facetSelections);
    }
    
        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.results = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return nlpService.getWordCount(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.lemmaCount = results[0];
                    vm.isLoadingResults = false;
                    console.log(results[0]);
            }).then(function() {
                return nlpService.getResults(facetSelections).then(function(results) {
                if (latestUpdate !== updateId) {
                    return;
                }
                vm.results = calculatePercentage(results);
                vm.isLoadingResults = false;
                });
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