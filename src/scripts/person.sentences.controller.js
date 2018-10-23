/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    angular.module('facetApp')

    /**/
    /*myapp.directive('sentenceList', function() {
    	var directive = {};

    	directive.restrict = 'E';

    	directive.template = '<div ng-repeat="sentences in vm.sentenceResults"><li ng-repeat="sentence in sentences" ng-bind-html="sentence.words">{{ sentence.words }}</li></div>';

    	directive.scope = {
            user : "=user"
    	}

    	return directive;
    });*/

    /*
    * Controller for the results view.
    */
    .controller('PersonSentencesController', PersonSentencesController);

    /* @ngInject */
    function PersonSentencesController($log, $scope, $state, $stateParams, $sce, _, google, sentenceService, 
    		FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
        vm.test="Toimii" 
        vm.hasResults = hasResults;
        vm.removeFacetSelections = removeFacetSelections;
        vm.upos = sentenceService.upos;

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

	function calculatePercentage(data) {
            var obj;
            var word;
            for (obj in data) {
                var class_sum = getPosTotal(obj);
                for (word in data[obj]) {
                    data[obj][word].percentage = ((data[obj][word].count/vm.lemmaCount.count)*100).toFixed(4);
                    data[obj][word].class_percentage = ((data[obj][word].count/class_sum)*100).toFixed(4);
                }
            }
            return data;
        }

	function trim_string(data, obj){
	    var str;
	    if (data[obj].upos != "PUNCT") {
		var next = parseInt(obj) + 1;
            	if(obj == 0){
                    str= data[obj].string.trim()
               	} else if (obj == data.length-1){
                    str= " "+data[obj].string.trim()
               	} else if (data[obj-1].string.contains("(")){
                    if (data[obj].upos=="NUM" && data[obj].string.length == 4 && data[next].upos=="NUM" && data[next].string.length == 4){
	            	str=data[obj].string.trim()+" -"
		    } else {
                        str=data[obj].string.trim()
		    }
		}else if (data[obj].upos=="NUM" && data[obj].string.length == 4 && data[next].upos=="NUM" && data[next].string.length == 4){
	            	str=data[obj].string.trim()+" -"
                }else {
                    str= " "+data[obj].string.trim()
                }
            } else if (data[obj].string.contains("(")) {
                str= " "+data[obj].string.trim();
            } else {
                str=data[obj].string.trim();
            }

	    return str;
	}

	function organizeReferences(data) {
	    var obj;
	    var words = "";
	    var sentences = {
			data: []
		};
	    var targets = {
		data: []
	    };
	    var s;
	    var wordId;
	    var prev_sentence =0;
	    var prev_wordId =0;
	    if (data.length > 0) {
	    for (obj in data) {
		console.log(s, prev_sentence)
		prev_sentence = s;
		prev_wordId = wordId;
		s=data[obj].sentence;
		wordId=data[obj].word;
		if (s != prev_sentence && prev_sentence != 0 && words.length > 0) { 
		    var words_obj = { 
			sentence: prev_sentence, 
			words: $sce.trustAsHtml(render_targets(words, targets['data'])) 
		    };
		    console.log("Translate,", data[obj].label); 
                    sentences['data'].push(words_obj); 
		    words = '<span class="personlink notranslate" url="'+data[obj].person+'">'+data[obj].label+'</span>: ' + data[obj].string.trim();
		    targets = {
                	data: []
            	    };  
		}
		else {
		    var str = trim_string(data, obj);
		    if (obj == 0){
			console.log("first",data[0])
        	        words = '<span class="personlink notranslate" url="'+data[0].person+'">'+data[0].label+'</span>: ';
                    }
		    if(wordId != prev_wordId){
		    	words += str; 
		    } 

		} 
		var target_string = data[obj].target_string.trim();
		var target_link = data[obj].personUri.trim();
		var target_elem = {target_string: target_string, target_link: target_link};
		if (find_item(targets['data'], target_string, target_link) == false ) { 
		    targets['data'].push({target_string: target_string, target_link: target_link});
		}
	    }
	    var words_obj = { 
		sentence: prev_sentence, 
		words: $sce.trustAsHtml(render_targets(words, targets['data']))
	    }; 
	    sentences['data'].push(words_obj); 
	    words ="";
	    }
	    return sentences;
	}

	function find_item(vendors, target_string, target_link){
	var found = false;
	for(var i = 0; i < vendors.length; i++) {
	    if (vendors[i].target_string === target_string && vendors[i].target_link === target_link) {
	        found = true;
	        return true;
	    }
	}
	return false;
	}

	function render_targets(words, targets) {
	    var obj;
	    //console.log(targets);
	    for (obj in targets) {
		var target = targets[obj];
		words = words.replace(target.target_string, '<span class="personlink notranslate" url="'+target.target_link+'">'+target.target_string+'</span>')
	    }
	    return words;
	}

	function organizeSentences(data) {
	    var obj;
	    var words = ""; // = '<span class="personlink" url="'+data[0].personUri+'">'+data[0].label+'</span>: ';
	    var sentences = {
			data: []
		};
	    var s;
	    var prev_sentence =0;
	    if (data.length > 0) {
	    for (obj in data) {
		prev_sentence = s;
		s=data[obj].sentence;
		if (s != prev_sentence && prev_sentence != 0 && words.length > 0) { var words_obj = {sentence: prev_sentence, words: $sce.trustAsHtml(words.replace(target_string,'<b class="notranslate">'+target_string+'</b>'))}; sentences['data'].push(words_obj); words = '<span class="personlink notranslate" url="'+data[obj].personUri+'">'+data[obj].label+'</span>: ' + data[obj].string.trim();}
		else { 
		    var str = trim_string(data, obj);
		    /*if (data[obj].upos != "PUNCT") {
			str= " "+data[obj].string.trim()
		    } else { 
			
			str=data[obj].string.trim();
		    }*/

		    if (obj == 0){
        	        words = '<span class="personlink notranslate" url="'+data[0].personUri+'">'+data[0].label+'</span>: ';
                    }
	
		    words += str; 
		} 
		var target_string = data[obj].target_string.trim()
	    }
	    var words_obj = {sentence: prev_sentence, words: $sce.trustAsHtml(words.replace(target_string,'<b class="notranslate">'+target_string+'</b>'))}; 
	    sentences['data'].push(words_obj); 
	    words ="";
	    }
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
                    title: 'Viitatut henkilöt syntymävuoden mukaan vuosikymmenittäin',
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

                var chart = new google.visualization.ColumnChart(document.getElementById('referencing-time'));

                data.addColumn('string', 'Vuosikymmen');
                data.addColumn('number', 'Henkilöiden lukumäärä');

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
                    title: 'Henkilöön tehdyt viittaukset muista biografioista vuosikymmenittäin (syntymävuoden perusteella)',
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

                var chart = new google.visualization.ColumnChart(document.getElementById('referenced-time'));

                data.addColumn('string', 'Vuosikymmen');
                data.addColumn('number', 'Henkilöiden lukumäärä');

                data.addRows(rows);
                chart.draw(data, options);
            });
        }



        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingSentences = true;
            vm.isLoadingReferences = true;
            vm.isLoadingChart = true;
            vm.results = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;
	    var id = $stateParams.personId;

            return sentenceService.getResults(facetSelections, id).then(function(results) {
                if (latestUpdate !== updateId) {
                    return;
                }
                //drawChart(results);
		vm.sentenceResults = organizeSentences(results);//calculatePercentage(results);
                vm.isLoadingSentences = false;

            }).then(function() {
                //});
            return sentenceService.getReferences(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
		    vm.referenceResults = organizeReferences(results);//calculatePercentage(results);
                    vm.isLoadingReferences = false;
                });
            }).then(function() {
             return sentenceService.getPersonName(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                vm.label=results[0].label;
                vm.isLoadingResults = false;
                });
            }).then(function() {
             return sentenceService.getReferencesByDecade(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                if (results.length == 1) {
                        if(results[0].count != 0) {
                            drawChart(results);
                        }
                    } else {
                        drawChart(results);
                    }

		vm.isLoadingChart = false;
                });
            }).then(function() {
            return sentenceService.getReferencingByDecade(facetSelections, id).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
		    if (results.length == 1) {
			if(results[0].count != 0) {
			    drawChartLen(results);
			}
		    } else {
                    	drawChartLen(results);
		    }
                    vm.isLoadingChart = false;
                });
            });/*.then(function() {
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
