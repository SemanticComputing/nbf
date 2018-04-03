(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('placeService', placeService);

    /* @ngInject */
    function placeService($q, $location, _, AdvancedSparqlService,
    		FacetResultHandler, objectMapperService, SPARQL_ENDPOINT_URL) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getPlace = getPlace;
        
        this.getResults = getResults;
        
        
        /* Implementation */

        var prefixes =
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        	'PREFIX bioc:  <http://ldf.fi/schema/bioc/>  ' +
        	'PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#>  ' +
        	'PREFIX schema: <http://schema.org/>  ' +
        	'PREFIX skos:  <http://www.w3.org/2004/02/skos/core#>  ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>  ' +
        	'PREFIX	nbf:	<http://ldf.fi/nbf/>  ' +
        	'PREFIX	categories:	<http://ldf.fi/nbf/categories/>  ' +
        	'PREFIX	gvp:	<http://vocab.getty.edu/ontology#>	 ' +
        	'PREFIX crm:   <http://www.cidoc-crm.org/cidoc-crm/>  ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
        	'PREFIX dcterms: <http://purl.org/dc/terms/>  ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/>  ' +
        	'PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        	'PREFIX	relations:	<http://ldf.fi/nbf/relations/> ' +
        	'PREFIX	sources:	<http://ldf.fi/nbf/sources/> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query = prefixes +
        	' SELECT distinct ?id ?label ' +
            '  WHERE {' +
            '  	 { <RESULT_SET> } ' +
        	'   ?id a nbf:Place ; ' +
        	'   skos:prefLabel ?label .' +
        	'}';
            
       
        // The SPARQL endpoint URL
        var endpointUrl = SPARQL_ENDPOINT_URL;

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/Place>',
            preferredLang : 'fi'
        };
        
        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);
        
        function getPlace(id) {
        	var cons = 'VALUES ?id { <' + id + '> } . ',
        		q = query.replace("<RESULT_SET>", cons);
        	return endpoint.getObjectsNoGrouping(q) ;
        }
        
        
        function getResults(facetSelections) {
        	var promises = [
            	this.getPlace(facetSelections)
            ];
        	return $q.all(promises);
        }
        
        /**
        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }
		*/
    }
})();
