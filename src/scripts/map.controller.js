(function() {

    'use strict'; 
     angular.module('facetApp')

    /*
    * Controller for the person's timeline & map view.
    * api key: AIzaSyCS7M4hXwmBzV1FwE1p9lIDh1QSPhGqhUU
    */
    .controller('MapController', MapController);

    /* @ngInject */
    function MapController($stateParams, $uibModal, _, mapService) {

        var vm = this;
        
        vm.openPage = openPage;
        vm.map = { center: { latitude: 62, longitude: 24 }, zoom: 6 };
        
        //	evoked when timeline item is hovered
        vm.focusEvent = function(event) {
        	vm.currentEvent = event.label;
        	// if (event.place && event.place.latitude) vm.map.center = {'latitude': event.place.latitude, 'longitude': event.place.longitude };
        	event.options.icon.strokeWeight = 4;
        	event.options.zIndex += 100;
        	// event.options.animation = google.maps.Animation.BOUNCE;
        	setTimeout(function () {
        		event.options.animation=null;
            }, 1200);
        };
        
//    	evoked when timeline item is left
        vm.unfocusEvent = function(event) {
        	vm.currentEvent='.'
            event.options.zIndex -= 100;
        	// event.options.animation = null;
        	event.options.icon.strokeWeight = 1;
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
        		
        		return events;
            }).catch(handleError);
        }

        function processEvents(events) {
        	
        	var current_year = (new Date()).getFullYear(),
        		min_time=current_year, max_time=0,
        		has_death = false,
        		i=0;
        	
        	events.forEach( function(event) {
        		
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		event.y = 0;
        		event.r = 10;
        		
        		['start', 'end'].forEach( function(p) {
	        			if (event.time[p]) {
	        				
		        			//	convert "1928-06-19" to 1928.0 
		        			var year=parseInt(event.time[p].match(/^\d\d\d\d/g)[0]);
		        			
			        		if (max_time<year) max_time=year;
			        		if (year<min_time) min_time=year;
			        		
			        		event.time[p] = year;
			        		
			        		event[(p=='start' ? 'x0' : 'x1')] = year;
			        		
	        			}
	        		});
        		
        		
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
        		
        		if (!event.label) event.label="";
        		
        		switch(event.class) {
	        		case "death":
	        			has_death = true;
	        			// TODO: targetoi ensimmäiseen tapahtumaan, jos ei deathia ole
	        			event.label = 'Kuollut '+event.label;
	        			event.r = 15;
	        			break;
	        			
	        		case "birth":
	        			event.label = 'Syntynyt '+event.label;
	        			if (event.place && event.place.latitude) {
	                		vm.map.center = {'latitude': event.place.latitude, 'longitude': event.place.longitude };
	                	}
	        			event.r = 15;
	        			break;
	        		case "spouse":
	        			event.label = event.label+', '+event.time.label;
	        			break;
	        		case "child":
	        			event.label = event.label+', '+event.time.label;
	        			break;
	        		case 'career':
	        			event.y = 30;
	        			break;
	        		case 'product':
	        			event.y = 60;
	        			break;
	        		case 'honour':
	        			event.y = 90;
	        			break;
	        			
	        		default:
	        			console.log(event.class);
	        			event.class="event";
	        			break;
        		}
        		event.marker_id = ++i;
        		//	google.maps.SymbolPath.CIRCLE
        		event['options'] = {
        				icon:{
        					path:"M0 0 L -10,-10 A 14.142, 14.142, 315 ,1, 1, 10,-10 Z", // google.maps.SymbolPath.CIRCLE, 
        					scale:1.25, 
        					anchor: new google.maps.Point(0,0),
        					fillColor:ICONCOLORS[event.class],
        					fillOpacity:0.8,
        					strokeOpacity:1,
        					strokeWeight:1,
        					labelOrigin: new google.maps.Point(0, -20)
        					}, 
        				zIndex: event.marker_id,
        				optimized: false,
        				label: {
        			        text: ''+event.marker_id,
        			        fontSize: '14px',
        			        fontFamily: '"Courier New", Courier,Monospace',
        			        color: 'black'
        			      }
        				};
        		
        	});
        	
            
        	
        	if (!has_death) max_time += 15;
        	if (max_time<=min_time) max_time = min_time+75;
        	if (max_time>current_year) max_time = current_year;
        	
        	events.min_year = min_time;
        	events.max_year = max_time;
        	
        	var bounds = new google.maps.LatLngBounds();
        	
        	// scale the years to get a coordinate on the timeline:
        	var i=0;
        	events.forEach( function(event) {
        		
        		var rn = 5*Math.random();
        		event.x0 = 750.0*(event.x0-min_time)/(max_time-min_time) + rn;
        		event.x1 = 750.0*(event.x1-min_time)/(max_time-min_time) + rn;
        		
        		event.path = "M"+event.x0+","+(event.y-event.r)+"a "+event.r+" "+event.r+" 0 0 0 0 "+(2*event.r)+" H "+event.x1+" a "+event.r+" "+event.r+" 0 0 0 0 -"+(2*event.r)+" Z"
        		
        		if (event.place && event.place.latitude) {
        			event.coords = {'latitude': event.place.latitude, 'longitude': event.place.longitude} ;
        			bounds.extend(new google.maps.LatLng(event.place.latitude, event.place.longitude));
        		}
        		
        	});
        	
        	var map = document.getElementById('ui-gmap-google-map');
        	console.log(map);
        	console.log(bounds);
        	console.log(bounds.getCenter());
        	if (map && map.fitBounds) { map.fitBounds(bounds); }
        	return events;
        }
        
        function formMainline(vm) {
        	var x0 = vm.events.min_year,
        		x1 = vm.events.max_year,
        		arr=[];
        	for (var x=10*Math.ceil(x0/10); x<x1; x+=10) {
        		arr.push({'x1':750*(x-x0)/(x1-x0) , 'x2':750*(x-x0)/(x1-x0), 'y1':0, 'y2':90 });
        	}
        	for (var y=0; y<120; y+=30) {
        		arr.push({'x1':750*(x0-x0)/(x1-x0) , 'x2': 750*(x1-x0)/(x1-x0), 'y1':y, 'y2':y });
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
