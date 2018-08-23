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
    .controller('GroupmapController', GroupmapController);

    /* @ngInject */
    function GroupmapController($scope, $location, $state, $uibModal, _, groupmapService,
            FacetHandler, facetUrlStateHandlerService, EVENT_FACET_CHANGED) {

        var vm = this;
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        vm.markers = [];
        vm.window = { show: false, 
        		position: {
        			lat: 60.192059,
        			lng: 24.945831}
        };
        
        vm.limitoptions = [{value:200},{value:500},{value:1000},{value:2500},{value:5000}];
        vm.SEARCHLIMIT = vm.limitoptions[1];
        
        vm.eventtypes = [
        	{type:"0", check: true, color:"hsl(222, 90%, 60%)", label: "Syntymä", label2: "syntyneet", tooltip: "Henkilöiden syntymäpaikat kartalla"}, 
        	{type:"1", check: true, color:"hsl(0, 90%, 60%)", label: "Kuolema", label2: "kuolleet", tooltip: "Henkilöiden kuolinpaikat kartalla"},
        	{type:"2", check: false, color:"hsl(0, 0%, 45%)", label: "Ura", label2: "ura", tooltip: "Henkilöiden opiskelu- ja työpaikat"},
        	{type:"3", check: false, color:"hsl(120, 90%, 40%)", label: "Teokset", label2: "teokset", tooltip: "Paikat, joissa on henkilöihin liittyviä teoksia"},
        	{type:"4", check: false, color:"hsl(180, 90%, 40%)", label: "Kunniamaininnat", label2: "kunniamaininnat", tooltip:"Kunniamainintoihin liittyvät paikat"}
        	];
        
        vm.change = function() {
        	if (vm.eventtypes.every(function (val) {return !(val.check);})) {
        		vm.eventtypes[0].check = true;
        	}
        	fetchResults({ constraint: vm.previousSelections });
        };
        
        vm.showForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            });
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

        function openPageOLD(person) {
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
            
            var selections = vm.eventtypes.map(function(ob) { return ob.check; } );
            
            return groupmapService.getResults(facetSelections, selections, vm.SEARCHLIMIT.value)
            .then(function(res) {
            	vm.isLoadingResults = false;
            	
            	vm.message = "";
            	
            	if (res.length<1) {
            		vm.message = "Haku ei tuottanut tuloksia."
            		return;
            	}
            	
            	vm.events = processEvents(res, vm);
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        function processEvents(events, vm) {
        	vm.markers = [];
        	
        	events.forEach( function(event, i) {
        		var m = generateMarker(vm, event.place.latitude, 
        				event.place.longitude, 
        				i,
        				event.type, 
        				event.count,
        				event.place.label,
        				event.person.ids);
        		vm.markers.push(m);
        	});
        	
        	
        	var bounds = new google.maps.LatLngBounds();
        	
        	// scale the years to get a coordinate on the timeline:
        	
        	var map = document.getElementById('ui-gmap-google-map');
        	if (map && map.fitBounds) { map.fitBounds(bounds); }
        	
        	return events;
        }
        
        function generateMarker(vm, lat, lon, id, type, count, label, people) {
        	
        	var r = 5.0*Math.sqrt(count),
        		tooltiplabel = getPlaceLabel(label, type, count);
        	
        	return {
        			"count": count,
        			"latitude": lat,
        			"longitude": lon,
        			"id": id,
        			"options": {
        				icon:{
	        				path:"M-"+r+" 0 A "+r+","+r+", 0 ,1, 1,"+r+",0 A"+r+","+r+",0,1,1,-"+r+",0 Z",
							scale: 1.0,
							anchor: new google.maps.Point(0,0),
							fillColor: vm.eventtypes[parseInt(type)].color,
							fillOpacity: 0.6,
							strokeOpacity: 0.2,
							strokeWeight: 1,
							labelOrigin: new google.maps.Point(0, 0)
							},
						optimized: true,
						title: tooltiplabel
						},
	        		"onClick": function () {
	        			vm.popuptitle = tooltiplabel;
	        			vm.people = people;
	        			vm.showForm();
        		}
        	};
        	
        }
        
        function getPlaceLabel(label, type, count) {
        	var arr = ['syntyneet', 'kuolleet', 'ura', 'teokset' ,'kunniamaininnat'];
        	return label + ", "+vm.eventtypes[parseInt(type)].label2+" ("+count+")";
			
        }
    }
})();
