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
        		/*
	        	setTimeout(function () {
	        		m.options.animation=null;
	            }, 1200); */
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
        		vm.viewBox = "1930,-10,120,27";
        		formMainline(vm);
        		return events;
            }).catch(handleError);
        }

        function processEvents(events, vm) {
        	
        	var current_year = (new Date()).getFullYear(),
        		has_death = false,
        		i=0;
        	
        	vm.min_time = current_year;
        	vm.max_time = 0;
        	
        	//	for counting all distinct place instances
        	var places = {};
        	
        	var bounds = new google.maps.LatLngBounds();
    		
        	events.forEach( function(event) {
        		if (event.place && event.place.uri) {
        			
        			//	convert these properties to arrays
        			['uri', 'latitude', 'longitude', 'name'].forEach( function(prop) { 
        				if (event.place[prop] && (event.place[prop].constructor !== Array)) {
            				event.place[prop] = [event.place[prop]];
            			}
        			} );
        			
        			
        			event.place.uri.forEach( function(key) {
	        			if (!places.hasOwnProperty(key)) {
	        				places[key]={count:0, latitude:event.place.latitude, longitude:event.place.longitude, type:event.class}
	            		}
	            		places[key]['count']+=1;
        			});
        		}
        	});
        	
        	var categories=[[],[],[],[]];
        	
        	// splits timespans to start and end years, collects the minimum and maximum values
        	events.forEach( function(event) {
        		
        		event.y = 0;
        		event.r = 1;
        		event.markers = [];
        		event.blobs = [];
        		
        		if (!(event.time.span.constructor === Array)){
        			event.time.span = [event.time.span];
        		}
        		event.time.span.forEach( function(time) {
        			
        			var years = time.split('-'),
        				blob = { };
        			
        			if (years[0] != "") {
        				years[0]=parseInt(years[0]);
        				if (years[0]<vm.min_time) vm.min_time=years[0];
        				if (vm.max_time<years[0]) vm.max_time=years[0];
        				blob.estStart = years[0];
        			}
        			if (years[1] != "") {
        				years[1]=parseInt(years[1]);
        				if (years[1]<vm.min_time) vm.min_time=years[1];
        				if (vm.max_time<years[1]) vm.max_time=years[1];
        				blob.estEnd = years[1];
        			}
        			event.blobs.push(blob);
	        	});
        		
        		
        		if (!event.label) event.label="";
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		
        		var category=0;
        		
        		switch(event.class) {
	        		case "death":
	        			has_death = true;
	        			event.label = 'Kuollut '+event.label;
	        			event.r = 1.50;
	        			break;
	        		
	        			// TODO: targetoi ensimmäiseen tapahtumaan, jos ei birth ole
	        		case "birth":
	        			event.label = 'Syntynyt '+event.label;
	        			if (event.place && event.place.latitude) {
	                		vm.map.center = {'latitude': event.place.latitude[0], 'longitude': event.place.longitude[0] };
	                	}
	        			event.r = 1.50;
	        			
	        			//	remove (in most cases erroneous) events before birth
	        			if (vm.min_time<event.blobs[0].estStart) {
	        				vm.min_time=event.blobs[0].estStart;
	        			}
	        			break;
	        		
	        		case "spouse":
	        		case "child":
	        			if (event.relative) {
	        				event.relativelink = event.relative;
	        			}
	        			event.label = event.label+', '+event.time.label;
	        			break;
	        		
	        		case 'career':
	        			event.y = 5;
	        			category = 1;
	        			break;
	        		
	        		case 'product':
	        			event.y = 10;
	        			category = 2;
	        			break;
	        		
	        		case 'honour':
	        			event.y = 15;
	        			category = 3;
	        			break;
	        		
	        		default:
	        			event.y = 5;
	        			event.class="event";
	        			category = 1;
	        			break;
        		}
        		categories[category].push(event);
        		
        		event.id = ++i;
        		
        		if (event.place && event.place.latitude) {
        			for (var j=0; j<event.place.latitude.length; j++) {
    					var r = event.place.uri[j] && places[event.place.uri[j]] && places[event.place.uri[j]]['count'] ? 
    							15.*Math.sqrt(places[event.place.uri[j]]['count']): 
    							15.0 ;
            			var m = generateMarker(event.place.latitude[j], 
            					event.place.longitude[j], 
            					event.id, 
            					event.class, 
            					r, 
            					event.place.name[j],
            					event.place.uri[j]);
    					event.markers.push(m);
    					vm.markers.push(m);
    					bounds.extend({lat: parseInt(event.place.latitude[j]), lng: parseInt(event.place.longitude[j])});
    				}
        		}
        	});
        	
        	//	relocate the events that otherwise would get covered by other events
        	categories.forEach( function (category) {
        		analyzeCategory(category).forEach( function(i) {
        			category[i].y += 2.5;
        		});
        	});
        	
        	if (!has_death) vm.max_time += 15;
        	if (vm.max_time<=vm.min_time) vm.max_time = vm.min_time+75;
        	if (vm.max_time>vm.min_time+150) vm.max_time = vm.min_time+150;
        	if (vm.max_time>current_year) vm.max_time = current_year;
        	
        	
        	// scale the years to get a coordinate on the timeline:
        	// var i=0;
        	events.forEach( function(event) {
        		event.path = "";
        		var rn = 0.1*Math.random();
        		event.blobs.forEach( function(blob) {
	        		//	blobs that are shown on timeline
	        		var x0 = blob.estStart ? scale2Timeline(blob.estStart,vm.min_time,vm.max_time)+rn : undefined,
	        			x1 = blob.estEnd ? scale2Timeline(blob.estEnd,vm.min_time,vm.max_time)+rn : undefined;
	        		
	        		if (!x0) {
	        			//	missing start year
	        			x0 = x1-3;
	        			event.path += "M"+x0+","+(event.y+event.r)+
	        						" H"+x1+
	        						" a"+event.r+","+event.r+",0,0,0,0,-"+(2*event.r)+
	        						" H"+x0;
	            	} else if (!x1) {
	        			//	missing end year
	        			x1 = x0+3;
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
	        		
        		});
        		event.blobs = [];
        	});
        	
        	
        	if (vm.markers.length<1) {
        		//	no markers on the map
        		vm.map = { center: { latitude: 64, longitude: 18 }, zoom: 4 };
        	} else {
        		try {
	        			
		        	//	check the bounds on the map
	        		var ne = bounds.getNorthEast(),
		        		sw = bounds.getSouthWest(),
		        		z = Math.max(ne.lat() - sw.lat(), 2*(ne.lng() - sw.lng())), 
		        		zoom = 2;
	        		
		        	if(z<75) zoom = 5;
		        	else if(z<100) zoom = 4;
		        	else if(z<125) zoom = 3;
		        	else zoom = 2;
		        	vm.map = { center: {latitude: bounds.getCenter().lat(), longitude: bounds.getCenter().lng() },
		        				zoom: zoom };
		        	
        		}
        		catch(error) {
        			vm.map = { center: { latitude: 64, longitude: 18 }, zoom: 4 };
        		}
        	}
        	
        	
        	return events;
        }
        
        
        var MARKERID = 1;
        function generateMarker(lat, lon, id, type, r, locname, uri) {
        	if (!r) r=15.0;
        	var ICONCOLORS = {
    				death:	"#ff4141",
    				birth:	"#777fff",
    				spouse:	"#c3b981",
    				child:	"#7f6780",
    				career:	"#999999",
    				product:"#83d236",
    				honour:	"#ce5c00",
    				event:	"#999999"
    		};
        	
        	var m = {
        			uri: uri,
        			latitude: lat,
        			longitude: lon,
        			id: MARKERID++,

        			options: {
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
	        			title: locname,
						optimized: false,
						label: {
					        text: ''+id,
					        fontSize: '14px',
					        fontFamily: '"Courier New",Courier,Monospace',
					        color: 'black'
					      }
						}
        	};
        	return m;
        }
        
        function formMainline(vm) {
        	var x0 = vm.min_time,
        		x1 = vm.max_time,
        		arr = [],
        		texts = [{'x': -2.5 , 'y':0, 'content': 'Elinkaari'},
        			{'x': -2.5 , 'y':5, 'content': 'Ura'},
        			{'x': -2.5 , 'y':10, 'content': 'Teokset'},
        			{'x': -2.5 , 'y':15, 'content': 'Kunniamaininnat'}];

        	//	vertical lines every ten years
        	for (var x = 10*Math.ceil(x0/10); x<x1; x+=10) {
        		var xx = scale2Timeline(x,x0,x1)
        		
        		arr.push({'x1': xx , 'x2': xx, 'y1': 0, 'y2': 15 });
        		texts.push({'x': xx+1 , 'y':-2, 'content': ''+x});
        	}
        	//  horizontal lines
        	for (var y=0; y<20; y+=5) {
        		arr.push({'x1': scale2Timeline(x0,x0,x1) , 'x2': scale2Timeline(x1,x0,x1), 'y1': y, 'y2': y });
        	}
        	vm.mainline = {lines: arr, texts: texts };
        }
        
        function scale2Timeline(time,x0,x1) {
        	return time-x0;
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
        
        /**	find the events that get covered by another event */
        function analyzeCategory(category) {
        	var checktable = {},
        		N = category.length;
        	for (var i=0; i<N; i++) {
        		category[i].blobs.forEach( function(blob) {
        			var x0 = blob.estStart ? blob.estStart : blob.estEnd-3,
        				x1 = blob.estEnd ? blob.estEnd : x0+3;
        			
        			for (var j=x0; j<=x1; j++) {
        				checktable[j]=i;
        			}
        		});
        	}
        	//	mark all false
        	var arr = Array(N).fill(false);
        	//	set visible ones to true
        	for(var year in checktable){
        	    arr[checktable[year]]=true;
        	}
        	//	find the hidden ones with value remaining false
        	var arr2=[];
        	for (var i=0; i<N; i++) if (!arr[i]) arr2.push(i);
        	
        	return arr2;
        }
        
    }
})();
