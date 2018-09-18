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
        this.getResults = getResults;
        // this.getFacets = getFacets;
        this.getFacets = mapfacetService.getFacets;
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
    	'  { <RESULT_SET> } ' +
    	'  ?id a nbf:Place ; ' +
    	'      skos:prefLabel ?label . ' +
    	'  FILTER (lang(?label)="fi") ' +
    	'  OPTIONAL { ?id owl:sameAs ?link } ' +
    	'  OPTIONAL { ?id geo:lat ?coord__lat } ' +
    	'  OPTIONAL { ?id geo:long ?coord__long } ' +
    	'  OPTIONAL { ?id skos:altLabel ?alabel } ' +
    	'  OPTIONAL { ?id nbf:yso ?yso } ' +
    	'  OPTIONAL { ?id nbf:wikidata ?wikidata } ' +
    	'  OPTIONAL { ?id skos:broader ?broad } ' +
    	'  OPTIONAL { ?narrow skos:broader ?id } ' +
    	'} ';
        
        // The query for the results.
        var queryEvents = 
        ' SELECT distinct ?id ?label ?prs__event ?prs__eventLabel ?prs__id ?prs__label ' +
    	' WHERE { ' +
    	'   { <RESULT_SET> } ' +
    	'   ?id a nbf:Place ; ' +
    	'       skos:prefLabel ?label . FILTER (lang(?label)="fi") ' +
    	'   { OPTIONAL { ?prs__id foaf:focus/^crm:P98_brought_into_life [ nbf:place ?id ; a ?prs__event ] } ' +
    	'   } UNION { ' +
    	'   OPTIONAL { ?prs__id foaf:focus/^crm:P100_was_death_of [ nbf:place ?id ; a ?prs__event ] } ' +
    	'   } UNION { ' +
    	'    OPTIONAL { ?prs__id foaf:focus/^bioc:inheres_in  [ nbf:place ?id ; a ?prs__event ; skos:prefLabel ?prs__eventLabel ] } ' +
    	'   } ' +
    	'   ?prs__id skosxl:prefLabel ?prs__lab . ' +
    	'     OPTIONAL { ?prs__lab schema:familyName ?prs__fname } ' +
    	'     OPTIONAL { ?prs__lab schema:givenName ?prs__gname } ' +
    	'     BIND (CONCAT(COALESCE(?prs__gname, "")," ",COALESCE(?prs__fname, "")) AS ?prs__label ) ' +
    	' } ';
       
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
        		q = prefixes + query.replace("<RESULT_SET>", cons);
        	var res = endpoint.getObjectsNoGrouping(q);
        	return res ;
        	
        }
        
        function getEvents(id) {
        	var cons = 'VALUES ?id { <' + id + '> } . ',
        		q = queryEvents.replace("<RESULT_SET>", cons);
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
