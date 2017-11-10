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
        	vm.currentEvent = event.id + ": " + event.label;
        	event.markers.forEach( function(m) {
        		m.options.icon.strokeWeight = 4;
        		m.options.zIndex += 100;
        		
	        	setTimeout(function () {
	        		m.options.animation=null;
	            }, 1200);
        	});
        };
        
        //  evoked when timeline item is left
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
        	var places = {};
        	
        	events.forEach( function(event) {
        		if (event.place && event.place.uri) {
        			var keys = event.place.uri;
        			if (!(keys.constructor === Array)) keys = [keys];
        			
        			keys.forEach( function(key) {
	        			if (!places.hasOwnProperty(key)) {
	        				places[key]={count:0, latitude:event.place.latitude, longitude:event.place.longitude, type:event.class}
	            		}
	            		places[key]['count']+=1;
        			});
        		}
        	});
        	
        	events.forEach( function(event) {
        		
        		event.y = 0;
        		event.r = 7;
        		event.markers = [];
        		event.blobs = [];
        		
        		if (!(event.time.span.constructor === Array)){
        			event.time.span = [event.time.span];
        		}
        		event.time.span.forEach( function(time) {
        			var years = time.split('-'),
        				blob = { event:event };
        			
        			if (years[0] != "") {
        				years[0]=parseInt(years[0]);
        				if (years[0]<min_time) min_time=years[0];
        				if (max_time<years[0]) max_time=years[0];
        				blob.estStart = years[0];
        			}
        			if (years[1] != "") {
        				years[1]=parseInt(years[1]);
        				if (years[1]<min_time) min_time=years[1];
        				if (max_time<years[1]) max_time=years[1];
        				blob.estEnd = years[1];
        			}
        			event.blobs.push(blob);
	        	});
        		
        		
        		if (!event.label) event.label="";
        		
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		
        		switch(event.class) {
	        		case "death":
	        			has_death = true;
	        			event.label = 'Kuollut '+event.label;
	        			event.r = 10;
	        			break;
	        		
	        			// TODO: targetoi ensimmäiseen tapahtumaan, jos ei birth ole
	        		case "birth":
	        			event.label = 'Syntynyt '+event.label;
	        			if (event.place && event.place.latitude) {
	                		vm.map.center = {'latitude': event.place.latitude, 'longitude': event.place.longitude };
	                	}
	        			event.r = 10;
	        			break;
	        		
	        		case "spouse":
	        		case "child":
	        			if (event.relative) {
	        				event.relativelink = "http://localhost:9000/#!/"+event.relative.replace(/[/]/g, '~2F');
	        			}
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
	        			event.y = 90;
	        			event.class="event";
	        			break;
        		}
        		
        		
        		event.id = ++i;
        		
        		if (event.place && event.place.latitude) {
        			if (event.place.latitude.constructor === Array) { 
        				for (var j=0; j<event.place.latitude.length; j++) {
        					var r = event.place.uri[j] && places[event.place.uri[j]] && places[event.place.uri[j]]['count'] ? 15.*Math.sqrt(places[event.place.uri[j]]['count']): 15.0 ;
                			var m = generateMarker(event.place.latitude[j], event.place.longitude[j], event.id, event.class, r);
        					event.markers.push(m);
        					vm.markers.push(m);
        					// bounds.extend(new google.maps.LatLng(event.place.latitude[j], event.place.longitude[j]));
        				}
            		} else {
            			var r = places[event.place.uri] && places[event.place.uri]['count'] ? 15.*Math.sqrt(places[event.place.uri]['count']): 15.0 ;
            			var m = generateMarker(event.place.latitude, event.place.longitude, event.id, event.class, r);
            			event.markers = [m] ;
	        			vm.markers.push(m);
	        			//bounds.extend(new google.maps.LatLng(event.place.latitude, event.place.longitude));
            		}
        		}
        	});
        	
            
        	if (!has_death) max_time += 15;
        	if (max_time<=min_time) max_time = min_time+75;
        	if (max_time>min_time+150) max_time = min_time+150;
        	if (max_time>current_year) max_time = current_year;
        	events.min_year = min_time;
        	events.max_year = max_time;
        	
        	var bounds = new google.maps.LatLngBounds();
        	
        	// scale the years to get a coordinate on the timeline:
        	var i=0;
        	vm.blobs = [];
        	events.forEach( function(event) {
        		event.path = "";
        		var rn = 5*Math.random();
        		event.blobs.forEach( function(blob) {
	        		//	blobs that shown on timeline
	        		var x0 = blob.estStart ? scale2Timeline(blob.estStart,min_time,max_time)+rn : 0,
	        			x1 = blob.estEnd ? scale2Timeline(blob.estEnd,min_time,max_time)+rn : 0;
	        		
	        		if (!x0) {
	        			//	missing start year
	        			x0 = x1-20;
	        			event.path += "M"+x0+","+(event.y+event.r)+
	        						" H"+x1+
	        						" a"+event.r+","+event.r+",0,0,0,0,-"+(2*event.r)+
	        						" H"+x0;
	            	} else if (!x1) {
	        			//	missing end year
	        			x1 = x0+20;
	        			event.path += "M"+x1+","+(event.y-event.r)+
	        						" H"+x0+
	        						" a"+event.r+","+event.r+",0,0,0,0,"+(2*event.r)+
	        						" H"+x1;
	            	} else {
	        			//	both known
	            		event.path += "M"+x0+","+(event.y-event.r)+
	        					" a"+event.r+","+event.r+",0,0,0,0,"+(2*event.r)+
	        					" H"+x1+
	        					" a"+event.r+","+event.r+",0,0,0,0,-"+(2*event.r)+
	        					" Z";
	        		}
	        		
	        		vm.blobs.push(blob);
        		});
        		event.blobs = [];
        	});
        	console.log(vm.blobs);
        	var map = document.getElementById('ui-gmap-google-map');
        	if (map && map.fitBounds) { map.fitBounds(bounds); }
        	
        	return events;
        }
        
        
        var MARKERID = 1;
        function generateMarker(lat, lon, id, type, r) {
        	if (!r) r=15.0;
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
        			"id": MARKERID++,
        			"options": {
        				icon:{
	        				path:"M-"+r+" 0 A "+r+","+r+", 0 ,1, 1,"+r+",0 A"+r+","+r+",0,1,1,-"+r+",0 Z",
							scale: 1.0,
							anchor: new google.maps.Point(0,0),
							fillColor: ICONCOLORS[type],
							fillOpacity: 0.6,
							strokeOpacity: 0.5,
							strokeWeight: 1,
							labelOrigin: new google.maps.Point(0, 0)
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
        	for (var x = 10*Math.ceil(x0/10); x<x1; x+=10) {
        		var xx = scale2Timeline(x,x0,x1)
        		arr.push({'x1': xx , 'x2': xx, 'y1': 0, 'y2': 90 });
        		texts.push({'x': xx , 'y':-20, 'year': ''+x});
        	}
        	//  vertical lines
        	for (var y=0; y<120; y+=30) {
        		arr.push({'x1': scale2Timeline(x0,x0,x1) , 'x2': scale2Timeline(x1,x0,x1), 'y1': y, 'y2': y });
        	}
        	vm.mainline = {lines: arr, texts: texts };
        }
        
        function scale2Timeline(time,x0,x1) {
        	return 750.0*(time-x0)/(x1-x0);
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
