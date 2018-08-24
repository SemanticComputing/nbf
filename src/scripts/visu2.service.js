(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('visuService2', visuService2);

    /* @ngInject */
    function visuService2($q, _, FacetResultHandler, AdvancedSparqlService, objectMapperService, mapfacetService, SPARQL_ENDPOINT_URL) {
    	
        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
    	this.getGenders = getGenders;
    	this.getCategories = getCategories;
    	this.getTitles = getTitles;
        this.getResults = getResults;
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
        
        //	http://yasgui.org/short/B1XvJr6Im
        var queryGenders = prefixes +
	    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?id) AS ?count) (GROUP_CONCAT(?id; separator=",") AS ?persons)  ' +
	    			'WHERE { { <RESULT_SET> } ' +
	    			'  ?id foaf:focus/nbf:sukupuoli ?value ' +
	    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryCategory = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?id) AS ?count) (GROUP_CONCAT(?id; separator=",") AS ?persons)  ' +
    			'WHERE { { <RESULT_SET> } ' +
    			'  ?id foaf:focus/nbf:has_category/skos:prefLabel ?value ' +
    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryTitle = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?id) AS ?count) (GROUP_CONCAT(?id; separator=",") AS ?persons)  ' +
    			'WHERE { { <RESULT_SET> } ' +
    			'  ?id foaf:focus/^bioc:inheres_in/nbf:has_title/skos:prefLabel ?value ' +
    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryDatabase = prefixes +
    	'SELECT DISTINCT ?value (COUNT(DISTINCT ?id) AS ?count) (GROUP_CONCAT(?id; separator=",") AS ?persons)  ' +
    			'WHERE { { <RESULT_SET> } ' +
    			'  ?id owl:sameAs*|^(owl:sameAs)* ?id2 . ' +
    			'  ?id2 dcterms:source ?source . ' +
    			'  FILTER (?source!=<http://ldf.fi/nbf/sources/source7>) ' +
    			'  ?source skos:prefLabel ?value . ' +
    			'} GROUP BY ?value ORDER BY DESC(?count)';
        
        var queryCompanies = prefixes +
    	'SELECT DISTINCT (SAMPLE(?label) AS ?value) (COUNT(DISTINCT ?id) AS ?count) (GROUP_CONCAT(?id; separator=",") AS ?persons)  ' +
    	'WHERE {  ' +
    	'  { <RESULT_SET> } ' +
    	'  ?id foaf:focus/^bioc:inheres_in/nbf:related_company ?cmp . ' +
    	'  ?cmp skos:prefLabel ?label . ' +
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
            var cons = facetSelections.constraint.join(' '),
                q = queryGenders.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }
        
        function getCategories(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryCategory.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }
        
        function getTitles(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryTitle.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }
        
        function getDatabases(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryDatabase.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }
        

        function getCompanies(facetSelections) {
            var cons = facetSelections.constraint.join(' '),
                q = queryCompanies.replace('<RESULT_SET>', cons);
            return endpoint.getObjectsNoGrouping(q) ;
        }
        
        function getResults(facetSelections) {
            var promises = [
            	this.getGenders(facetSelections) ,
                this.getCategories(facetSelections),
                this.getTitles(facetSelections),
                this.getDatabases(facetSelections),
                this.getCompanies(facetSelections)
            ];
            return $q.all(promises);
        }

        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
