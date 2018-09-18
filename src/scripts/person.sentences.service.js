(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('personNetworkService', personNetworkService);

    /* @ngInject */
    function personNetworkService($q, $location, _, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getLinks = getLinks;
        this.getNodes = getNodes;
        
        /* Implementation */

        var prefixes =
        	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        	'PREFIX nbf: <http://ldf.fi/nbf/> ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        	'PREFIX schema: <http://schema.org/> ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';

        
        var querylinks = 
        	'SELECT distinct * WHERE {    ' +
        	' VALUES ?source { <RESULT_SET> } ' +
        	' VALUES ?target { <RESULT_SET> } ' +
        	' ?source nbf:references ?target . ' +
        	' FILTER (?source!=?target) . ' +
        	'} ';
        
        //	http://yasgui.org/short/rJmqP9Iv7
        var querynodes =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category)  ' +
        	'WHERE {    ' +
        	'  VALUES ?source { <RESULT_SET> } ' +
		'  ' +
        	'}  ' +
        	'GROUP BY ?level ?id ?label ?gender ' +
        	'ORDER BY ?level LIMIT <LIMIT> ';
        
        
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var resultOptions = {};	
        
        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        // var resultHandler = new FacetResultHandler(endpointConfig, resultOptions);
        
        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);

        
        function getLinks(ids) {
        	var q = prefixes + querylinks.replace(/<RESULT_SET>/g, ids);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getNodes(id, limit) {
        	var regex = /^p[0-9]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/'+id; }
        	
        	var constraint = '<{}>'.replace('{}',id),
        		q = prefixes + querynodes.replace(/<RESULT_SET>/g, constraint).replace("<LIMIT>", ''+limit)
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        
    }
})();
