(function() {
    'use strict';

    /*
    * Service for transforming SPARQL result triples into person objects.
    */
    angular.module('facetApp')

    .factory('personMapperService', personMapperService);

    /* ngInject */
    function personMapperService($sce, _, objectMapperService) {
        PersonMapper.prototype.postProcess = postProcess;

        var proto = Object.getPrototypeOf(objectMapperService);
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);

        return new PersonMapper();

        function PersonMapper() {
            this.objectClass = Object;
        }
        
        function postProcess(objects) {
            objects.forEach(function(person) {
                person.hasImage = !!person.images;
                person.images = person.images ? _.castArray(person.images) : ['images/person_placeholder.svg'];
                if (person.description) {
                	person.description = $sce.trustAsHtml(person.description);
                	console.log(person.description);
                }
                if (person.source_paragraph) person.source_paragraph = $sce.trustAsHtml(person.source_paragraph);
                if (person.lead_paragraph) person.lead_paragraph = $sce.trustAsHtml(person.lead_paragraph);
                
                if (person.norssi) {
                	person.norssi = person.norssi
                		.replace('http://ldf.fi/norssit/','')
                }
                
                
                if (person.fennica) {
                	// couples might have several fennica links:
                	if (person.fennica.constructor !== Array) {
                		person.fennica = [person.fennica];
                	}
                	for (var i=0; i<person.fennica.length; i++) {
                		/**	convert format 
                         * http://urn.fi/URN:NBN:fi:au:pn:000103310
                         * into
                         * http://data.nationallibrary.fi/au/pn/000103310
                        */
                		person.fennica[i] = 'http://data.nationallibrary.fi/'+
                			person.fennica[i].replace('http://urn.fi/URN:NBN:fi:', '')
                				.replace(/:/g,'/');
                	}
                }
                //	join the names of couples ["Heikki", "Kaija"] -> "Heikki ja Kaija"
                if (person.givenName.constructor === Array && person.givenName.length==2) {
                	person.givenName = person.givenName[0] +' ja '+person.givenName[1];
                }
            });
            return objects;
        }
    }
})();
