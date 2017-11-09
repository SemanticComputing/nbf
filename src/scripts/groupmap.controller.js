(function() {

    'use strict'; 
     angular.module('facetApp')

    /*
    * Controller for the person's timeline & map view.
    * api key: AIzaSyCS7M4hXwmBzV1FwE1p9lIDh1QSPhGqhUU
    */
    .controller('GroupmapController', GroupmapController);

    /* @ngInject */
    function GroupmapController($stateParams, $uibModal, _, groupmapService) {

        var vm = this;
        
        vm.openPage = openPage;
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        vm.markers = [];
        
        init();
        
        function init() {
        	
        	groupmapService.getEvents($stateParams.personId).then(function(events) {
        		vm.events = processEvents(events, vm);
        		return events;
            }).catch(handleError);
        }

        function processEvents(events, vm) {
        	
        	var current_year = (new Date()).getFullYear(),
        		min_time=current_year, max_time=0,
        		i=0;
        	
        	var places = {};
        	
        	events.forEach( function(event) {
        		
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		
        		//	group by place uris
        		var key=event.class+event.place.uri;
        		if (!places.hasOwnProperty(key)) {
        			places[key]={count:0, latitude:event.place.latitude, longitude:event.place.longitude, type:event.class}
        		}
        		places[key]['count']+=1;
        		/*
        		event.id = ++i;
        		if (event.place && event.place.latitude) {
        			if (event.place.latitude.constructor === Array) { 
        				// var arr = [];
        				for (var j=0; j<event.place.latitude.length; j++) {
        					var m = generateMarker(event.place.latitude[j], event.place.longitude[j], event.id, event.class);
        					vm.markers.push(m);
        					// bounds.extend(new google.maps.LatLng(event.place.latitude[j], event.place.longitude[j]));
        				}
            		} else {
            			var m = generateMarker(event.place.latitude, event.place.longitude, event.id, event.class);
            			vm.markers.push(m);
	        			//bounds.extend(new google.maps.LatLng(event.place.latitude, event.place.longitude));
            		}
        		}
        		*/
        	});
        	vm.markers = [];
        	var i = 0;
        	for (var x in places) {
        		var place=places[x];
        		var m = generateMarker(place.latitude, place.longitude, ++i, place.type, 5.0*Math.sqrt(place.count));
        		vm.markers.push(m);
        	}
        	
        	var bounds = new google.maps.LatLngBounds();
        	
        	// scale the years to get a coordinate on the timeline:
        	
        	var map = document.getElementById('ui-gmap-google-map');
        	if (map && map.fitBounds) { map.fitBounds(bounds); }
        	
        	return events;
        }
        
        
        function generateMarker(lat, lon, id, type, r) {
        	if (!r) r=5.0;
        	var ICONCOLORS = {
    				"death":	"#ff4141",
    				"birth":	"#777fff",
    				"spouse":	"#c3b981",
    				"child":	"#7f6780",
    				"career":	"#999999",
    				"product":	"#83d236",
    				"honour":	"#ce5c00",
    				"event":	"#ABCDEF"
    		};
        	var m = {
        			"latitude": lat,
        			"longitude": lon,
        			"id": id,
        			"options": {
	        			icon:{
	        				path:"M-"+r+" 0 A "+r+","+r+", 0 ,1, 1,"+r+",0 A"+r+","+r+",0,1,1,-"+r+",0 Z",
							scale: 1.0,
							anchor: new google.maps.Point(0,0),
							fillColor: ICONCOLORS[type],
							fillOpacity: 0.6,
							strokeOpacity: 0.2,
							strokeWeight: 1,
							labelOrigin: new google.maps.Point(0, 0)
							},
						optimized: false,
						
						}
        	};
        	return m;
        }
        
        
        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.person; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
