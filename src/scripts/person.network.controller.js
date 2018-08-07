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
    .controller('PersonNetworkController', PersonNetworkController);

    /* @ngInject */
    function PersonNetworkController($scope, $location, $state, _, $stateParams, personNetworkService,
            FacetHandler) {

        var vm = this;
        vm.cy = null;
        vm.message = "";
        vm.dict = {};
        vm.chosenNode = null;
        
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
        	fetchResults(event, config);
            initListener();
        });
        
        $scope.$on('sf-facet-constraints', fetchResults);
        
        vm.handler = new FacetHandler({scope : $scope});
        
        
        var latestUpdate;
        function fetchResults() {
            
            vm.error = undefined;
            
            if (vm.cy) {
            	vm.cy.elements().remove();
            }
            
            vm.cy = null;
            vm.message = "";
            
            return personNetworkService.getResults($stateParams.personId)
            .then(function(res) {
            	
            	vm.message = '';
            	vm.chosenNode = null;
            	if (res.length>999) {
            		vm.message = "Tulosjoukko on hyvin suuri, joten verkosto on rajattu tuhanteen linkkiin."
            	} 
            	if (res.length<2) {
            		vm.message = "Hakuehdoilla on löydy verkostoa."
            	}
            	
            	processData(res, vm);
            	
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        function processData(res, vm) {
        	
        	var handleData = function(data) {
        		var dct={},
        			elems = [],
        			i=0;
        		data.forEach( function(obj) { 
        			//	add source node
        			var id = obj['source'];
        			if (!dct.hasOwnProperty(id)) {
        				dct[id] = { label:obj['source_name'] };
        				elems.push({ data: { id: id, label:obj['source_name']} });
        			}
        			//	add target node
        			var id2 = obj['target'];
        			if (!dct.hasOwnProperty(id2)) {
        				dct[id2] = { label:obj['target_name'] };
        				elems.push({ data: { id: id2, label:obj['target_name']} });
        			}
        			//	add edge
        			elems.push({ data: { id: i++, source: id, target: id2, selectable: false } });
        		});
        		return [elems, dct];
        	};
        	
        	var elems = handleData(res);
        	vm.dict = elems[1];
        	
            vm.cy = cytoscape({
                container: document.getElementById('personnetworkcontainer'),
                elements: elems[0],
	        	layout: {
	        		name: 'cose',
	        		idealEdgeLength: 100,
	        		nodeOverlap: 20,
	        		refresh: 20,
	        		fit: true,
	        		padding: 30,
	        		randomize: false,
	        		componentSpacing: 100,
	        		nodeRepulsion: 400000,
	        		edgeElasticity: 100,
	        		nestingFactor: 5,
	        		gravity: 80,
	        		numIter: 1000,
	        		initialTemp: 200,
	        		coolingFactor: 0.95,
	        		minTemp: 1.0
	        	},
	        	style: [
	                {
	                    selector: 'node',
	                    style: {
	                        "shape": 'ellipse',
	                        "height": '20px',
	                        "width": '20px',
	                        "text-valign": "center",
	                        "text-halign": "right",
	                        'background-color': '#999',
	                        'color': '#111',
	                        'content': 'data(label)'
	                    }
	                },
	                {
	                    selector: ':active',
	                    style: {
	                        'background-color': '#800',
	                        'color': '#800'
	                    }
	                },
	                {
	                    selector: 'edge',
	                    style: {
	                    	'opacity': 0.5,
	                        'width': '1px',
	                        'line-color': '#333',
	                        'target-arrow-color': '#333',
	                        'target-arrow-shape': 'triangle',
	                        'curve-style': 'bezier'
	                    }
	                }]   
	              });
            
            var showNodeInfo = function(evt){
            	var id = this.id(),
    				label = vm.dict[id].label;
            	
	          	vm.message = '';
	          	vm.chosenNode = {url:id, label:label};
	          	$scope.$apply();
	    	}
            
            vm.cy.on('click', 'node', showNodeInfo);
            vm.cy.on('drag', 'node', showNodeInfo);
            
            vm.cy.panzoom({});
        }
        
        
        
    }
})();
