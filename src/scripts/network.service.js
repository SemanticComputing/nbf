(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('networkService', networkService);

    /* @ngInject */
    function networkService($q, $location, _, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, mapfacetService, personMapperService) {

        /* Public API */
    	
        // Get the results based on facet selections.
        this.getLinks = getLinks;
        this.getNodes = getNodes;
        this.getGroupNodes = getGroupNodes;
        this.getGroupLinks = getGroupLinks;
        this.getNodesForPeople = getNodesForPeople;
        
        this.getFacets = mapfacetService.getFacets;
        this.getFacetOptions = getFacetOptions;
        
        function getFacetOptions() {
            return facetOptions;
        }
        
     // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };
        
        var facetOptions = {
                endpointUrl: endpointConfig.endpointUrl,
                rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
                constraint: '?id <http://ldf.fi/nbf/ordinal> ?ordinal . ',
                preferredLang : 'fi',
                noSelectionString: '-- Ei valintaa --'
            };

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

        
        var queryLinks = 
        	'SELECT distinct * WHERE {    ' +
        	' VALUES ?source { <RESULT_SET> } ' +
        	' VALUES ?target { <RESULT_SET> } ' +
        	' ?source nbf:references ?target . ' +
        	' FILTER (?source!=?target) . ' +
        	'} ';
        
        //	NOT TESTED YET, Petri
        var queryLinksForGroup =
        	'SELECT distinct (?id AS ?source) (?id2 AS ?target) ' +
			'WHERE {    ' +
			'  { <RESULT_SET> } ' +
			'  { <RESULT_SET2> } ' +
			'  ?id nbf:references ?id2 . ' +
			'} LIMIT <LIMIT> ';
        
        //	http://yasgui.org/short/rJmqP9Iv7
        var queryNodesForPerson =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category)  ' +
        	'WHERE {    ' +
        	'  VALUES ?source { <RESULT_SET> } ' +
        	'  GRAPH nbf:links { ' +
        	'    {  VALUES ?id { <RESULT_SET> } ' +
        	'      BIND (0 AS ?level) } ' +
        	'    UNION  ' +
        	'    { ?source nbf:references  ?id . BIND (1 AS ?level) } ' +
        	'    UNION  ' +
        	'    { ?id nbf:references ?source . BIND (1 AS ?level) } ' +
        	'    UNION  ' +
        	'    { ?source nbf:references/nbf:references ?id . BIND (2 AS ?level)} ' +
        	'  } ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname }  ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname }  ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?label) ' +
        	' ' +
        	'  ?id foaf:focus ?prs .  ' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender }  ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'}  ' +
        	'GROUP BY ?level ?id ?label ?gender ' +
        	'ORDER BY ?level LIMIT <LIMIT> ';
        
        var queryNodesForPeople =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category)  ' +
        	'WHERE {    ' +
        	'  VALUES ?id { <RESULT_SET> } ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname }  ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname }  ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?label) ' +
        	' ' +
        	'  ?id foaf:focus ?prs .  ' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender }  ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'}  ' +
        	'GROUP BY ?id ?label ?gender ';
        
        var queryNodesForGroup =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category)  ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  { <RESULT_SET2> } ' +
        	'  FILTER EXISTS { ?id nbf:references ?id2 }  ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname }  ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname }  ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?label) ' +
        	' ' +
        	'  ?id foaf:focus ?prs .  ' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender }  ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'} ' +
        	'GROUP BY ?id ?label ?gender LIMIT <LIMIT> ';
        
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
        var endpoint = new AdvancedSparqlService(endpointConfig);

        
        function getLinks(ids) {
        	var q = prefixes + queryLinks.replace(/<RESULT_SET>/g, ids);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getNodes(id, limit) {
        	var constraint = '<{}>'.replace('{}',id),
        		q = prefixes + queryNodesForPerson.replace(/<RESULT_SET>/g, constraint).replace("<LIMIT>", ''+limit)
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getGroupNodes(facetSelections, limit) {
        	
        	var cons = facetSelections.constraint.join(' '),
        		cons2 = cons.replace('?id ','?id2 '),
        		q = prefixes + queryNodesForGroup
        			.replace(/<RESULT_SET>/g, cons)
        			.replace(/<RESULT_SET2>/g, cons2)
        			.replace("<LIMIT>", limit);
        	
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getGroupLinks(facetSelections, limit) {
        	
        	var cons = facetSelections.constraint.join(' '),
        		cons2 = cons.replace('?id ','?id2 '),
        		q = prefixes + queryLinksForGroup
        			.replace(/<RESULT_SET>/g, cons)
        			.replace(/<RESULT_SET2>/g, cons2)
        			.replace("<LIMIT>", limit);
        	
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getNodesForPeople(ids) {
        	console.log('getNodesForPeople');
        	var 
        		q = prefixes + queryNodesForPeople
        			.replace(/<RESULT_SET>/g, ids);
        	console.log(q);
        	return endpoint.getObjectsNoGrouping(q);
        }
    }
})();
