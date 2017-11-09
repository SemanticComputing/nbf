(function() {
    'use strict';

    /*
    * Service for transforming SPARQL result triples into person objects.
    */
    angular.module('facetApp')

    .factory('eventMapperService', eventMapperService);

    /* ngInject */
    function eventMapperService($sce, _, objectMapperService) {
        EventMapper.prototype.postProcess = postProcess;
        
        var proto = Object.getPrototypeOf(objectMapperService);
        EventMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);
        
        return new EventMapper();

        function EventMapper() {
            this.objectClass = Object;
        }

        function postProcess(objects) {
            /*objects.forEach(function(person) {
                person.hasImage = !!person.images;
                person.images = person.images ? _.castArray(person.images) : ['images/person_placeholder.svg'];
                person.description = $sce.trustAsHtml(person.description);
                person.source_paragraph = $sce.trustAsHtml(person.source_paragraph);
                person.lead_paragraph = $sce.trustAsHtml(person.lead_paragraph);
                
                if (person.norssi) {
                	person.norssi = person.norssi.replace('http://ldf.fi/norssit/','')
                }
            });*/
            return objects;
        }
    }
})();
