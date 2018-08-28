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
    .controller('NetworkController', NetworkController);

    /* @ngInject */
    function NetworkController($scope, $location, $state, $uibModal, _, networkService,
            FacetHandler, facetUrlStateHandlerService, EVENT_FACET_CHANGED) {

        var vm = this;
        vm.cy = null;
        vm.message = "";
        vm.dict = {};
        vm.chosenNode = null;
        
        vm.showWindow = function() {
        	vm.window.show = true;
        }
        vm.closeWindow = function() {
        	vm.window.show = false;
        }
        
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.getSortClass = networkService.getSortClass;
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        networkService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function openPage(person) {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return person; }
                }
            });
        }

        function getFacetOptions() {
            var options = networkService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        function sortBy(sortBy) {
        	networkService.updateSortBy(sortBy);
            return fetchResults({ constraint: vm.previousSelections });
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections);
        }

        var latestUpdate;
        function fetchResults(facetSelections) {
            // vm.isLoadingResults = true;
            vm.error = undefined;
            
            if (vm.cy) {
            	vm.cy.elements().remove();
            }
            
            vm.cy = null;
            vm.message = "";
            
            
            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return networkService.getResults(facetSelections)
            .then(function(res) {
            	
            	vm.message = '';
            	vm.chosenNode = null;
            	if (res.length>999) {
            		vm.message = "Tulosjoukko on hyvin suuri, joten verkosto on rajattu tuhanteen linkkiin."
            	} 
            	if (res.length<2) {
            		vm.message = "Hakuehdoilla on löydy verkostoa."
            	}
            	// console.log(res);
            	/* vm.network = */ processData(res, vm);
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
        			var id = obj['id'];
        			if (!dct.hasOwnProperty(id)) {
        				dct[id] = { label:obj['id_name'] };
        				elems.push({ data: { id: id, label:obj['id_name']} });
        			}
        			//	add target node
        			var id2 = obj['id2'];
        			if (!dct.hasOwnProperty(id2)) {
        				dct[id2] = { label:obj['id2_name'] };
        				elems.push({ data: { id: id2, label:obj['id2_name']} });
        			}
        			//	add edge
        			elems.push({ data: { id: i++, source: id, target: id2, selectable: false } });
        		});
        		return [elems, dct];
        	};
        	
        	var elems = handleData(res);
        	vm.dict = elems[1];
        	
            vm.cy = cytoscape({
                container: document.getElementById('networkcontainer'),
                elements: elems[0],
                wheelSensitivity: 0.2,
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
            // console.log(vm.cy.panzoom);
            vm.cy.panzoom({});
        }
        
        // function generateMarker(vm, lat, lon, id, type, count, label, people) {}
        
    }
})();
