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
    .controller('PersonSentencesController', PersonSentencesController);

    /* @ngInject */
    function PersonSentencesController($log, $scope, $state, $stateParams, _, google, sentenceService, 
    		FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
        vm.test="Toimii" 
        vm.hasResults = hasResults;
        vm.removeFacetSelections = removeFacetSelections;

        sentenceService.getFacets().then(function(facets) {
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

	function organizeSentences(data) {
	    var obj;
	    var words = "";
	    var sentences = {
			data: []
		};
	    var s;
	    var prev_sentence =0;
	    //console.log(vm.lemmaCount.count);
	    for (obj in data) {
		//console.log("sentence comp",s, prev_sentence);
		//console.log("obj",obj);
		//console.log("obj value",data[obj]);
		//var class_sum = getPosTotal(obj); 
		//for (word in data[obj]) {
		prev_sentence = s;
		s=data[obj].sentence;
		if (s != prev_sentence && prev_sentence != 0) { var words_obj = {sentence: prev_sentence, words: words}; console.log("instance",words_obj); sentences['data'].push(words_obj); words =""; }
		else { words += data[obj].string  + " "; } 
		    //data[obj][word].percentage = ((data[obj][word].count/vm.lemmaCount.count)*100).toFixed(2);
		    //data[obj][word].class_percentage = ((data[obj][word].count/class_sum)*100).toFixed(2);
		//}
	    }
	    var words_obj = {sentence: prev_sentence, words: words}; 
	    console.log("instance",words_obj); 
	    sentences['data'].push(words_obj); words ="";
	    console.log("sen",sentences);
	    return sentences;
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
            var options = sentenceService.getFacetOptions();
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
            vm.isLoadingWordResults = true;
            vm.results = [];
            vm.error = undefined;
	    vm.test="Joo";

            var updateId = _.uniqueId();
            latestUpdate = updateId;
	    var id = $stateParams.personId;

            return sentenceService.getResults(facetSelections, id).then(function(results) {
                if (latestUpdate !== updateId) {
                    return;
                }
                //drawChart(results);
		console.log("loading results", results)
		vm.results = organizeSentences(results);//calculatePercentage(results);
                vm.isLoadingWordResults = false;
                vm.isLoadingResults = false;
	        vm.test="töttöröö";
		organizeSentences(results);
		//console.log("loading vm.results", vm.results.$$state.value)

            })//.then(function() {
	    /*
             return sentenceService.getLenStatistics(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
		console.log(results);
                drawChartLen(results);
                vm.isLoadingResults = false;
                });
            }).then(function() {
            return sentenceService.getResultsTop10(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsTop10 = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return sentenceService.getResultsBottom10(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsBottom10 = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return sentenceService.getResultsBottomCat(facetSelections).then(function(results) {

                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsBotCat = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return sentenceService.getResultsTopCat(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsTopCat = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return sentenceService.getWordCount(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.lemmaCount = results[0];
                    //vm.isLoadingResults = false;
		    //console.log(results[0]);
                });
            }).then(function() {
                //});
            return sentenceService.getResults(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.results = calculatePercentage(results);
                    vm.isLoadingWordResults = false;
                });
            }).catch(function(error) { return handleError(error, updateId); });*/
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
