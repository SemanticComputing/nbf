(function() {

    'use strict';
     angular.module('facetApp')

    /*
    * Controller for the person's timeline & map view.
    */
    .controller('MapController', MapController);

    /* @ngInject */
    function MapController($stateParams, $uibModal, _, mapService) {

        var vm = this;

        vm.openPage = openPage;
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        
        //	evoked when timeline is hovered
        vm.focusEvent = function(event) {
        	vm.currentEvent = event.label;
        	if (event.place && event.place.latitude) {
        		vm.map.center = {'latitude': event.place.latitude, 'longitude': event.place.longitude };
        	}
        };
        
        init();

        function init() {
        	mapService.getEvents($stateParams.personId).then(function(events) {
        		vm.currentEvent = ".";
        		vm.events = events;
        		if (events.length) {
        			vm.person = events[0];
        			}
        			vm.events = processEvents(events);
        			formMainline(vm);
        			
        			console.log(vm);
        		
        		return events;
            }).catch(handleError);
        }

        function processEvents(events) {
        	console.log(events);
        	var current_year = (new Date()).getFullYear(),
        		min_time=current_year, max_time=0,
        		has_death = false;
        	
        	events.forEach( function(event) {
        		
        		if (event.time) {
	        		['start', 'end'].forEach( function(p) {
	        			if (event.time[p]) {
	        				
		        			//	convert "1928-06-19" to 1928.0 
		        			var year=parseInt(event.time[p].match(/^\d\d\d\d/g)[0]);
		        			
			        		if (max_time<year) max_time=year;
			        		if (year<min_time) min_time=year;
			        		
			        		event.time[p] = year;
			        		// console.log(event.time[p],year);
			        		
			        		event[(p=='start' ? 'x0' : 'x1')] = year;
			        		
	        			}
	        		});
        		}
        		
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		var icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ABCDEF"
        			
        		if (event.class == "death") {
        			has_death = true;
        			icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ff4141";
        			event.label = 'Kuollut '+event.time.label;
        		} else if (event.class == "birth") {
        			icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|3b46ff";
        			event.label = 'Syntynyt '+event.time.label;
        		} else if (event.class == "spouse") {
        			event.label = event.label+', '+event.time.label;
        			// icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|3b46ff";
        		} else if (event.class == "child") {
        			event.label = event.label+', '+event.time.label;
        			// icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|3b46ff";
        		}
        		event['options'] = {'icon':icon};
        	});
        	
        	
        	if (!has_death) max_time += 15;
        	if (max_time<=min_time) max_time = min_time+75;
        	if (max_time>current_year) max_time = current_year;
        	
        	events.min_year = min_time;
        	events.max_year = max_time;
        	
        	// normalize the year to get a coordinate on the timeline:
        	var i=0;
        	events.forEach( function(event) {
        		event['x0'] = 750.0*(event['x0']-min_time)/(max_time-min_time);
        		event['x1'] = 750.0*(event['x1']-min_time)/(max_time-min_time);
        		
        		if (event.place && event.place.latitude) {
        		event.coords = {'latitude': event.place.latitude, 'longitude': event.place.longitude} ;
        		}
        		event.marker_id = i++;
        	});
        	console.log(events);
        	return events;
        }
        
        function formMainline(vm) {
        	var y0 = vm.events.min_year, 
        		j = y0,
        		y1 = vm.events.max_year,
        		arr=[];
        	for (var i=10*Math.ceil(y0/10); i<y1+10; i+=10) {
        		arr.push({'start':750*(j-y0)/(y1-y0) , 'end': 750*((i<y1 ? i : y1)-y0)/(y1-y0) });
        		j=i;
        	}
        	vm.mainline = arr;
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
