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
    .controller('VisuColumnController', VisuColumnController);

    
    /* @ngInject */
    function VisuColumnController($scope, $state, _, google, visuColumnService, FacetHandler, facetUrlStateHandlerService, $uibModal) {

        var vm = this;
        
        
        vm.people = [];
        vm.data = {};
        
        // assign random ids to chart div so we can use same controller on comparison page
        vm.chart_ids = [0,1,2,3,4,5].map(function(i) {
        	return(_.uniqueId());
        });
        // vm.chart_ids = ['chart_age', 'chart_marriageAge', 'chart_firstChildAge', 'chart_numberOfChildren', 'chart_numberOfSpouses'];
        
        vm.showForm = function () {
            $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            }).result.then(function(){}, function(res){});
        };
        
        vm.removeFacetSelections = removeFacetSelections;

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);
        
        visuColumnService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = visuColumnService.getFacetOptions();
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
            
            visuColumnService.getYears(facetSelections).then(function(data) {
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawYearChart(data, null, 'Henkilöjakauma vuosikymmenittäin', vm.chart_ids[0])
                    });
            	}
            });
            
            visuColumnService.getAge(facetSelections).then(function(data) {
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawAgeChart(data, [0,120], 'Elinikä', vm.chart_ids[1], ' vuotta')
                    });
            	}
            });
            
            visuColumnService.getMarriageAge(facetSelections).then(function(data) {
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawAgeChart(data, [0,120], 'Naimisiinmenoikä', vm.chart_ids[2], ' vuotta')
                    });
            	}
            });

            visuColumnService.getFirstChildAge(facetSelections).then(function(data) {
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawAgeChart(data, [0,120], 'Lapsensaanti-ikä', vm.chart_ids[3], ' vuotta')
                    });
            	}
            });
            
            visuColumnService.getNumberOfChildren(facetSelections).then(function(data) {
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawAgeChart(data, [0,25], 'Lasten lukumäärä', vm.chart_ids[4], '')
                    });
            	}
            });
            
            visuColumnService.getNumberOfSpouses(facetSelections).then(function(data) {
            	if (data.length) {
            		google.charts.setOnLoadCallback(function () {
                        drawAgeChart(data, [0,10], 'Puolisoiden lukumäärä', vm.chart_ids[5], '')
                    });
            	}
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
        	
        	// limit range by largest value in current data
            var maxage = 5;
            res.forEach(function(ob) {
            	var age=parseInt(ob.value);
            	if (maxage<age && age<=range[1]) {
            		maxage=age;
            	}
            });
            if (maxage<range[1]) range[1]=maxage;
            
            
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
        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
