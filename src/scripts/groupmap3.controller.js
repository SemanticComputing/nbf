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
    .controller('GroupmapController3', GroupmapController3);

    /* @ngInject */
    function GroupmapController3($scope, $location, $state, $uibModal, _, groupmapService,
            FacetHandler, facetUrlStateHandlerService, EVENT_FACET_CHANGED) {

        var vm = this;
        
        vm.map = null;
        
        vm.heatmap = null;
        vm.heatmaps = [null,null,null,null,null];
        vm.message = "";
        
        vm.eventBox = [true, false, false, false, false];
        
        vm.change = function() {
        	if (vm.eventBox.every(function (val) {return !val;})) {
        		vm.eventBox[0] = true;
        	}
        	
        	fetchResults({ constraint: vm.previousSelections });
        };
        
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
            
            if (!vm.map) {
        		vm.map = new google.maps.Map(document.getElementById('ui-gmap-google-map'), {
                	zoom: 6,
                	center: {lat: 62, lng: 24}
              	});
        	}
            
            vm.heatmaps.forEach(
            		function (ob) { 
            			if (ob) ob.setData([]); 
            		});
            
            return groupmapService.getResults3(facetSelections, vm.eventBox)
            .then(function(res) {
            	vm.isLoadingResults = false;
            	vm.message = "";
            	
            	if (res.length<1) {
            		vm.message = "Haku ei tuottanut tuloksia."
            		return;
            	}
            	
            	if (res.length>499) {
            		vm.message = "Tulosjoukko on hyvin suuri, joten näytetään vain 500 ensimmäistä paikkaa."
            	} 
            	
            	var data = [[],[],[],[],[]];
            	res.forEach(function (ob) {
            		data[parseInt(ob.type)].push({location: new google.maps.LatLng(ob.evt.lat, ob.evt.long), weight: parseInt(ob.count)})
            		});
            	
            	data.forEach(function (arr,i) {
            		if (arr.length>0) initMap(arr, i);
            	})
            	
            }).catch(handleError);
        }

        
        
        function initMap(data, index) {
        	var gradients = [
        		['rgba(0, 0, 255, 0)', 'rgba(0, 0, 255, 0.5)', 'rgba(0, 0, 255, 1)'],
        		['rgba(128, 0, 0, 0)', 'rgba(128, 0, 0, 0.5)', 'rgba(128, 0, 0, 1)'],
        		['rgba(0, 128, 0, 0)', 'rgba(0, 128, 0, 0.5)', 'rgba(0, 128, 0, 1)'],
        		['rgba(0, 128, 128, 0)', 'rgba(0, 128, 128, 0.5)', 'rgba(0, 128, 128, 1)'],
        		['rgba(128, 0, 128, 0)', 'rgba(128, 0, 128, 0.5)', 'rgba(128, 0, 128, 1)']
              ];
        	
        	if (!vm.heatmaps[index]) {
		        vm.heatmaps[index] = new google.maps.visualization.HeatmapLayer({
		            map: vm.map,
		            maxIntensity: 10,
		            gradient: gradients[index],
		            radius: 20
		          });
        	};
        	vm.heatmaps[index].setData(data);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
    }
})();
