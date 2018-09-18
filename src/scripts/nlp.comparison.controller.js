(function() {

    'use strict';

    angular.module('facetApp')

    .controller('NlpComparisonController', NlpComparisonController);

    /* @ngInject */
    function NlpComparisonController($log, $scope, $state, _, nlpService, 
    		FacetHandler, facetUrlStateHandlerService) {

        var vm = this;

        vm.hasResults = hasResults;

	// Setup parameters for example queries to be rendered to json later. Make sure json is valid: https://jsonlint.com/
        vm.facetParam1 ='{"dataset":{"value":"<http://ldf.fi/nbf/sources/source5>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source5> . "}}';
	vm.facetParam1Ex1 = '{"link":{"value":["yo1853"],"constraint":"?id <http://ldf.fi/nbf/yo1853> [] ."}}';
	vm.facetParam1Ex2 = '{"slider":{"value":{"min":200,"max":2020},"constraint":"?id <http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart> ?slider_89 . FILTER (200<=year(?slider_89) && year(?slider_89)<=2020) "},"category":{"value":"kirjallisuus@fi","constraint":" ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_category>/<http://www.w3.org/2004/02/skos/core#prefLabel> \"kirjallisuus\"@fi . "}}';
        vm.facetParam1Ex3 = '{"slider":{"value":{"min":1800,"max":1900},"constraint":"?id <http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart> ?slider_89 . FILTER (1800<=year(?slider_89) && year(?slider_89)<=1900) "},"gender":{"value":"\"nainen\"@fi","constraint":" ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/sukupuoli> \"nainen\"@fi . "}}';
        vm.facetParam1Ex4 = '{"place":{"value":"<http://ldf.fi/nbf/places/Ruotsi>","constraint":" ?seco_v_place (<http://www.w3.org/2004/02/skos/core#broader>)* <http://ldf.fi/nbf/places/Ruotsi> .  ?id <http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>)/<http://ldf.fi/nbf/place> ?seco_v_place . "}}';
        vm.facetParam2 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source4>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source4> . "}}';
        vm.facetParam2Ex1 = '{"link":{"value":["norssit"],"constraint":"?id <http://ldf.fi/nbf/norssi> [] ."}}';
        vm.facetParam2Ex2 = {"slider":{"value":{"min":200,"max":2020},"constraint":"?id <http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart> ?slider_76 . FILTER (200<=year(?slider_76) && year(?slider_76)<=2020) "},"category":{"value":"kuvataiteet, valokuvaus@fi","constraint":" ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_category>/<http://www.w3.org/2004/02/skos/core#prefLabel> \"kuvataiteet, valokuvaus\"@fi . "}};
        vm.facetParam2Ex3 = '{"slider":{"value":{"min":1800,"max":1900},"constraint":"?id <http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart> ?slider_89 . FILTER (1800<=year(?slider_89) && year(?slider_89)<=1900) "},"gender":{"value":"\"nainen\"@fi","constraint":" ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/sukupuoli> \"nainen\"@fi . "}}';
        vm.facetParam2Ex4 = '{"place":{"value":"<http://ldf.fi/nbf/places/Ven%C3%A4j%C3%A4>","constraint":" ?seco_v_place (<http://www.w3.org/2004/02/skos/core#broader>)* <http://ldf.fi/nbf/places/Ven%C3%A4j%C3%A4> .  ?id <http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>)/<http://ldf.fi/nbf/place> ?seco_v_place . "}}';

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
        options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
        return options;
    }

    function updateResults(event, facetSelections) {
        if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
            return;
        }
        vm.previousSelections = _.clone(facetSelections.constraint);
        facetUrlStateHandlerService.updateUrlParams(facetSelections);
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
