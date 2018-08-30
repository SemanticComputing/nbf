(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('biographyService', biographyService);

    /* @ngInject */
    function biographyService($q, $sce, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the details of a single bio.
        this.getBio = getBio;
        
        /* Implementation */

        var prefixes =
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX sources:	<http://ldf.fi/nbf/sources/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
        ' PREFIX categories:	<http://ldf.fi/nbf/categories/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
            '  OPTIONAL { ?bio dct:source ?source . ?source skos:prefLabel ?database }' +
            '  OPTIONAL { ?bio nbf:authors ?author_text }' +
            '  OPTIONAL { ?bio schema:dateCreated ?created }' +
            '  OPTIONAL { ?bio schema:dateModified ?modified }' +
            '  OPTIONAL { ?bio schema:relatedLink ?link }'  +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "0"^^xsd:integer ; nbf:content ?lead_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "1"^^xsd:integer ; nbf:content ?description    ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "2"^^xsd:integer ; nbf:content ?family_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "3"^^xsd:integer ; nbf:content ?parent_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "4"^^xsd:integer ; nbf:content ?spouse_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "5"^^xsd:integer ; nbf:content ?child_paragraph  ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "6"^^xsd:integer ; nbf:content ?medal_paragraph  ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' +
            '} ORDER BY str(?source)';


        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };
        
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);
        
        function getBio(id) {
            var qry = prefixes + query;
            var constraint = 'VALUES ?bio { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(data) {
            	
            	var bio = data[0];
	        	
	        	if (bio.description) bio.description = $sce.trustAsHtml(bio.description);
                if (bio.source_paragraph) bio.source_paragraph = $sce.trustAsHtml(bio.source_paragraph);
                if (bio.lead_paragraph) bio.lead_paragraph = $sce.trustAsHtml(bio.lead_paragraph);
                
                return bio;
            });
        }
        /*
        function updateSortBy(sortBy) {
            var sort = $location.search().sortBy || '?ordinal';
            if (sort === sortBy) {
                $location.search('desc', $location.search().desc ? null : true);
            }
            $location.search('sortBy', sortBy);
        }
        */
    }
})();