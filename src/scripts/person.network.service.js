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
        this.getResults = getResults;
        

        /* Implementation */

        var prefixes =
        	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>  ' +
        	'PREFIX nbf: <http://ldf.fi/nbf/>  ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>  ' +
        	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>  ' +
        	'PREFIX schema: <http://schema.org/>  ';

        // The query for the results.
        // http://yasgui.org/short/SkYoy7fzX
        var query =
        	'SELECT distinct ?source ?source_name ?target ?target_name WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'' +
        	'  { ?id nbf:references ?target . ' +
        	'    BIND (?id as ?source) ' +
        	'  } UNION { ' +
        	'    ?source nbf:references ?id . ' +
        	'    BIND (?id as ?target) ' +
        	'  } UNION { ' +
        	'  		?id nbf:references ?source .' +
            '	    ?source nbf:references ?target .' +
            '  } ' +
            /**'  UNION { ' +
        	'  		?id nbf:references ?target .' +
            '	    ?source nbf:references ?target .' +
            '  }' + */
            '  FILTER (?source!=?target)' +
        	'' +
        	'  ?source skosxl:prefLabel ?id__label .   OPTIONAL { ?id__label schema:familyName ?id__fname }   OPTIONAL { ?id__label schema:givenName ?id__gname }    ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?source_name)      ' +
        	'   ' +
        	'  ?target skosxl:prefLabel ?id2__label .   OPTIONAL { ?id2__label schema:familyName ?id2__fname }   OPTIONAL { ?id2__label schema:givenName ?id2__gname }    ' +
        	'  BIND (CONCAT(COALESCE(?id2__gname, "")," ",COALESCE(?id2__fname, "")) AS ?target_name)  ' +
        	'}  LIMIT 1000 ';

        
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

        function getResults(id) {
        	var constraint = 'VALUES ?id { <' + id + '> } ';
        	var q = prefixes + query.replace("<RESULT_SET>", constraint);
        	var res = endpoint.getObjectsNoGrouping(q);
        	return res;
        }

        
    }
})();
