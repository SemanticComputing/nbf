(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('visuPieService', visuPieService);

    /* @ngInject */
    function visuPieService($q, _, FacetResultHandler, AdvancedSparqlService, objectMapperService, mapfacetService, SPARQL_ENDPOINT_URL) {
    	
        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
    	this.getGenders = getGenders;
    	this.getCategories = getCategories;
    	this.getTitles = getTitles;
        this.getDatabases = getDatabases;
        this.getCompanies = getCompanies;
        
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = mapfacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;


        /* Implementation */
        
        
        var prefixes =
        	'PREFIX bioc: <http://ldf.fi/schema/bioc/>  ' +
        	'PREFIX	categories:	<http://ldf.fi/nbf/categories/>  ' +
        	'PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>  ' +
        	'PREFIX dcterms: <http://purl.org/dc/terms/>  ' +
        	'PREFIX foaf: <http://xmlns.com/foaf/0.1/>  ' +
        	'PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        	'PREFIX	nbf: <http://ldf.fi/nbf/>  ' +
        	'PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
            'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            'PREFIX	relations: <http://ldf.fi/nbf/relations/> ' +
            'PREFIX schema: <http://schema.org/>  ' +
            'PREFIX	sources: <http://ldf.fi/nbf/sources/> ' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>  ' +
            'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>  ' +
            'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' 
            ;
        
        //	http://yasgui.org/short/Sy3hkK8DX
        var queryGenders = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?url) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons)   ' +
    	'WHERE {  <RESULT_SET> ' +
    	'  ?id foaf:focus ?prs . ' +
    	'  { ?prs nbf:sukupuoli ?value } ' +
    	'  UNION ' +
    	'  { BIND ("ei tiedossa" AS ?value) . ' +
    	'    FILTER NOT EXISTS { ?prs nbf:sukupuoli [] } ' +
    	'  } ' +
    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url)  ' +
    	'} GROUP BY ?value ORDER BY DESC(?count) ';
        
        var queryCategory = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?url) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons)  ' +
    			'WHERE { { <RESULT_SET> } ' +
    			'  ?id foaf:focus/nbf:has_category/skos:prefLabel ?value ' +
    	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryTitle = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?url) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons)  ' +
    			'WHERE { { <RESULT_SET> } ' +
    			'  ?id foaf:focus/^bioc:inheres_in/nbf:has_title/skos:prefLabel ?value ' +
    	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryDatabase = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?url) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons)  ' +
    			'WHERE { { <RESULT_SET> } ' +
    			'  ?id owl:sameAs*|^(owl:sameAs)* ?id2 . ' +
    			'  ?id2 dcterms:source ?source . ' +
    			'  FILTER (?source!=<http://ldf.fi/nbf/sources/source7>) ' +
    			'  ?source skos:prefLabel ?value . ' +
    	    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryCompanies = prefixes +
    	'SELECT DISTINCT (SAMPLE(?label) AS ?value) (COUNT(DISTINCT ?url) AS ?count) (GROUP_CONCAT(?url; separator=",") AS ?persons)  ' +
    	'WHERE {  ' +
    	'  { <RESULT_SET> } ' +
    	'  ?id foaf:focus/^bioc:inheres_in/nbf:related_company ?cmp . ' +
    	'  ?cmp skos:prefLabel ?label . ' +
    	'  BIND (replace(str(?id),"^.+/([^/]+)$","$1") AS ?url) ' +
    	'} GROUP BY ?cmp ORDER BY DESC(?count)';
        
        // The SPARQL endpoint URL
        var endpointUrl = SPARQL_ENDPOINT_URL;

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };

        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);

        function getGenders(facetSelections) {
        	return getResults(facetSelections, queryGenders);
        }
        
        function getCategories(facetSelections) {
        	return getResults(facetSelections, queryCategory);
        }
        
        function getTitles(facetSelections) {
        	return getResults(facetSelections, queryTitle);
        }
        
        function getDatabases(facetSelections) {
        	return getResults(facetSelections, queryDatabase);
        }
        
        function getCompanies(facetSelections) {
        	return getResults(facetSelections, queryCompanies);
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
