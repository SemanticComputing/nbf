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
                
            	person.id = (person.id).replace(/^.+?(p[0-9]+)$/, '$1');
            	
            	person.birth = person.birth ? _.castArray(person.birth) : null;
            	person.death = person.death ? _.castArray(person.death) : null;
            	
                person.images = person.images ? 
                		_.castArray(person.images) : 
                			['images/person_placeholder.svg'];
                person.imagesources = person.imagesources ? _.castArray(person.imagesources) : [ false ];
                
                if (person.description) person.description = $sce.trustAsHtml(person.description);
                if (person.source_paragraph) person.source_paragraph = $sce.trustAsHtml(person.source_paragraph);
                if (person.lead_paragraph) person.lead_paragraph = $sce.trustAsHtml(person.lead_paragraph);
                
                if (person.norssi) {
                	person.norssi = person.norssi.replace('http://ldf.fi/norssit/','')
                }
                
                if (person.kirjasampo) {
                	person.kirjasampo = person.kirjasampo.replace('http://','https://')
                }
                
                if (person.ulan) {
                	//	http://vocab.getty.edu/ulan/500108094
                	//	http://vocab.getty.edu/page/ulan/500108094
                	person.ulan = person.ulan.replace('vocab.getty.edu/ulan/','vocab.getty.edu/page/ulan/')
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
                
                if (!person.givenName) {
                	person.givenName = "";
                }
                if (!person.familyName) {
                	person.familyName = "";
                }
                
                //	join the names of couples ["Heikki", "Kaija"] - > "Heikki ja Kaija"
                if (person.givenName.constructor === Array && person.givenName.length==2) {
                	person.givenName = person.givenName[0] +' ja '+person.givenName[1];
                }
                
                person.hasExtLinks = ( person.viaf || person.ulan || person.wikidata || person.wikipedia || person.fennica || person.blf || person.website || person.eduskunta || person.warsampo || person.norssi || person.kirjasampo || person.website || person.genicom || person.genitree || person.yo1853 ) ;
            });
            
            return objects;
        }
    }
})();
