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
    function VisuController2($log, $scope, $state, _, google, visuService2, FacetHandler, facetUrlStateHandlerService, $uibModal) {

        var vm = this;
        
        vm.people = [];
        vm.data = {};

        // assign random ids to chart div so we can use same controller on comparison page
        vm.chart_ids = [0,1,2,3,4].map(function(i) {
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
        
        visuService2.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = visuService2.getFacetOptions();
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
                    drawPieChart(res[0], 'Sukupuoli tai ryhmä', vm.chart_ids[0])
                });
            	
            	google.charts.setOnLoadCallback(function () {
                    drawPieChart(res[1], 'Toimiala', vm.chart_ids[2])
                });

            	google.charts.setOnLoadCallback(function () {
                    drawPieChart(res[2], 'Arvo, ammatti tai toiminta', vm.chart_ids[3])
                });
            	
            	google.charts.setOnLoadCallback(function () {
                    drawPieChart(res[3], 'Tietokanta', vm.chart_ids[1])
                });
            	
            	google.charts.setOnLoadCallback(function () {
                    drawPieChart(res[4], 'Yritys tai yhteisö', vm.chart_ids[4])
                });
            });
        }
        
        function drawPieChart(res, label, target) {
            
			var arr = res.map(function(ob) { return [ob.value, parseInt(ob.count)]; });
			var total = res.map(function(ob) { return parseInt(ob.count); }).reduce((a, b) => a + b, 0);
			
			var data = google.visualization.arrayToDataTable(([['Luokka', 'Arvo']]).concat(arr));
			
			vm.data[target] = res.map(function(ob) {return ob.persons});
			
			var options = {
			    title: label+(total==0 ? ': ei tuloksia' : ': '+
			    		res.length+ (res.length>1 ? ' luokkaa, ' : ' luokka, ')+
			    		'yhteensä ' +total+ ' henkilöä')
			  };
			
			var chart = new google.visualization.PieChart(document.getElementById(target));
			  
			chart.draw(data, options);

            google.visualization.events.addListener(chart, 'select', function() {
            	var pie;
            
            	try {
            		var sel = chart.getSelection();
            		pie = sel[0].row;
            	} 
            	catch(err) {
            		console.log('Unhandled click');
            		return;
            	}
                vm.people = vm.data[target][pie];
                vm.popuptitle = arr[pie][0]+ ': '+arr[pie][1]+ ' tulosta';
                vm.showForm();
            });
            
			
        }
        

        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return visuService2.getResults(facetSelections).then(function(res) {
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
