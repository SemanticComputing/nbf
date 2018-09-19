(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('placeService', placeService);

    /* @ngInject */
    function placeService($q, $location, _, AdvancedSparqlService,
    		FacetResultHandler, objectMapperService, mapfacetService, 
    		SPARQL_ENDPOINT_URL) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getPlace = getPlace;
        this.getHierarchy = getHierarchy;
        this.getEvents = getEvents;
        this.getResults = getResults;
        this.getFacets = mapfacetService.getFacets;
        this.getFacetOptions = getFacetOptions;
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
        	'PREFIX	nbf: <http://ldf.fi/nbf/>  ' +
        	'PREFIX	categories:	<http://ldf.fi/nbf/categories/>  ' +
        	'PREFIX	gvp: <http://vocab.getty.edu/ontology#>	 ' +
        	'PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>  ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
        	'PREFIX dcterms: <http://purl.org/dc/terms/>  ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/>  ' +
        	'PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        	'PREFIX	relations: <http://ldf.fi/nbf/relations/> ' +
        	'PREFIX	sources: <http://ldf.fi/nbf/sources/> ' +
        	'PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        	'PREFIX owl: <http://www.w3.org/2002/07/owl#> ';
     
     
     // The query for the results.
        var query = 
    	'SELECT distinct * ' +
    	'WHERE { ' +
    	'  VALUES ?id { <RESULT_SET> } ' +
    	'  ?id a nbf:Place ; ' +
    	'      skos:prefLabel ?label . ' +
    	'  FILTER (lang(?label)="fi") ' +
    	'  OPTIONAL { ?id owl:sameAs ?googleapi . '+
    	'	FILTER (REGEX(str(?googleapi),"googleapis")) ' + // googleapis.com/maps/api/geocode/json?address=Pietari"
    	'  } ' +
    	'  OPTIONAL { ?id geo:lat ?lat ; geo:long ?lng } ' +
    	'  OPTIONAL { ?id skos:prefLabel|skos:altLabel ?alabel } ' +
    	'  OPTIONAL { ?id nbf:yso ?yso } ' +
    	'  OPTIONAL { ?id nbf:wikidata ?wikidata } ' +
    	//'  OPTIONAL { ?id skos:broader ?broad } ' +
    	//'  OPTIONAL { ?narrow skos:broader ?id } ' +
    	'} ';
        
        var queryHierarchy =
        	'SELECT distinct ?id ?level ?label ?lat ?lng ' +
        	'WHERE { ' +
        	'VALUES ?place { <RESULT_SET> } ' +
        	'  { ?place skos:broader+ ?id . ' +
        	'    BIND(1 AS ?level) ' +
        	'  } ' +
        	'  UNION ' +
        	'  { ?id skos:broader ?place . ' +
        	'   BIND(-1 AS ?level) ' +
        	'  	FILTER EXISTS { [] nbf:place ?id } ' +
        	'  } ' +
        	'  FILTER NOT EXISTS { ?id owl:sameAs/a nbf:Place } ' +
        	'  OPTIONAL { ?id geo:lat ?lat ; geo:long ?lng } ' +
        	'  ?id skos:prefLabel ?label ' +
        	'  FILTER (lang(?label)="fi") ' +
        	'} ORDER BY DESC(?level) ?label ';
        
        // The query for the results.
        var queryEvents = 
        	'SELECT DISTINCT ?class (GROUP_CONCAT(DISTINCT(?prs); separator=",") as ?prslist) (COUNT(DISTINCT ?prs) AS ?count) WHERE { ' +
        	'  VALUES ?id { <RESULT_SET> } ' +
        	'  ?evt nbf:place ?id ; ' +
        	'       (crm:P100_was_death_of|crm:P98_brought_into_life|bioc:inheres_in)/^foaf:focus ?prs ; ' +
        	// '       crm:P98_brought_into_life/^foaf:focus ?prs ; ' +
        	'       a/skos:prefLabel ?class . ' +
        	'  FILTER (lang(?class)="en") ' +
        	'} GROUP BY ?class ';
       
        // The SPARQL endpoint URL
        var endpointUrl = SPARQL_ENDPOINT_URL;

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/Place>',
            preferredLang : 'fi'
        };
        
        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);
        
        function getPlace(id) {
        	var q = prefixes + query.replace("RESULT_SET", id);
        	return endpoint.getObjects(q);
        }
        
        function getHierarchy(id) {
        	var q = prefixes + queryHierarchy.replace("RESULT_SET", id);
	    	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getEvents(id) {
        	var q = prefixes + queryEvents.replace("RESULT_SET", id);
        	return endpoint.getObjectsNoGrouping(q) ;
        }
        
        
        function getResults(facetSelections) {
        	var promises = [
            	this.getPlace(facetSelections)
            ];
        	return $q.all(promises);
        }
        
        
        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }
		
    }
})();
