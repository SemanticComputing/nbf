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
        
        vm.showWindow = function() {
        	vm.window.show = true;
        }
        vm.closeWindow = function() {
        	vm.window.show = false;
        }
        
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.getSortClass = groupmapService.getSortClass;
        
        
        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initSlider(config);
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

        // TODO: extract slider

        function initSlider(config) {
            var min = parseInt(_.get(config, 'facets.slider.value.min')) || 1000;
            var max = parseInt(_.get(config, 'facets.slider.value.max')) || (new Date()).getFullYear()-50;
            // Range slider config
            $scope.minRangeSlider = {
                minValue: min,
                maxValue: max,
                options: {
                    floor: 1000,
                    ceil: (new Date()).getFullYear(),
                    step: 10,
                    draggableRange: true,
                    onEnd: updateSlider
                }
            };
            updateSlider();
        }

        function updateSlider() {
            var min = $scope.minRangeSlider.minValue;
            var max = $scope.minRangeSlider.maxValue;
            var constraint =
            '?id <http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/' +
            '<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart> ?time__birth . ' +
            'FILTER (<STARTYEAR><=year(?time__birth) && year(?time__birth)<=<ENDYEAR>) '
                .replace('<STARTYEAR>', min)
                .replace('<ENDYEAR>', max);
            var args = {
                id: 'slider',
                value: { min: min, max: max },
                constraint: constraint
            };
            $scope.$emit(EVENT_FACET_CHANGED, args);
        }

        function openPage(person) {
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
            //vm.people = [];
            vm.error = undefined;
            
            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return groupmapService.getResults(facetSelections)
            .then(function(res) {
            	vm.events = processEvents(res, vm);
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
        
        function processEvents(events, vm) {
        	var places = {};
        	
        	events.forEach( function(event) {
        		
        		if (!event.class) event.class = "event";
        		event.class = event.class.toLowerCase();
        		
        		//	count by place uris
        		var key=event.class+event.place.uri;
        		if (!places.hasOwnProperty(key)) {
        			places[key]={count:0, 
        					latitude:event.place.latitude, 
        					longitude:event.place.longitude, 
        					label:	event.place.label,
        					type:	event.class,
        					people: {}}
        		}
        		places[key]['count']+=1;
        		places[key]['people'][event.id]= event.person.name;
        	});
        	
        	
        	vm.markers = [];
        	var i = 0;
        	
        	for (var x in places) {
        		var place=places[x];
        		var m = generateMarker(vm, place.latitude, 
        				place.longitude, 
        				++i,
        				place.type, 
        				place.count,
        				place.label,
        				place.people);
        		vm.markers.push(m);
        	}
        	//	sort the the largest gets drawn first
        	vm.markers.sort(function(a, b){return b.count - a.count});
        	
        	var bounds = new google.maps.LatLngBounds();
        	
        	// scale the years to get a coordinate on the timeline:
        	
        	var map = document.getElementById('ui-gmap-google-map');
        	if (map && map.fitBounds) { map.fitBounds(bounds); }
        	
        	return events;
        }
        
        
        function generateMarker(vm, lat, lon, id, type, count, label, people) {
        	var r = 5.0*Math.sqrt(count);
        	// if (!r) r=5.0;
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
        			"count": count,
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
						optimized: true,
						},
	        		"onClick": function () {
	        			
	        			vm.place_label = label;
	        			if (type=="death") vm.place_label += ", kuolleet";
	        			else if (type=="birth") vm.place_label += ", syntyneet";
	        			
	        			var arr = [];
	        			for (var p in people) {
	        				arr.push({uri:p, label:people[p]})
	        			}
	        			vm.people = arr;
	        			
	        			vm.window.position.lat = parseInt(lat);
	        			vm.window.position.lng = parseInt(lon);
	        			vm.showWindow();
	        			
	        			$scope.$apply();
        		}
        	};
        	return m;
        }
        
    }
})();
