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
    .controller('VisuController', VisuController);

    /* @ngInject */
    function VisuController($log, $scope, $state, _, google, visuService, FacetHandler, facetUrlStateHandlerService, $uibModal) {

        var vm = this;
        
        vm.people = [];
        vm.data = {};

        // assign random ids to chart div so we can use same controller on comparison page
        vm.chart_ids = [0,1,2,3,4,5].map(function(i) {
        	return(''+i+Math.random());
        });
        // vm.chart_ids = ['chart_age', 'chart_marriageAge', 'chart_firstChildAge', 'chart_numberOfChildren', 'chart_numberOfSpouses'];
        
        vm.showForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            });
        };

        vm.removeFacetSelections = removeFacetSelections;

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);
        
        visuService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = visuService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }


        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                vm.previousSelections)) {
                return;
            }
            
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);

            return fetchResults(facetSelections).then(function (res) {
            	google.charts.setOnLoadCallback(function () {
                    drawYearChart(res[0], null, 'Henkilöjakauma vuosikymmenittäin', vm.chart_ids[0])
                });
                google.charts.setOnLoadCallback(function () {
                    drawAgeChart(res[1], [0,120], 'Elinikä', vm.chart_ids[1], ' vuotta')
                });
                google.charts.setOnLoadCallback(function () {
                    drawAgeChart(res[2], [0,120], 'Naimisiinmenoikä', vm.chart_ids[2], ' vuotta')
                });
                google.charts.setOnLoadCallback(function () {
                    drawAgeChart(res[3], [0,120], 'Lapsensaanti-ikä', vm.chart_ids[3], ' vuotta')
                });
                google.charts.setOnLoadCallback(function () {
                    drawAgeChart(res[4], [0,25], 'Lasten lukumäärä', vm.chart_ids[4], '')
                });
                google.charts.setOnLoadCallback(function () {
                    drawAgeChart(res[5], [0,10], 'Puolisoiden lukumäärä', vm.chart_ids[5], '')
                });

                return;
            });
        }

        function drawYearChart(res, range, label, target) {
           
        	// var ticks = res.map(function(ob) { return 1+parseInt(ob.value); });
            var rows = res.map(function(ob) { return [ob.value, parseInt(ob.count)]; }),
            	total = res.map(function(ob) { return parseInt(ob.count); }).reduce((a, b) => a + b, 0);
            
            vm.data[target] = res.map(function(ob) {return ob.persons});
            
            var 
                data = new google.visualization.DataTable(),
                options = {
                    title: label+', yhteensä ' +total+ ' henkilöä' ,
                    legend: { position: 'none' },

                    tooltip: {format: 'none'},
                    colors: ['blue'],

                    hAxis: {
                        slantedText:false,
                        maxAlternation: 1,
                        format: '' // , ticks: ticks
                    },
                    vAxis: {
                    	maxValue: 4
                    },
                    width: '95%',
                    bar: {
                        groupWidth: '88%'
                    },
                    height:500
                },
                
                chart = new google.visualization.ColumnChart(document.getElementById(target));
            
            
            data.addColumn('string', 'Vuosikymmen');
            data.addColumn('number', 'Henkilöä');

            data.addRows(rows);
            chart.draw(data, options);
            
            
            google.visualization.events.addListener(chart, 'select', function() {
                var sel = chart.getSelection(),
                	dec = sel[0].row,
                	year1 = parseInt(rows[dec][0]),
                	year2 = year1 + 9;
                vm.people = vm.data[target][dec];
                vm.popuptitle = 'Vuodet '+year1+ '–'+year2+': '+rows[dec][1]+' henkilöä'; 
                vm.showForm();
            });
        }
        
        function drawAgeChart(res, range, label, target, quantity) {
            
            var N = range[1]-range[0]+1,
            	arr = new Array(N),
                persons = new Array(N);
                
            for (var i=0; i<N; i++) {
            	arr[i] = [i,0];
            	persons[i] = "";
            }
            
            res.forEach(function(ob) {
            	var age=parseInt(ob.value);
            	if (range[0]<=age && age<=range[1]) {
            		arr[age] = [age, parseInt(ob.count)];
            		persons[age] = ob.persons;
            	}
            });
            
            vm.data[target] = persons;
            
            var stats = getStats(arr),
            	title = label+ (stats[0]==0 ? 
            			": ei tuloksia" : 
            			", otos: "+stats[0]+", keskiarvo: "+stats[1].toFixed(2) +', keskihajonta: '+stats[2].toFixed(2)),
                data = new google.visualization.DataTable(),
                options = {
                    title: title ,
                    legend: { position: 'none' },

                    tooltip: {format: 'none'},
                    colors: ['blue'],

                    hAxis: {
                        slantedText:false,
                        maxAlternation: 1,
                        format: '',
                        ticks: ticksByRange(range)
                    },
                    vAxis: {
                    	maxValue: 4,
                        viewWindow: {
                          min: 1
                        }
                    },
                    width: '95%',
                    bar: {
                        groupWidth: '88%'
                    },
                    height:500
                },

                chart = new google.visualization.ColumnChart(document.getElementById(target));
            
            
            data.addColumn('number', 'Ikä');
            data.addColumn('number', 'Henkilöä');

            data.addRows(arr);
            chart.draw(data, options);
            
            google.visualization.events.addListener(chart, 'select', function() {
                var sel = chart.getSelection(),
                	age = sel[0].row;
                
                vm.people = vm.data[target][age];
                vm.popuptitle = label+' '+age+quantity+": "+arr[age][1]+ (arr[age][1]==1 ? " henkilö" : " henkilöä");
                vm.showForm();
            });

        }

        function ticksByRange(range) {
            var ticks = [],
                x=10*Math.floor(1+range[0]/10);
            while (x<range[1]) {
                ticks.push(x);
                x+=10;
            }
            return ticks;
        }

        function getStats(data) {
            var sum=0.0,
                sum2=0.0,
                count=0;

            $.each(data, function( i, value ) {
                var x = value[0]*value[1];
                sum += x;
                sum2 += value[0]*x;
                count += value[1];
            });
            if (count>0) {
                var mu=sum/count;
                //	median, standard deviation
                return [count, mu, Math.sqrt(sum2/count-mu*mu)];
            }
            return [0.0, 0.0, 0.0];
        }
        

        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return visuService.getResults(facetSelections).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
                vm.isLoadingResults = false;
                
                vm.data = {};
                return res;
            }).catch(handleError);
        }

        function handleError(error) {
            console.log(error)
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
