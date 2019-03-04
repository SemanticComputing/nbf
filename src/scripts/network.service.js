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
        
        this.getGroupLinks = getGroupLinks;
        this.getNodesForPeople = getNodesForPeople;
        this.getCloudNodes = getCloudNodes;
        this.getFacets = mapfacetService.getFacets;
        this.getFacetOptions = getFacetOptions;
        this.getGroupRelatives = getGroupRelatives;
        
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
        	'PREFIX bioc:  <http://ldf.fi/schema/bioc/> ' +
        	'PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        	'PREFIX schema: <http://schema.org/> ' +
        	'PREFIX rels: <http://ldf.fi/nbf/relations/> ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';

        
        //	http://yasgui.org/short/gpKguzg7c
        var queryLinks = 
        	'SELECT distinct ?source ?target (SUM(?w) AS ?weight) WHERE { ' +
        	' VALUES ?type { <CLASSES> } ' +
        	' VALUES ?source { <RESULT_SET> } ' +
        	' VALUES ?target { <RESULT_SET> } ' +
        	' ?source  nbf:refers [ nbf:target ?target ; ' +
        	'                   nbf:type ?type ; ' +
        	'                   nbf:weight ?w ]  ' +
        	' FILTER (?source!=?target) . ' +
        	'} GROUP BY ?source ?target';
        
        //	example query http://yasgui.org/short/Zjq68Lgra
        var queryLinksForGroup =
        	'SELECT distinct (?id AS ?source) (?id2 AS ?target) (SUM(?w) AS ?weight) ' +
        	'WHERE { ' +
        	'  VALUES ?type { <CLASSES> } ' +
        	'  { <RESULT_SET> }' +
			'  { <RESULT_SET2> }' +
        	'  ?id nbf:refers [ nbf:target ?id2 ; ' +
        	'                   nbf:type ?type ; ' +
        	'                   nbf:weight ?w ] ' +
        	'} GROUP BY ?id ?id2 ' +
        	'LIMIT <LIMIT> ';
        
        //	example http://yasgui.org/short/y1M2Z_CC5
        var queryLinksOfRelatives =
        	'SELECT distinct ?source ?target ?label ' +
        'WHERE { ' +
    	'  { <RESULT_SET> }' +
    	'   ?id (bioc:has_family_relation/bioc:inheres_in/owl:sameAs*){,2} ?source . ' +
    	'   ?source bioc:has_family_relation  [ bioc:inheres_in/owl:sameAs* ?target ; ' +
    	'                                  a/skos:prefLabel ?label ] ' +
    	'   ' +
    	'  FILTER NOT EXISTS { ?source owl:sameAs [] . ?target owl:sameAs [] } ' +
    	'  FILTER EXISTS { ?target skosxl:prefLabel [] . ?source skosxl:prefLabel [] } ' +
    	'  FILTER (?source != ?target) ' +
    	'  FILTER (lang(?label)="fi") ' +
    	'  ' +
    	'} LIMIT <LIMIT> ';
    	
        //	http://yasgui.org/short/gqSzSYGn_
        var queryNodesForPerson =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category)  ' +
        	'WHERE {    ' +
        	'	VALUES ?type { <CLASSES> } ' +
        	'  VALUES ?source { <RESULT_SET> } ' +
        	'  GRAPH nbf:links { ' +
        	'    {  VALUES ?id { <RESULT_SET> } ' +
        	'       BIND (0 AS ?level) } ' +
        	'    UNION ' +
        	'    { ?source nbf:refers [ nbf:target ?id ; nbf:type ?type ] . BIND (1 AS ?level) } ' +
        	'    UNION ' +
        	'    { ?id nbf:refers [ nbf:target ?source ; nbf:type ?type ] . BIND (1 AS ?level) } ' +
        	'    UNION ' +
        	'    { ?source nbf:refers/nbf:target/nbf:refers [ nbf:target ?id ; nbf:type ?type ] . BIND (2 AS ?level)} ' +
        	'  } ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname }  ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname }  ' +
        	'  BIND (CONCAT(COALESCE(?id__gname,"")," ",COALESCE(?id__fname,"")) AS ?label) ' +
        	' ' +
        	'  ?id foaf:focus ?prs .  ' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender }  ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'} ' +
        	'GROUP BY ?level ?id ?label ?gender ' +
        	'ORDER BY ?level LIMIT <LIMIT> ';
        
        var queryNodesForPeople =
        	'SELECT distinct ?id ?label ?gender (sample(?cats) AS ?category)  ' +
        	'WHERE { ' +
        	'  VALUES ?id { <RESULT_SET> } ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname }  ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname }  ' +
        	'  BIND (CONCAT(COALESCE(?id__gname,"")," ",COALESCE(?id__fname,"")) AS ?label) ' +
        	' ' +
        	'  ?id foaf:focus ?prs .  ' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender }  ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'}  ' +
        	'GROUP BY ?id ?label ?gender ';
        
        var queryCloudForGroup =
        	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        	'PREFIX nbf: <http://ldf.fi/nbf/> ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        	'PREFIX schema: <http://schema.org/> ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        	' ' +
        	'SELECT distinct ?id ?x ?y ?label ?gender (sample(?cats) AS ?category) ' +
        	'WHERE { ' +
        	'	{ <RESULT_SET> } ' +
        	'	?id skosxl:prefLabel ?id__label ; ' +
        	'     nbf:coordinate [ nbf:x ?x ; nbf:y ?y ] . ' +
        	'	OPTIONAL { ?id__label schema:familyName ?id__fname } ' +
        	'	OPTIONAL { ?id__label schema:givenName ?id__gname } ' +
        	'	BIND (CONCAT(COALESCE(?id__gname,"")," ",COALESCE(?id__fname,"")) AS ?label) ' +
        	'	?id foaf:focus ?prs . ' +
        	'	OPTIONAL { ?prs nbf:sukupuoli ?gender } ' +
        	'	OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'}  GROUP BY ?id ?x ?y ?label ?gender LIMIT <LIMIT> ';
        
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

        
        function getLinks(ids, classes) {
        	var q = prefixes + queryLinks.replace(/<RESULT_SET>/g, ids).replace("<CLASSES>", classes);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getNodes(id, limit, classes) {
        	var regex = /^p[0-9_]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/'+id; }
        	
        	var constraint = '<{}>'.replace('{}',id),
        		q = prefixes + queryNodesForPerson.replace(/<RESULT_SET>/g, constraint)
        			.replace("<LIMIT>", ''+limit)
        			.replace("<CLASSES>", classes);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getGroupRelatives(facetSelections, limit) {
        	var cons = facetSelections.constraint.join(' '),
        		q = prefixes + queryLinksOfRelatives
        			.replace(/<RESULT_SET>/g, cons)
        			.replace("<LIMIT>", limit) 

        	return endpoint.getObjectsNoGrouping(q);
        }
        
        
        function getGroupLinks(facetSelections, limit, classes) {
        	var cons = facetSelections.constraint.join(' '),
        		cons2 = cons.replace('?id ','?id2 '),
        		q = prefixes + queryLinksForGroup
        			.replace(/<RESULT_SET>/g, cons)
        			.replace(/<RESULT_SET2>/g, cons2)
        			.replace("<LIMIT>", limit)
        			.replace("<CLASSES>", classes);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getNodesForPeople(ids) {
        	var q = prefixes + queryNodesForPeople
        			.replace(/<RESULT_SET>/g, ids);

        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getCloudNodes(facetSelections, limit) {
        	var cons = facetSelections.constraint.join(' '),
        		q = prefixes + queryCloudForGroup
        			.replace(/<RESULT_SET>/g, cons)
        			.replace("<LIMIT>", limit);
        	return endpoint.getObjectsNoGrouping(q);
        }
    }
})();
