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
    .controller('VisuNetController', VisuNetController);

    /* @ngInject */
    function VisuNetController($log, $scope, $state, _, google, visuNetService, FacetHandler, facetUrlStateHandlerService, $uibModal) {

		google.charts.load('current', {'packages':['sankey']});
		
        var vm = this;
        
        vm.people = [];
        vm.data = {};

        // assign random ids to chart div so we can use same controller on comparison page
        vm.chart_ids = [0 /**,1,2,3,4*/ ].map(function(i) {
        	return(_.uniqueId());
        });
        
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
        
        visuNetService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = visuNetService.getFacetOptions();
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
            
            visuNetService.getParentProfessions(facetSelections).then(function(data) {
            	if (data.length) {
            		// console.log(data);
            		google.charts.setOnLoadCallback(function () {
                        drawSankeyChart(data, 'Sukupuoli tai ryhmä', vm.chart_ids[0])
                    });
            	}
            });
         
        }
        
        function drawSankeyChart(res, label, target) {
        	var data = new google.visualization.DataTable();
	        data.addColumn('string', 'Vanhempi');
	        data.addColumn('string', 'Lapsi');
	        data.addColumn('number', 'Lukumäärä');
	        
	        //	res = [Object { label_1: "Ruotsin jaarli", label_2: "Suomen herttua", no: "1" }]
	        let rows = res.map(function(ob) {return [ob.label_1, ob.label_2+' ', parseInt(ob.no)]});
	        data.addRows(rows);
	        
			// Sets chart options.
	        var options = {
	          width: "100%",
	          height: 800
	        };
	
	        // Instantiates and draws our chart, passing in some options.
	        var chart = new google.visualization.Sankey(document.getElementById(target));
	        chart.draw(data, options);
        	
        	google.visualization.events.addListener(chart, 'select', function() {
            	var pie;
            	console.log("click", chart);
            	try {
            		var sel = chart.getSelection();
            		console.log(sel);
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
        
        
        // var latestUpdate;

        function handleError(error) {
            console.log(error)
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
