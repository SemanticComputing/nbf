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
        // this.getNodes = getNodesForPeople;
        this.getNodesForPeople = getNodesForPeople;
        this.getNeighbors = getNeighbors;
        
        this.getRelativeLinks = getRelativeLinks;
        // this.getRelativeNodes = getRelativeNodes;
        
        this.getGroupLinks = getGroupLinks;
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
        	'PREFIX bioc:  <http://ldf.fi/schema/bioc/> ' +
        	'PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        	'PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        	'PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        	'PREFIX nbf: <http://ldf.fi/nbf/> ' +
        	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        	'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        	'PREFIX rels: <http://ldf.fi/nbf/relations/> ' +
        	'PREFIX schema: <http://schema.org/> ' +
        	'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        	'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        	'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
	    	'PREFIX foaf: <http://xmlns.com/foaf/0.1/> ';
		
		
		//	http://yasgui.org/short/_w4DcWLuu
		var queryNeighbors =
			'SELECT DISTINCT ?id WHERE { GRAPH nbf:links { '+
			'    VALUES ?source { <RESULT_SET> } '+
			'    { ?source (nbf:refers/nbf:target){0} ?id . BIND (0 AS ?level) } '+
			'    UNION '+
			'    { ?id nbf:refers/nbf:target ?source . BIND (1 AS ?level) } '+
			'    UNION '+
			'    { ?source nbf:refers/nbf:target ?id . BIND (1 AS ?level) } '+
			'    UNION '+
			'    { ?id (nbf:refers/nbf:target){2} ?source . BIND (2 AS ?level) } '+
			'    UNION '+
			'    { ?source (nbf:refers/nbf:target){2} ?id . BIND (2 AS ?level) } '+
			'} FILTER EXISTS { ?id a nbf:PersonConcept } ' +
			'} ORDER BY ?level LIMIT <LIMIT> ';
	    
	    
		//	http://yasgui.org/short/E7jnrOYGV
		var queryLinks = 
			'SELECT DISTINCT ?source ?target (SUM(?w) AS ?weight) WHERE { '+
			'   '+
			'  VALUES ?source { <RESULT_SET> } '+
			'  VALUES ?target { <RESULT_SET> } '+
			'   '+
			'  	VALUES ?type { <CLASSES> } '+
			'    ?ref nbf:target ?target ; nbf:type ?type ; ^nbf:refers ?source . '+
			'    OPTIONAL { ?ref nbf:weight ?w } '+
			'} GROUP BY ?source ?target ';
		
        //	http://yasgui.org/short/gpKguzg7c
        var queryLinksOld = 
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
        	'  ?id nbf:refers [ nbf:target ?id2 ; ' +
        	'                   nbf:type ?type ; ' +
        	'                   nbf:weight ?w ] . ' +
			'  { <RESULT_SET2> } ' +
			//' ?id2 a nbf:PersonConcept . ' +
        	'} GROUP BY ?id ?id2 ' +
        	'LIMIT <LIMIT> ';
        
        //	http://yasgui.org/short/W-DqUCxCO
        var queryRelativeLinks = 
        	'SELECT DISTINCT ?source ?target ?label WHERE { ' +
			'  {	SELECT distinct ?bio WHERE { ' +
			'      {	SELECT distinct ?bio1 WHERE { ' +
			'          VALUES ?id { <RESULT_SET> } ' +
			'          ?id (nbf:in_bio)?|^nbf:in_bio ?bio1 ' +
			'        }} ?bio1 (^nbf:in_bio/nbf:in_bio){,<LIMIT>} ?bio . ' +
			'    }} ' +
			'  { ' +
			'    ?source nbf:in_bio? ?bio ; ' +
			'            bioc:has_family_relation ?rel_uri . ' +
			'    ?rel_uri  bioc:inheres_in ?target . ' +
			'  } UNION { ' +
			'    ?target nbf:in_bio? ?bio ; '  +
			'            ^bioc:inheres_in ?rel_uri. ' +
			'    ?source bioc:has_family_relation ?rel_uri.  ' +
			'  } ' +
			'  ?source a nbf:PersonConcept ; skosxl:prefLabel []. ' +
			'  ?target a nbf:PersonConcept ; skosxl:prefLabel []. ' +
			'  VALUES (?rel_class ?order) { ' +
			'    (rels:Wife 0) ' +
			'    (rels:Husband 1) ' +
			'    (rels:Spouse 2) ' +
			'    (rels:Son 0) ' +
			'    (rels:Daughter 0) ' +
			'    (rels:Child 1) ' +
			'    (rels:Father 2) ' +
			'    (rels:Mother 2) ' +
			'    (rels:Parent 3) ' +
			'  } ' +
			'  ?rel_uri a ?rel_class . ' +
			'  ?rel_class skos:prefLabel ?label . ' +
			'  FILTER(LANG(?label)="fi") ' +
			'   ' +
			'} ORDER BY ?order ';
        
        
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
        
        //	http://yasgui.org/short/AIEN5IruP
        var queryNodesForPeople =
        	'SELECT distinct ?id ?label ?gender ?hasbio (sample(?cats) AS ?category) ' +
        	'WHERE {' +
        	'  VALUES ?id { <RESULT_SET> } ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname }' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname }' +
        	'  BIND (CONCAT(COALESCE(?id__gname,"")," ",COALESCE(?id__fname,"")) AS ?label)' +
        	'' +
        	'  ?id foaf:focus ?prs .' +
        	'  OPTIONAL { ?prs nbf:sukupuoli ?gender } ' +
        	'  OPTIONAL { ?prs nbf:has_category/skos:prefLabel ?cats } ' +
        	'  OPTIONAL { ?prs nbf:has_biography ?bio }' +
        	'  BIND (IF(BOUND(?bio),True,False) AS ?hasbio )' +
        	'}  ' +
        	'GROUP BY ?id ?label ?gender ?hasbio '; // LIMIT <LIMIT> ';
        
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
        
        function getNeighbors(id, limit) {
        	var regex = /^p[0-9_]+$/;
        	if (regex.test(id)) { id = '<http://ldf.fi/nbf/'+id+'>'; }
        	
        	var q = prefixes + queryNeighbors.
        		replace(/<RESULT_SET>/g, id).
        		replace(/<LIMIT>/g, limit);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getLinks(ids, classes) {
        	var q = prefixes + queryLinks.replace(/<RESULT_SET>/g, ids).replace("<CLASSES>", classes);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getNodesForPeople(ids) {
        	var q = prefixes + queryNodesForPeople
        			.replace(/<RESULT_SET>/g, ids);
        			// .replace("<LIMIT>", ''+limit);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        
        function getRelativeLinks(ids, limit) {
        	var q = prefixes + queryRelativeLinks.replace(/RESULT_SET/g, ids)
        		.replace("<LIMIT>", ''+(limit-1));
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getRelativeNodes(id, limit, classes) {
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
        
        
        function getGroupLinks(selections, limit, classes) {
        	var cons = selections.constraint.join(' '),
        		cons2 = cons.replace(/\?(id|ordinal) /g,'?$12 ').replace(/(\?slider_\d)/g,'$1b'),
        		q = prefixes + queryLinksForGroup
        			.replace(/<RESULT_SET>/g, cons)
        			.replace(/<RESULT_SET2>/g, cons2)
        			.replace("<LIMIT>", limit)
        			.replace("<CLASSES>", classes);
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