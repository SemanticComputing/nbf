(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PlaceController', PlaceController);

    /* @ngInject */
    function PlaceController($state, $stateParams, $uibModal, _, $location, $scope,
    		placeService) {
    	
        var vm = this;
        
        function init() {
        	vm.isLoadingResults = true;
        	
        	var id = $stateParams.placeId,
    			regex = /^[^/]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/places/'+id; }
        	
        	placeService.getPlace(id).then(function(data) {
        		
        		vm.isLoadingResults = false;
        		vm.place = data[0];
        		
        		placeService.getHierarchy(id).then(function(data) {
        			if (data.length) { vm.related = data; }
        			setMap();
        		}).catch(handleError);
        		
        		placeService.getEvents(id).then(function(data) {
        			data.forEach(function (ob) {
        				vm[ob.class] = {people: ob.prslist, count: ob.count};
        			});
        		
        		}).catch(handleError);
        		
        		
        		
            }).catch(handleError);
        }
        
        init();
        
        vm.currentPage = 1;
        vm.numPerPage = 14;
        vm.maxSize = 5;
        
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
        	}
        	
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
	    							},
    							"onClick": function () {
        			        		$state.go('place',{ placeId: (ob.id).replace(/^.+?([^/]+)$/, '$1') });
        	        			}
	    	        			});
        			}
        		});
        		
        		$scope.$watch('vm.currentPage + numPerPage', function() {
                    var begin = ((vm.currentPage - 1) * vm.numPerPage)
                    , end = begin + vm.numPerPage;
                    vm.filteredRelated = vm.related.slice(begin, end);
                });
        		
        	}
        	
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
        /*
        // read url parameters:
        vm.readUrl = function() {
	        var lc = $location.search(),
	        	param = 'map';
	        
	        if (lc[param]) {
	        	try {
	                var map = angular.fromJson(lc[param]);
	                vm.map = map; 
	            }
	            catch(e) {
	            	$location.search(param, null);
	            }
	        }
        };
        */
    }
})();
