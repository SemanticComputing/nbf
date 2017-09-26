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
        vm.markers = [];
        
        //	evoked when timeline item is hovered
        vm.focusEvent = function(event) {
        	vm.currentEvent = event.label;
        	event.markers.forEach( function(m) {
        		m.options.icon.strokeWeight = 4;
        		m.options.zIndex += 100;
        		
	        	setTimeout(function () {
	        		m.options.animation=null;
	            }, 1200);
        	});
        };
        
//    	evoked when timeline item is left
        vm.unfocusEvent = function(event) {
        	vm.currentEvent='.'
    		event.markers.forEach( function(m) {
        		m.options.icon.strokeWeight = 1;
        		m.options.zIndex -= 100;
        		
        	});
        };
        
        init();

        function init() {
        	
        	mapService.getEvents($stateParams.personId).then(function(events) {
        		vm.currentEvent = ".";
        		vm.events = events;
        		if (events.length) {
        			vm.person = events[0];
        			}
        			vm.events = processEvents(events, vm);
        			formMainline(vm);
        		
        		return events;
            }).catch(handleError);
        }

        function processEvents(events, vm) {
        	
        	var current_year = (new Date()).getFullYear(),
        		min_time=current_year, max_time=0,
        		has_death = false,
        		i=0;
        	
        	events.forEach( function(event) {
        		
        		event.y = 0;
        		event.r = 10;
        		event.markers = [];
        		
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
        		
        		if (!event.label) event.label="";
        		
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		
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
        		
        		event.id = ++i;
        		
        		if (event.place && event.place.latitude) {
        			if (event.place.latitude.constructor === Array) { 
        				// var arr = [];
        				for (var j=0; j<event.place.latitude.length; j++) {
        					var m = generateMarker(event.place.latitude[j], event.place.longitude[j], event.id, event.class);
        					event.markers.push(m);
        					vm.markers.push(m);
        					// bounds.extend(new google.maps.LatLng(event.place.latitude[j], event.place.longitude[j]));
        				}
            		} else {
            			var m = generateMarker(event.place.latitude, event.place.longitude, event.id, event.class);
            			event.markers = [m] ;
	        			vm.markers.push(m);
	        			//bounds.extend(new google.maps.LatLng(event.place.latitude, event.place.longitude));
            		}
        		}
        		
        		
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
        		
        		
        	});
        	
        	var map = document.getElementById('ui-gmap-google-map');
        	// console.log(map);
        	// console.log(bounds);
        	// console.log(bounds.getCenter());
        	if (map && map.fitBounds) { map.fitBounds(bounds); }
        	
        	console.log(vm.markers);
        	return events;
        }
        
        
        var MARKERID = 1;
        function generateMarker(lat, lon, id, type) {
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
        			latitude: lat,
        			longitude: lon,
        			id: MARKERID++,
        			options: {
	        			icon:{
	        				path:"M0 0 L -10,-10 A 14.142, 14.142, 315 ,1, 1, 10,-10 Z", // google.maps.SymbolPath.CIRCLE, 
							scale: 1.25, 
							anchor: new google.maps.Point(0,0),
							fillColor: ICONCOLORS[type],
							fillOpacity: 0.8,
							strokeOpacity: 1,
							strokeWeight: 1,
							labelOrigin: new google.maps.Point(0, -20)
							},
						zIndex: id,
						optimized: false,
						label: {
					        text: ''+id,
					        fontSize: '14px',
					        fontFamily: '"Courier New", Courier,Monospace',
					        color: 'black'
					      }
						}
        	};
        	return m;
        }
        
        function formMainline(vm) {
        	var x0 = vm.events.min_year,
        		x1 = vm.events.max_year,
        		arr = [],
        		texts = [];
        	
        	//	horizontal lines every ten years
        	for (var x=10*Math.ceil(x0/10); x<x1; x+=10) {
        		arr.push({'x1': 750*(x-x0)/(x1-x0) , 'x2': 750*(x-x0)/(x1-x0), 'y1': 0, 'y2': 90 });
        		texts.push({'x': 750*(x-x0)/(x1-x0) , 'y':-20, 'year': ''+x});
        	}
        	//  vertical lines
        	for (var y=0; y<120; y+=30) {
        		arr.push({'x1': 750*(x0-x0)/(x1-x0) , 'x2': 750*(x1-x0)/(x1-x0), 'y1': y, 'y2': y });
        	}
        	vm.mainline = {lines: arr, texts: texts };
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
