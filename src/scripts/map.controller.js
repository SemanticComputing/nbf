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
        
        init();

        function init() {
        	mapService.getEvents($stateParams.personId).then(function(events) {
        		
        		vm.events = events;
        		if (events.length) {
        			vm.person = { 'id': events[0]['id'], 
        					'givenName': events[0]['givenName'], 
        					'familyName': events[0]['familyName'] };
        			}
        			vm.events = processEvents(events);
        			formMainline(vm);
        			// vm.mainline = [{'start': 0, 'end': 305}, {'start': 375, 'end': 750}];
        			console.log(vm);
        		
        		return events;
            }).catch(handleError);
        }

        function processEvents(events) {
        	var min_time=2020, max_time=0;
        	var eventClassTypes = {}; 
        	events.forEach( function(event) {
        		['start_time', 'end_time'].forEach( function(p) {
        			//	convert "1928-06-19" to 1928.0 
        			var year=parseInt(event[p].match(/^\d\d\d\d/g)[0]);
	        		if (max_time<year) max_time=year;
	        		if (year<min_time) min_time=year;
	        		event[p] = year;
	        		if (p=='start_time') {
	        			event['x0'] = year;
	        		} else {
	        			event['x1'] = year;
	        		}
	        		
	        		event['class'] = 'event';
	        		var icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ABCDEF"
	        			
	        		if (event['label'] == "Kuolema") {
	        			event['class'] = 'death';
	        			icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|ff4141";
	        		} else if (event['label'] == "Syntymä") {
	        			event['class'] = 'birth';
	        			icon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|3b46ff";
	        		} 
	        		
	        		event['options'] = {'icon':icon};
	        		
        		});
        	});
        	
        	if (max_time<=min_time) max_time=min_time+75;
        	
        	events.min_year = min_time;
        	events.max_year = max_time;
        	
        	// normalize the year to get a coordinate on the timeline:
        	events.forEach( function(event) {
        		event['x0'] = 750.0*(event['x0']-min_time)/(max_time-min_time);
        		event['x1'] = 750.0*(event['x1']-min_time)/(max_time-min_time);
        		
        		event.coords = {'latitude': event.lat, 'longitude': event.lon} ;
        		event.marker_id = Date.now();
        	});
        	
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
