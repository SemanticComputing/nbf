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
                person.description = $sce.trustAsHtml(person.description);
                person.source_paragraph = $sce.trustAsHtml(person.source_paragraph);
                person.lead_paragraph = $sce.trustAsHtml(person.lead_paragraph);
                
                if (person.norssi) {
                	person.norssi = person.norssi.replace('http://ldf.fi/norssit/','')
                }
            });
            return objects;
        }
    }
})();
