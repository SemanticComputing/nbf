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
    .controller('PersonLinguisticsController', PersonLinguisticsController);

    /* @ngInject */
    function PersonLinguisticsController($log, $scope, $state, $stateParams, $sce, _, google, linguisticsService, 
    		FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
        vm.test="Toimii" 
        vm.hasResults = hasResults;
        vm.removeFacetSelections = removeFacetSelections;
        vm.upos = linguisticsService.upos;

        linguisticsService.getFacets().then(function(facets) {
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


	function replacer(match, p1, p2, p3, offset, string) {
            // p1 is nondigits, p2 digits, and p3 non-alphanumerics
	    // console.log(p1, "-", p2, "-", p3);
            return [p1, p2].join('-');
        }



	function calculatePercentage(data) {
            var obj;
            var word;
            // console.log("lemmas",vm.lemmaCount.count);
            for (obj in data) {
                // console.log(obj)
                // console.log(data[obj])
                var class_sum = getPosTotal(obj);
            	// console.log("lemma in class",class_sum);
                for (word in data[obj]) {
		    var lemma = data[obj][word].lemma;
                    // console.log("lemma:", lemma);
                    if(lemma.match(/^\d/) && lemma.match(/[a-zäöåA-ZÄÖÅ]$/)) {
                        // console.log("check",lemma.replace(/([0-9]+)([a-zäöåA-ZÄÖÅ]+)/), replacer);
                        data[obj][word].lemma = lemma.replace(/([0-9]+)([a-zäöåA-ZÄÖÅ]+)/, replacer);
                    }

                    // console.log(data[obj][word].count);
                    data[obj][word].percentage = ((data[obj][word].count/vm.lemmaCount.count)*100).toFixed(2);
                    data[obj][word].class_percentage = ((data[obj][word].count/class_sum)*100).toFixed(2);
                }
            }
            // console.log(data);
            return data;
        }


	function organizeSentences(data) {
	    var obj;
	    var words = "";
	    var sentences = {
			data: []
		};
	    var s;
	    var prev_sentence =0;
	    for (obj in data) {
		prev_sentence = s;
		s=data[obj].sentence;
		if (s != prev_sentence && prev_sentence != 0 && words.length > 0) { var words_obj = {sentence: prev_sentence, words: $sce.trustAsHtml(words.replace(target_string,'<b>'+target_string+'</b>'))}; sentences['data'].push(words_obj); words = data[obj].string.trim();}
		else { 
		    var str = "";
		    if (data[obj].upos != "PUNCT") {
			str= " "+data[obj].string.trim()
		    } else { 
			
			str=data[obj].string.trim();
		    }
		    words += str; 
		} 
		var target_string = data[obj].target_string.trim()
	    }
	    var words_obj = {sentence: prev_sentence, words: $sce.trustAsHtml(words.replace(target_string,'<b>'+target_string+'</b>'))}; 
	    sentences['data'].push(words_obj); words ="";
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
		// console.log("Unidentifiable pos-tag", postag);
		return vm.lemmaCount.count;
	    }
	    
	}

        function getFacetOptions() {
            var options = linguisticsService.getFacetOptions();
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

            return linguisticsService.getResults(facetSelections, id).then(function(results) {
                if (latestUpdate !== updateId) {
                    return;
                }
                //drawChart(results);
		vm.sentenceResults = organizeSentences(results);//calculatePercentage(results);
                vm.isLoadingResults = false;

            }).then(function() {
            return linguisticsService.getWordCount(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.lemmaCount = results[0];
                    //vm.isLoadingResults = false;
		    //console.log(results[0]);
                });
            }).then(function() {
                //});
            return linguisticsService.getWordUsageResults(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.results = calculatePercentage(results);
                    vm.isLoadingWordResults = false;
                });
            }).then(function() {
             return linguisticsService.getPersonName(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
		console.log(results);
		vm.label=results[0].label;
                vm.isLoadingResults = false;
                });
            });/*.then(function() {
            return linguisticsService.getResultsTop10(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsTop10 = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return linguisticsService.getResultsBottom10(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsBottom10 = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return linguisticsService.getResultsBottomCat(facetSelections).then(function(results) {

                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsBotCat = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return linguisticsService.getResultsTopCat(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.resultsTopCat = results;
                    //vm.isLoadingResults = false;
                });
            }).then(function() {
            return linguisticsService.getWordCount(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.lemmaCount = results[0];
                    //vm.isLoadingResults = false;
		    //console.log(results[0]);
                });
            }).then(function() {
                //});
            return linguisticsService.getResults(facetSelections).then(function(results) {
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
