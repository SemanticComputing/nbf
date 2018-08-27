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

        // The query for the results.
        // http://yasgui.org/short/Byd-H4Zwm
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
        	'}  LIMIT <LIMIT> ';

        var querylinks =
        	'SELECT distinct ?source ?target WHERE { ' +
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
        	'}  LIMIT <LIMIT> ';
        
        var querynodes =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category) ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname } ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname } ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?label) ' +
        	'   ' +
        	'  ?id foaf:focus ?prs . ' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender } ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats . } ' +
        	'} GROUP BY ?id ?label ?gender ';
        
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

        function getResults(id, limit) {
        	var constraint = 'VALUES ?id { <' + id + '> } ';
        	var q = prefixes + query.replace("<RESULT_SET>", constraint).replace("<LIMIT>", ''+limit);
        	
        	var res = endpoint.getObjectsNoGrouping(q);
        	return res;
        }

        function getLinks(id, limit) {
        	var constraint = 'VALUES ?id { <' + id + '> } ';
        	var q = prefixes + querylinks.replace("<RESULT_SET>", constraint).replace("<LIMIT>", ''+limit);
        	
        	var res = endpoint.getObjectsNoGrouping(q);
        	return res;
        }
        
        function getNodes(ids) {
        	var arr = ids.map(function(id) { return '<'+id+'>' }).join(' ');
        	
        	var constraint = 'VALUES ?id { ' + arr + ' } ';
        	var q = prefixes + querynodes.replace("<RESULT_SET>", constraint);
        	
        	var res = endpoint.getObjectsNoGrouping(q);
        	return res;
        }
        
        
    }
})();
