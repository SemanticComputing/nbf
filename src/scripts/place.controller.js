(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('PlaceController', PlaceController);

    /* @ngInject */
    function PlaceController($stateParams, $uibModal, _, placeService) {
    	
        var vm = this;
        
        vm.openPage = openPage;
        
        
        function init() {
        	placeService.getPlace($stateParams.placeId).then(function(data) {
        		console.log(data);
        		vm.place = data[0];
                return vm.place;
            }).catch(handleError);
        }
        
        init();
        
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
    }
})();
