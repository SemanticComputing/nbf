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
    .controller('GroupmapController2', GroupmapController2);

    /* @ngInject */
    function GroupmapController2($scope, $location, $state, $uibModal, _, groupmapService,
            FacetHandler, facetUrlStateHandlerService, EVENT_FACET_CHANGED) {

        var vm = this;
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        vm.window = { show: false, 
        		position: {
        			lat: 60.192059,
        			lng: 24.945831}
        };
        
        vm.message = "";
        
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.getSortClass = groupmapService.getSortClass;
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        groupmapService.getFacets().then(function(facets) {
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
            var options = groupmapService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        function sortBy(sortBy) {
        	groupmapService.updateSortBy(sortBy);
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
            vm.isLoadingResults = true;
            vm.error = undefined;
            
            var updateId = _.uniqueId();
            latestUpdate = updateId;
            
            vm.polylines = [];
            return groupmapService.getResults2(facetSelections)
            .then(function(res) {
            	vm.isLoadingResults = false;
            	vm.message = "";

            	if (res.length<1) {
            		vm.message = "Haku ei tuottanut tuloksia."
            		return;
            	}
            	
            	if (res.length>499) {
            		vm.message = "Tulosjoukko on hyvin suuri, joten näytetään vain 500 ensimmäistä tulosta."
            	} 
            	
            	processEvents(res, vm);
            	
            	
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        function processEvents(events, vm) {
        	
        	//	normalize to counts to range [1,8]
        	var mincount = events[0].count,
    			maxcount = events[events.length-1].count;

        	var minweight = 1,
        		maxweight = 8;
        	
        	var a = 1, b = 0;
        	
        	if (maxcount>maxweight && maxcount>mincount) {
        		a = (maxweight-minweight)/(maxcount-mincount);
        		b = minweight-a*mincount;
        	}
	        events.forEach( function(evt) {
	        	evt.weight = a*evt.count+b;
	        });
        	
        	
         	var i=0;
        	vm.polylines = events.map(function(evt) { return eventToObject(evt, i++); });
        }
        
        function eventToObject(evt, id){
        	
        	var randomColor = ['LightSkyBlue','DeepSkyBlue','DodgerBlue','CornflowerBlue'][(4*Math.random())>>0];
        	randomColor = 'hsl('+(100+150*Math.random())+', 100%, 25%)';
        	
        	return {
        		id: id,
        		path: [
        			{
        				latitude: evt.birth.latitude,
        				longitude: evt.birth.longitude
        			},
        			{
        				latitude: evt.death.latitude,
        				longitude: evt.death.longitude
        			}],
        		stroke: {
        			color: randomColor ,
        			weight: evt.weight
        		},
        		icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                        scale: evt.weight
                    }
                }]
        	};
        }
        
        
    }
})();
