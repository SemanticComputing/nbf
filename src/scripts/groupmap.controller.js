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
    function GroupmapController($scope, $location, $state, 
    		$uibModal, _, groupmapService,
            FacetHandler, facetUrlStateHandlerService, 
            EVENT_FACET_CHANGED 
            ) {

    	var vm = this;
    	
    	// for comparison views
        vm.right = false;
        
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        vm.markers = [];
        vm.window = { show: false,
        		position: {
        			lat: 60.192059,
        			lng: 24.945831}
        };
        
        var mapchange = function (map) {
        	$location.search(
        			vm.right ? 'map2':'map',
        			angular.toJson(vm.map)
        		);
        };
        
        vm.mapevents= { zoom_changed: mapchange, 
        		dragend: mapchange };
        
        vm.LIMITOPTIONS = [{value:200},{value:500},{value:1000},{value:2500},{value:5000}];
        vm.searchlimit = vm.LIMITOPTIONS[0];
        
        vm.EVENTTYPES = [
        	{type:"0", check: true, color:"hsl(222, 90%, 60%)", label: "Syntymä", label2: "syntyneet", tooltip: "Henkilöiden syntymäpaikat kartalla"}, 
        	{type:"1", check: true, color:"hsl(0, 90%, 60%)", label: "Kuolema", label2: "kuolleet", tooltip: "Henkilöiden kuolinpaikat kartalla"},
        	{type:"2", check: false, color:"hsl(0, 0%, 45%)", label: "Ura", label2: "ura", tooltip: "Henkilöiden opiskelu- ja työpaikat"},
        	{type:"3", check: false, color:"hsl(120, 90%, 40%)", label: "Teokset", label2: "teokset", tooltip: "Paikat, joissa on henkilöihin liittyviä teoksia"},
        	{type:"4", check: false, color:"hsl(180, 90%, 40%)", label: "Kunniamaininnat", label2: "kunniamaininnat", tooltip:"Kunniamainintoihin liittyvät paikat"}
        	];
        
        vm.change = function() {
        	// require at least one event type to be chosen
        	if (vm.EVENTTYPES.every(function (val) {return !(val.check);})) {
        		vm.EVENTTYPES[0].check = true;
        	}
        	
        	$location.search(vm.right ? 'limit2' : 'limit', vm.searchlimit.value);
        	
        	var st = vm.EVENTTYPES.map(function(val) { return val.check ? 1 : 0; }).join(',');
        	$location.search(vm.right ? 'events2' : 'events', st);
        	
        	fetchResults({ constraint: vm.previousSelections });
        }; 
        
        
        // read url parameters:
        vm.readUrl = function() {
	        var lc = $location.search(),
	        	param = vm.right ? 'limit2' : 'limit';
	        
	        if (lc[param]) {
	        	var lim = parseInt(lc[param]);
	        	vm.LIMITOPTIONS.forEach(function(ob, i) {
	        		if (lim==ob.value) vm.searchlimit=vm.LIMITOPTIONS[i];
	        	});
	        }
	        
	        param = vm.right ? 'events2' : 'events';
	        if (lc[param]) {
	        	(lc[param].split(',')).forEach(function(x, i) { vm.EVENTTYPES[i].check = (x!="0"); });
	        }
	        
	        //	Update map view from url parameters
	        param = vm.right ? 'map2' : 'map';
	        if (lc[param]) {
	        	try {
	                var map = angular.fromJson(lc[param]);
	                vm.map = map; 
	            }
	            catch(e) {
	            	$location.search(param, null);
	            	// console.log('parameter '+param+' cleared')
	            }
	        }
        };
        
        
         
        vm.showForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/popup.html',
                scope: $scope
            }).result.then(function(){}, function(res){});
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
        
        
        function getFacetOptions() {
        	vm.readUrl();
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
            
            var selections = vm.EVENTTYPES.map(function(ob) { return ob.check; } );
            
            return groupmapService.getResults(facetSelections, selections, vm.searchlimit.value)
            .then(function(res) {
            	vm.isLoadingResults = false;
            	
            	if (res.length<1) {
            		vm.message = "Haku ei tuottanut tuloksia."
            		return;
            	}
            	vm.message = (res.length<vm.searchlimit.value) ?
            			"Haku tuotti "+(res.length)+" paikkatulosta." :
            			"Kartalla näytetään "+(res.length)+" ensimmäistä paikkaa.";
            	
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
							fillColor: vm.EVENTTYPES[parseInt(type)].color,
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
        	return label + ", "+vm.EVENTTYPES[parseInt(type)].label2+" ("+count+")";
			
        }
    }
})();
