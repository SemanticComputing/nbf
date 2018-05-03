/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('NlpController', NlpController);

    /* @ngInject */
    function NlpController($log, $scope, $state, _, google, nlpService, FacetHandler, facetUrlStateHandlerService) {

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
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
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


        function drawChart(results) {
            google.charts.setOnLoadCallback(function () {
                var data = new google.visualization.DataTable();
                var ticks = _.map(results, function(res) { return parseInt(res.year); });
                var rows = _.map(results, function(res) { return [res.year, parseInt(res.count)]; });
                var options = {
                    title: 'Biografiajakauma vuosikymmenittäin',
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
                return nlpService.getResults(facetSelections).then(function(results) {
                    if (latestUpdate !== updateId) {
                        return;
                    }
                    vm.results = results;
                    vm.isLoadingResults = false;
                });
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
            $log.error(error);
        }
    }
})();
