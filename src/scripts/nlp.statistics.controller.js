/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('NlpStatisticsController', NlpStatisticsController);

    /* @ngInject */
    function NlpStatisticsController($log, $scope, $state, _, google, nlpService, 
    		FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
        
        vm.hasResults = hasResults;
        vm.facetParam1 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source5>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source5> . "}}';
        vm.facetParam1Ex1 =  '{"link":{"value":["\"yo1853\""],"constraint":"?id <http://ldf.fi/nbf/yo1853> [] ."}}';
        vm.facetParam1Ex2 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source5>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source5> . "}}';
        vm.facetParam1Ex3 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source5>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source5> . "}}';
        vm.facetParam2 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source4>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source4> . "}}';
        vm.facetParam2Ex1 = '{"link":{"value":["\"norssit\""],"constraint":"?id <http://ldf.fi/nbf/norssi> [] ."}}';
        vm.facetParam2Ex2 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source5>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source5> . "}}';
        vm.facetParam2Ex3 = '{"dataset":{"value":"<http://ldf.fi/nbf/sources/source5>","constraint":" ?id <http://purl.org/dc/terms/source> <http://ldf.fi/nbf/sources/source5> . "}}';
        vm.upos = nlpService.upos;
        vm.removeFacetSelections = removeFacetSelections;

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

        function removeFacetSelections() {
            $state.reload();
        }

        function hasResults() {
            return _.keys(vm.results).length > 0;
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

	// Biografioiden pituus vuosikymmenittäin
        function drawChartLen(results) {
            google.charts.setOnLoadCallback(function () {
                var data = new google.visualization.DataTable();
                var ticks = _.map(results, function(res) { return parseInt(res.year); });
                var rows = _.map(results, function(res) { return [res.year, parseInt(res.count)]; });
                var options = {
                    title: 'SKS:n Biografioiden keskimääräinen sanamääräjakauma vuosikymmenittäin',
                    legend: { position: 'none' },

                    tooltip: {format: 'none'},
                    colors: ['blue'],

                    hAxis: {
                        slantedText: false,
                        maxAlternation: 1,
                        format: '',
                        ticks: ticks
                    },
                    vAxis: {
                        maxValue: 4
                    },
                    width: '95%',
                    bar: {
                        groupWidth: '88%'
                    },
                    height: 500
                };

                var chart = new google.visualization.ColumnChart(document.getElementById('biography-len-chart'));

                data.addColumn('string', 'Vuosikymmen');
                data.addColumn('number', 'Biografioiden keskimääräinen sanamäärä');

                data.addRows(rows);
                chart.draw(data, options);
            });
        }


	// Biografiat vuosikymmenittäin
        function drawChart(results) {
            google.charts.setOnLoadCallback(function () {
                var data = new google.visualization.DataTable();
                var ticks = _.map(results, function(res) { return parseInt(res.year); });
                var rows = _.map(results, function(res) { return [res.year, parseInt(res.count)]; });
                var options = {
                    title: 'SKS:n Biografiajakauma vuosikymmenittäin',
                    legend: { position: 'none' },

                    tooltip: {format: 'none'},
                    colors: ['blue'],

                    hAxis: {
                        slantedText: false,
                        maxAlternation: 1,
                        format: '',
                        ticks: ticks
                    },
                    vAxis: {
                        maxValue: 4
                    },
                    width: '95%',
                    bar: {
                        groupWidth: '88%'
                    },
                    height: 500
                };

                var chart = new google.visualization.ColumnChart(document.getElementById('biography-chart'));

                data.addColumn('string', 'Vuosikymmen');
                data.addColumn('number', 'Biografioita');

                data.addRows(rows);
                chart.draw(data, options);
            });
        }

        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.results = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return nlpService.getStatistics(facetSelections).then(function(results) {
                if (latestUpdate !== updateId) {
                    return;
                }
                drawChart(results);
            }).then(function() {

             return nlpService.getLenStatistics(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
		console.log(results);
                drawChartLen(results);
                });
            }).then(function() {
            return nlpService.getResultsTop10(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsTop10 = results;
                    vm.isLoadingResults = false;
                });
            }).then(function() {
            return nlpService.getResultsBottom10(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsBottom10 = results;
                    vm.isLoadingResults = false;
                });
            }).then(function() {
            return nlpService.getResultsBottomCat(facetSelections).then(function(results) {

                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsBotCat = results;
                    vm.isLoadingResults = false;
                });
            }).then(function() {
            return nlpService.getResultsTopCat(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsTopCat = results;
                    vm.isLoadingResults = false;
                });
            }).then(function() {
            return nlpService.getWordCount(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.lemmaCount = results[0];
                    vm.isLoadingResults = false;
		    console.log(results[0]);
                });
            }).then(function() {
                //});
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
