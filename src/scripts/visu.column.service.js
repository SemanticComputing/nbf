(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('visuColumnService', visuColumnService);

    /* @ngInject */
    function visuColumnService($q, _, FacetResultHandler, AdvancedSparqlService, objectMapperService, mapfacetService, SPARQL_ENDPOINT_URL) {
    	
        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
    	this.getYears = getYears;
        this.getAge = getAge;
        this.getMarriageAge = getMarriageAge;
        this.getFirstChildAge = getFirstChildAge;
        this.getNumberOfChildren = getNumberOfChildren;
        this.getNumberOfSpouses = getNumberOfSpouses;

        //this.getResults = getResults;

        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = mapfacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        /* Implementation */
        
        var prefixes =
            'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
            'PREFIX bioc:  <http://ldf.fi/schema/bioc/> ' +
            'PREFIX rdfs:  <http://www.w3.org/2000/01/rdf-schema#> ' +
            'PREFIX schema: <http://schema.org/> ' +
            'PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
            'PREFIX skos:  <http://www.w3.org/2004/02/skos/core#> ' +
            'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
            'PREFIX	nbf:	<http://ldf.fi/nbf/>  ' +
            'PREFIX	categories:	<http://ldf.fi/nbf/categories/>  ' +
            'PREFIX	gvp:	<http://vocab.getty.edu/ontology#> ' +
            'PREFIX crm:   <http://www.cidoc-crm.org/cidoc-crm/> ' +
            'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX dcterms: <http://purl.org/dc/terms/> ' +
            'PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
            'PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
            'PREFIX	relations:	<http://ldf.fi/nbf/relations/> ' +
            'PREFIX	sources:	<http://ldf.fi/nbf/sources/> ';
        
        //	http://yasgui.org/short/rkR8h_LD7
        var queryYears = prefixes +
	    	'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
	    	'WHERE { ' +
	    	'  { <RESULT_SET> } ' +
	    	'  ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth .' +
	    	'  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?value)' +
	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
	    	'} GROUP BY ?value ORDER BY ?value ';
        
        var queryAge = prefixes +
	    	'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
	    	'WHERE { ' +
	    	'  { <RESULT_SET> } ' +
	    	'  ?id foaf:focus/^crm:P100_was_death_of/nbf:time [ gvp:estStart ?time ; gvp:estEnd ?time2 ] ; ' +
	    	'       foaf:focus/^crm:P98_brought_into_life/nbf:time [ gvp:estStart ?birth ; gvp:estEnd ?birth2 ] . ' +
	    	'  BIND (xsd:integer(0.5*(year(?time)+year(?time2)-year(?birth)-year(?birth2))) AS ?value) ' +
	    	'  FILTER (-1<?value && ?value<120) ' +
	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
	    	'} GROUP BY ?value ';
        
        
        var queryMarriageAge = prefixes +
            'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
            ' WHERE {    ' +
            '  {     SELECT DISTINCT ?id (min(?age) AS ?value) ' +
            '    WHERE { ' +
            '      { <RESULT_SET> } ' +
            '      VALUES ?rel { relations:Spouse relations:Wife relations:Husband } ' +
            '      ?id bioc:has_family_relation [ a ?rel ;  nbf:time/gvp:estStart ?time ] ; ' +
            '                                     foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '      BIND (year(?time)-year(?birth) AS ?age) ' +
            '      FILTER (13<?age && ?age<120)} ' +
            '   GROUP BY ?id } ' +
            '   FILTER (BOUND(?id)) ' +
	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
            '} GROUP BY ?value ';

        var queryFirstChildAge = prefixes +
            'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
            ' WHERE {    ' +
            '  {     SELECT DISTINCT ?id (min(?age) AS ?value) ' +
            '    WHERE { ' +
            '      { <RESULT_SET> } ' +
            '      VALUES ?rel { relations:Child relations:Son relations:Daughter } ' +
            '      ?id bioc:has_family_relation [ a ?rel ;  nbf:time/gvp:estStart ?time ] ; ' +
            '                                     foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '      BIND (year(?time)-year(?birth) AS ?age) ' +
            '      FILTER (13<?age && ?age<120)} ' +
            '    GROUP BY ?id } ' +
            '   FILTER (BOUND(?id)) ' +
	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
            '} GROUP BY ?value ';

        //	http://yasgui.org/short/RGgJd5gWD
        var queryNumberOfChildren = prefixes +
    	'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
    	'WHERE { ' +
    	'  { ' +
    	'    SELECT DISTINCT ?id (count(DISTINCT ?pc) AS ?value) ' +
    	'    WHERE { ' +
    	'      { <RESULT_SET> } ' +
    	'      VALUES ?rel { relations:Child relations:Son relations:Daughter } ' +
    	'      ?id bioc:has_family_relation [ ' +
    	'    	a ?rel ; ' +
    	'    	bioc:inheres_in/owl:sameAs* ?pc ] ' +
    	'      FILTER NOT EXISTS { ?pc owl:sameAs [] } ' +
    	'    } ' +
    	'    GROUP BY ?id ' +
    	'  } ' +
    	'  UNION ' +
    	'  { ' +
    	'    { <RESULT_SET> } ' +
    	'    VALUES ?source { sources:source1 sources:source4 } ' +
    	'    ?id <http://purl.org/dc/terms/source> ?source .' +
    	'    FILTER not exists { ?id bioc:has_family_relation/a relations:Child } ' +
    	'    FILTER not exists { ?id bioc:has_family_relation/a relations:Son } ' +
    	'    FILTER not exists { ?id bioc:has_family_relation/a relations:Daughter } ' +
    	'    BIND (0 AS ?value) ' +
    	'  } ' +
    	'  FILTER (BOUND(?id)) ' +
    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
    	'} GROUP BY ?value '

        //	http://yasgui.org/short/38J9cl4vn
        var queryNumberOfSpouses = prefixes +
	        'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
    	'WHERE { ' +
    	'	{     SELECT DISTINCT ?id (count(DISTINCT ?pc) AS ?value) WHERE     { ' +
    	'      { <RESULT_SET> }  ' +
    	'      VALUES ?rel { relations:Spouse relations:Wife relations:Husband } ' +
    	'      ?id bioc:has_family_relation [ ' +
    	'          a ?rel ; ' +
    	'          bioc:inheres_in/owl:sameAs* ?pc ] ' +
    	'      FILTER NOT EXISTS { ?pc owl:sameAs [] } ' +
    	'    } ' +
    	'    GROUP BY ?id   } ' +
    	'  UNION { ' +
    	'    { <RESULT_SET> }  ' +
    	'    FILTER not exists { ?id owl:sameAs*/bioc:has_family_relation/a relations:Spouse } ' +
    	'    FILTER not exists { ?id owl:sameAs*/bioc:has_family_relation/a relations:Husband } ' +
    	'    FILTER not exists { ?id owl:sameAs*/bioc:has_family_relation/a relations:Wife } ' +
    	'    BIND (0 AS ?value) ' +
    	'  } ' +
    	'  FILTER (BOUND(?id)) ' +
    	'  BIND (replace(str(?id),"^.+//([^//]+)$","$1") AS ?url) ' +
    	'} GROUP BY ?value ';
        
        // The SPARQL endpoint URL
        var endpointUrl = SPARQL_ENDPOINT_URL;

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };

        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);

        function getYears(facetSelections) {
        	return getResults(facetSelections, queryYears);
        }

        function getAge(facetSelections) {
        	return getResults(facetSelections, queryAge);
        }

        function getMarriageAge(facetSelections) {
        	return getResults(facetSelections, queryMarriageAge);
        }

        function getFirstChildAge(facetSelections) {
        	return getResults(facetSelections, queryFirstChildAge);
        }

        function getNumberOfChildren(facetSelections) {
        	return getResults(facetSelections, queryNumberOfChildren);
        }

        function getNumberOfSpouses(facetSelections) {
        	return getResults(facetSelections, queryNumberOfSpouses);
        }

        function getResults(facetSelections, query) {
        	var cons = facetSelections.constraint.join(' '),
            	q = query.replace(/<RESULT_SET>/g, cons);
        	return endpoint.getObjectsNoGrouping(q) ;
        }
        
        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
