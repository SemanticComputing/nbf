(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PlaceController', PlaceController);

    /* @ngInject */
    function PlaceController($stateParams, $uibModal, _, $location, $scope,
    		placeService, FacetHandler, facetUrlStateHandlerService) {
    	
        var vm = this;
        
        // vm.openPage = openPage;
        
        function init() {
        	
        	placeService.getPlace($stateParams.placeId).then(function(data) {
        		vm.place = data[0];
        		// setMap();
        		
        		placeService.getHierarchy($stateParams.placeId).then(function(data) {
        			console.log(data);
        			if (data.length) { vm.related = data; setMap(); }
        		}).catch(handleError);
        		
            }).catch(handleError);
        }
        
        init();
        
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        vm.markers = [];
        
        function setMap() {
        	if (vm.place && vm.place.lat) {
        		
	        	var lat = vm.place.lat,
	        		lng = vm.place.lng;
	        	
	        	vm.map = { 
	        			center: {
	        				latitude: lat,
	        				longitude: lng },
	        				zoom: 6};
	        	
	        	vm.markers[0] = {
	        			"latitude": lat,
	        			"longitude": lng,
	        			"id": '0',
	        			"options": {
	        				icon: {
	        					scaledSize: new google.maps.Size(60, 60),
	        					url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
	        					},
							optimized: true,
							title: vm.place.label
							}
	        			};
	        	if (vm.related) {
	        		vm.related.forEach(function(ob, i) {
	        			if (ob.lat && parseInt(ob.level)<1) {
	        				vm.markers.push({
		    	        			"latitude": ob.lat,
		    	        			"longitude": ob.lng,
		    	        			"id": i,
		    	        			"options": {
		    	        				icon: {
		    	        					scaledSize: new google.maps.Size(30, 30),
		    	        					url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
		    	        					},
		    							optimized: true,
		    							title: ob.label
		    							}
		    	        			});
	        			}
	        		});
	        	}
        	}
        }
        
        
        
        placeService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });
        
        function getFacetOptions() {
        	vm.readUrl();
            var options = placeService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }
        
        function handleEvents(events, vm) {
        	var born = [],
        		died = [],
        		evented = [];
        	
        	events.forEach(function(event) {
        		var prs = event.prs;
        	    
        		switch(prs.event) {
	        	    case "http://ldf.fi/nbf/Birth":
	        	    	born.push(prs);
	        	        break;
	        	    case "http://ldf.fi/nbf/Death":
	        	    	died.push(prs);
	        	        break;
	        	    default:
	        	    	prs.label = prs.label + ': ' + prs.eventLabel;
	        	    evented.push(prs);
        		}
        	});
        	
        	vm.place = { id: events[0].id, label: events[0].label };
        	vm.place.born = born;
        	vm.place.died = died;
        	vm.place.event = evented;
        	
        }
        
        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.place; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        // read url parameters:
        vm.readUrl = function() {
	        var lc = $location.search(),
	        	param = vm.right ? 'limit2' : 'limit';
	        /*
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
	        */
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
    }
})();
