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
    .controller('VisuController2', VisuController2);

    /* @ngInject */
    function VisuController2($log, $scope, $state, _, google, visuService, FacetHandler, facetUrlStateHandlerService, $uibModal) {

        var vm = this;
        
        vm.people = [];
        vm.startYear = [];

        vm.chart_ids = ['chart_age2', 'chart_marriageAge2', 'chart_firstChildAge2', 'chart_numberOfChildren2', 'chart_numberOfSpouses2'];
        
        vm.showForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/visu/popup.html',
                scope: $scope
            });
            /**
            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
            */
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

            return fetchResults(facetSelections).then(function (people) {
                google.charts.setOnLoadCallback(function () {
                    drawYearChart(vm.ages, [1,120], 'Elinikä', vm.chart_ids[0])
                });
                google.charts.setOnLoadCallback(function () {
                    drawYearChart(vm.marriageAges, [1,120], 'Naimisiinmenoikä', vm.chart_ids[1])
                });
                google.charts.setOnLoadCallback(function () {
                    drawYearChart(vm.firstChildAges, [1,120], 'Lapsensaanti-ikä', vm.chart_ids[2])
                });
                google.charts.setOnLoadCallback(function () {
                    drawYearChart(vm.numberOfChildren, [1,25], 'Lasten lukumäärä', vm.chart_ids[3])
                });
                google.charts.setOnLoadCallback(function () {
                    drawYearChart(vm.numberOfSpouses, [1,7], 'Puolisoiden lukumäärä', vm.chart_ids[4])
                });
                return;
            });
        }


        function drawYearChart(res, range, label, target) {

            var persons = new Array(range[1]-range[0]+1);
            for (var i=0; i<persons.length; i++) persons[i] = [];

            for (var i=0; i<res.length; i++) {
                var ob = res[i];
                try {
                	persons[parseInt(ob.value)].push(ob.id);
                }
                catch(err) { //
                }
            }

            var arr=[];
            for (var i=0; i<persons.length; i++) {
                arr[i] = [i, persons[i].length];
            }

            var
            /**arr = $.map( countByYear(res, range),
                    function( value, key ) {
                        return [[ value[0],value[1] ]];
                    }),**/
            stats = getStats(arr),

                data = new google.visualization.DataTable(),
                options = {
                    title: label+", otos: "+stats[0]+", keskiarvo: "+stats[1].toFixed(2) +', keskihajonta: '+stats[2].toFixed(2) ,
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
                        maxValue: 4
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
                var sel = chart.getSelection();
                vm.people = persons[sel[0].row];
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

        function countByProperty(data, prop) {
            return countProperties(data, prop)
                .sort(function(a, b){ return b[1]-a[1] });
        }


        function countByYear(data, range) {
            var res = [];

            $.each(data, function( i, value ) {
                res.push([ parseInt(value['value']), parseInt(value['count']) ]);
            });

            //	fill missing years with zero value
            res=fillEmptyYears(res, range);

            //	padding if only one result:
            if (res.length<2) {
                // add year before with zero result
                var y=parseInt(res[0][0])-1;
                res = [[y,0]].concat(res);

                // ... and after
                y=parseInt(res[res.length-1][0])+1;
                res.push([y,0]);
            }

            return res ;
        }


        function fillEmptyYears(data, range) {
            if (data.length<2) return data;
            data.push([range[1], 0]);

            var res=[],
                y=parseInt(data[0][0]);
            if (y>range[0]) {
                data.unshift([range[0], 0]);
                y=range[0];
            }
            for (var i=0; i<data.length; i++) {
                var y2=parseInt(data[i][0]);
                //	fill missing years in the sequence with zero values:
                while (y<y2) {
                    res.push([y, 0]);
                    y++;
                }
                res.push(data[i]);
                y++;
            }
            return res;
        }

        function countProperties(data, prop) {
            var res = {};
            $.each(data, function( i, value ) {
                if (value.hasOwnProperty(prop)) {
                    var y=value[prop];

                    if (res.hasOwnProperty(y)) {
                        res[y] += 1;
                    } else {
                        res[y] = 1;
                    }
                }
            });
            return $.map( res, function( value, key ) {
                return [[key, value]];
            });
        }


        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.ages = [];
            vm.marriageAges = [];
            vm.firstChildAges = [];
            vm.numberOfChildren = [];
            vm.numberOfSpouses = [];
            //vm.topSchools = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return visuService.getResults(facetSelections).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
                vm.isLoadingResults = false;
                vm.ages = res[0];
                vm.marriageAges = res[1];
                vm.firstChildAges = res[2];
                vm.numberOfChildren = res[3];
                vm.numberOfSpouses = res[4];
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
