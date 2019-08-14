(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('visuNetService', visuNetService);

    /* @ngInject */
    function visuNetService($q, _, FacetResultHandler, AdvancedSparqlService, objectMapperService, mapfacetService, SPARQL_ENDPOINT_URL) {
    	
        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
    	this.getResults = getResults;
    	
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
            'PREFIX	rels: <http://ldf.fi/nbf/relations/> ' +
            'PREFIX schema: <http://schema.org/>  ' +
            'PREFIX	sources: <http://ldf.fi/nbf/sources/> ' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>  ' +
            'PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>  ' +
            'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' 
            ;
        
        
        //	http://yasgui.org/short/fDWPN5GZy
        var queryRelativeProperties = 
            'SELECT DISTINCT ?label_1 ?label_2 (COUNT(DISTINCT ?url) AS ?no) (GROUP_CONCAT(DISTINCT ?url; separator=",") AS ?ids) ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> }' +
        	'  ?id owl:sameAs* ?id_x . FILTER NOT EXISTS { ?id_x owl:sameAs [] } ' +
        	'  ?id_x <PROPPATH> ?label_1 ; ' +
        	'      bioc:has_family_relation [ a ?rel ; bioc:inheres_in/owl:sameAs* ?id2 ] . ' +
        	'  FILTER (?rel in <CLASSES>) ' +
        	'  FILTER NOT EXISTS { ?id2 owl:sameAs [] } ' +
        	'  ?id2 <PROPPATH> ?label_2 . ' +
        	'  BIND (CONCAT(replace(str(?id_x),"^.+/([^/]+)$","$1"),",",replace(str(?id2),"^.+/([^/]+)$","$1")) AS ?url) ' +
        	'} GROUP BY ?label_1 ?label_2 ORDER BY DESC(?no) LIMIT <LIMIT> ';
        	
        //	http://yasgui.org/short/6hlGFsloa
        var queryReferenceProperties = 
            'SELECT DISTINCT ?label_1 ?label_2 (COUNT(DISTINCT ?url) AS ?no) (GROUP_CONCAT(DISTINCT ?url; separator=",") AS ?ids) ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> }' +
        	'  ?id owl:sameAs* ?id_x . FILTER NOT EXISTS { ?id_x owl:sameAs [] } ' +
        	'  ?id_x <PROPPATH> ?label_1 ; ' +
        	'      nbf:refers/nbf:target/owl:sameAs* ?id2 . ' +
        	'  FILTER NOT EXISTS { ?id2 owl:sameAs [] } ' +
        	'  ?id2 <PROPPATH> ?label_2 . ' +
        	'  BIND (CONCAT(replace(str(?id_x),"^.+/([^/]+)$","$1"),",",replace(str(?id2),"^.+/([^/]+)$","$1")) AS ?url) ' +
        	'} GROUP BY ?label_1 ?label_2 ORDER BY DESC(?no) LIMIT <LIMIT> ';
        	
        // The SPARQL endpoint URL
        var endpointUrl = SPARQL_ENDPOINT_URL;

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };

        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);

        function getParentProfessions(facetSelections) {
        	return getResults(facetSelections, queryParentProfessions);
        }
        
        function getReferenceProfessions(facetSelections, property) {
        	return getResults(facetSelections, queryRelativeProperties, property);
        }
        
        function getResults(facetSelections, relation, property, limit) {
        	let cons = facetSelections.constraint.join(' '),
        		q = (relation ? queryRelativeProperties : queryReferenceProperties).
        		replace(/<RESULT_SET>/g, cons).
        		replace(/<PROPPATH>/g, property).
        		replace(/<CLASSES>/g, relation).
        		replace(/<LIMIT>/g, limit);
        	return endpoint.getObjectsNoGrouping(prefixes + q) ;
        }
        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
