(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('visuService', visuService);

    /* @ngInject */
    function visuService($q, _, FacetResultHandler, AdvancedSparqlService, objectMapperService, mapfacetService, SPARQL_ENDPOINT_URL) {
    	
        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
    	this.getYears = getYears;
        this.getAge = getAge;
        this.getMarriageAge = getMarriageAge;
        this.getFirstChildAge = getFirstChildAge;
        this.getNumberOfChildren = getNumberOfChildren;
        this.getNumberOfSpouses = getNumberOfSpouses;

        this.getResults = getResults;

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
        
        var queryYears = prefixes +
	    	'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
	    	'WHERE { ' +
	    	'  { <RESULT_SET> } ' +
	    	'  ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth .' +
	    	'  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?value)' +
	    	'  BIND (replace(str(?id),"http://ldf.fi/nbf/","") AS ?url)' +
	    	'} GROUP BY ?value ORDER BY ?value ';
        
        // The query for the results 
        var queryAge = prefixes +
	    	'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
	    	'WHERE { ' +
	    	'  { <RESULT_SET> } ' +
	    	'  ?id foaf:focus/^crm:P100_was_death_of/nbf:time [ gvp:estStart ?time ; gvp:estEnd ?time2 ] ; ' +
	    	'       foaf:focus/^crm:P98_brought_into_life/nbf:time [ gvp:estStart ?birth ; gvp:estEnd ?birth2 ] . ' +
	    	'  BIND (xsd:integer(0.5*(year(?time)+year(?time2)-year(?birth)-year(?birth2))) AS ?value) ' +
	    	'  FILTER (-1<?value && ?value<120) ' +
	    	'  BIND (replace(str(?id),"http://ldf.fi/nbf/","") AS ?url)' +
	    	'} GROUP BY ?value ';
        
        
        var queryMarriageAge = prefixes +
            'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
            ' WHERE {    ' +
            '  {     SELECT DISTINCT ?id (min(?age) AS ?value) ' +
            '    WHERE { ' +
            '      { <RESULT_SET> } ' +
            '      VALUES ?rel { relations:Spouse } ' +
            '      ?id bioc:has_family_relation [ a ?rel ;  nbf:time/gvp:estStart ?time ] ; ' +
            '                                     foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '      BIND (year(?time)-year(?birth) AS ?age) ' +
            '      FILTER (13<?age && ?age<120)} ' +
            '   GROUP BY ?id } ' +
            '   FILTER (BOUND(?id)) ' +
	    	'  BIND (replace(str(?id),"http://ldf.fi/nbf/","") AS ?url)' +
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
	    	'  BIND (replace(str(?id),"http://ldf.fi/nbf/","") AS ?url)' +
            '} GROUP BY ?value ';

        var queryNumberOfChildren = prefixes +
            'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
            'WHERE { ' +
            '  { ' +
            '      SELECT DISTINCT ?id (count(?rel) AS ?value) ' +
            '      WHERE { { <RESULT_SET> } ' +
            '        VALUES ?rel { relations:Child relations:Son relations:Daughter } ' +
            '        ?id bioc:has_family_relation/a ?rel . }  ' +
            '      GROUP BY ?id } ' +
            '  UNION { ' +
            '    	{ <RESULT_SET> } ' +
            '      ?id dcterms:source sources:source1 ; ' +
            '          foaf:focus/nbf:has_biography/nbf:has_paragraph/nbf:id "2"^^xsd:integer . ' +
            '      FILTER not exists { ?id bioc:has_family_relation/a relations:Child } ' +
            '	   BIND (0 AS ?value) } ' +
            '  FILTER (BOUND(?id)) ' +
	    	'  BIND (replace(str(?id),"http://ldf.fi/nbf/","") AS ?url)' +
            '} GROUP BY ?value ';

        //	http://yasgui.org/short/ByVXkyhIX
        var queryNumberOfSpouses = prefixes +
	        'SELECT DISTINCT ?value (COUNT(?id) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons) ' +
	    	'WHERE { ' +
	    	'  { ' +
	    	'    SELECT DISTINCT ?id (count(?rel) AS ?value) WHERE ' +
	    	'    { ' +
	    	'      { <RESULT_SET> } ' +
	    	'      VALUES ?rel { relations:Spouse } ' +
	    	'      ?id bioc:has_family_relation/a ?rel . } ' +
	    	'    GROUP BY ?id ' +
	    	'  } ' +
	    	'  UNION { ' +
	    	'    { <RESULT_SET> } ' +
	    	'    ?id dcterms:source sources:source1 ; ' +
	    	'        foaf:focus/nbf:has_biography/nbf:has_paragraph/nbf:id "2"^^xsd:integer . ' +
	    	'    FILTER not exists { ?id bioc:has_family_relation/a relations:Spouse } ' +
	    	'    BIND (0 AS ?value) ' +
	    	'  } ' +
	    	'  FILTER (BOUND(?id)) ' +
	    	'  BIND (replace(str(?id),"http://ldf.fi/nbf/","") AS ?url)' +
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
            var cons = facetSelections.constraint.join(' '),
                q = queryYears.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }

        function getAge(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryAge.replace(/<RESULT_SET>/g, cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }

        function getMarriageAge(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryMarriageAge.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }

        function getFirstChildAge(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryFirstChildAge.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }

        
        function getNumberOfChildren(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryNumberOfChildren.replace(/<RESULT_SET>/g, cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }

        function getNumberOfSpouses(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryNumberOfSpouses.replace(/<RESULT_SET>/g, cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }


        function getResults(facetSelections) {
            var promises = [
            	this.getYears(facetSelections),
                this.getAge(facetSelections),
                this.getMarriageAge(facetSelections), 
                this.getFirstChildAge(facetSelections),
                this.getNumberOfChildren(facetSelections),
                this.getNumberOfSpouses(facetSelections) 
            ];
            return $q.all(promises);
        }

        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
