(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('popoverService', popoverService);

    /* @ngInject */
    function popoverService(// $q, $location, _, facetService, FacetResultHandler, 
    		SPARQL_ENDPOINT_URL,
            AdvancedSparqlService
            // , personMapperService
            ) {

        /* Public API */

        
        this.getPopover = getPopover;
        this.getHrefPopover = getHrefPopover;
        this.getPopoverGroup = getPopoverGroup;
        this.getPlacePopover = getPlacePopover;
        /* Implementation */

        var prefixes =
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX sources:	<http://ldf.fi/nbf/sources/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
        ' PREFIX categories:	<http://ldf.fi/nbf/categories/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX rels: <http://ldf.fi/nbf/relations/> ';

        
        //	http://yasgui.org/short/ByjM-gdIm
        var queryForPopover =
        	'SELECT DISTINCT ?id ?label ?image ?lifespan  ' +
        	'WHERE {' +
        	'  <RESULT_SET> ' +
        	'  ?id2 owl:sameAs* ?id . FILTER NOT EXISTS {?id owl:sameAs []} ' +
        	'  ?id foaf:focus ?prs . ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image1 ; dct:source sources:source1 ] } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image2 ; dct:source sources:source10 ] } ' +
        	'  OPTIONAL { ?prs nbf:image/schema:image ?image3 } ' +
        	'  BIND (COALESCE(?image1, ?image2, ?image3) AS ?image) ' +
        	'   ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname . }    ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname . }    ' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label)        ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime }    ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime }    ' +
        	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-", COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan)     ' +
        	'} LIMIT 1 ';
        
        //	http://yasgui.org/short/SyK2-M6vm
        var queryForHref = 
        	'SELECT DISTINCT ?id ?label ?image ?lifespan  ' +
        	'WHERE {   ' +
        	'  { <RESULT_SET> } ' +
        	'  ?id nbf:formatted_link ?href ; ' +
        	'  		owl:sameAs*/foaf:focus ?prs . ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image1 ; dct:source sources:source1 ] } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image2 ; dct:source sources:source10 ] } ' +
        	'  OPTIONAL { ?prs nbf:image/schema:image ?image3 } ' +
        	'  BIND (COALESCE(?image1, ?image2, ?image3) AS ?image) ' +
        	'   ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname . }    ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname . }    ' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label)        ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime }    ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime }    ' +
        	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-", COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan)     ' +
        	'} LIMIT 1 ';
        
        //	http://yasgui.org/short/HJksOSt87
        var queryForPopoverGroup =
        	'SELECT DISTINCT ?id ?label ?image ?lifespan  ' +
        	'WHERE {   ' +
        	'  <RESULT_SET> ' +
        	'  ?id2 owl:sameAs* ?id . FILTER NOT EXISTS {?id owl:sameAs []} ' +
        	'  ?id foaf:focus ?prs . ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image1 ; dct:source sources:source1 ] } ' +
        	'  OPTIONAL { ?prs nbf:image [ schema:image ?image2 ; dct:source sources:source10 ] } ' +
        	'  OPTIONAL { ?prs nbf:image/schema:image ?image3 } ' +
        	'  BIND (COALESCE(?image1, ?image2, ?image3) AS ?image) ' +
        	' ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname . }' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname . }' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime } ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime } ' +
        	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-", COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan) ' +
        	'} ORDER BY UCASE(?fname) ?gname ';
        
        
    	var queryForPlacePopover =
    		'SELECT * WHERE { ' +
	    	'  <RESULT_SET> ' +
	    	'  ?id skos:prefLabel ?label . ' +
	    	'  FILTER (lang(?label)="fi") ' +
	    	'  OPTIONAL { ' +
	    	'    ?id geo:lat ?latitude . ' +
	    	'    ?id geo:long ?longitude  ' +
	    	'  } ' +
	    	'} LIMIT 1 ';
    	
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig);

        
        function getPopover(id) {
        	var qry = prefixes + queryForPopover;
            var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getPlacePopover(id) {
        	id = id.replace('/www.ldf.fi/', '/ldf.fi/');
        	var constraint = 'VALUES ?id { <' + id + '> } . ';
        	var qry = prefixes + queryForPlacePopover.replace('<RESULT_SET>', constraint);
        	return endpoint.getObjectsNoGrouping(qry)
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getHrefPopover(href) {
            var constraint = 'VALUES ?href { "' + href + '" } ';
            return endpoint.getObjectsNoGrouping(prefixes + queryForHref.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getPopoverGroup(arr) {
        	var ids = arr.map(function(st) {
        		if (st.match(/^p\d+$/)) {
        			// 	st is identifier 'p1234'
        			return 'nbf:'+st;
        		} 
        		// st is full url 'http://ldf.fi/nbf/p1234'
        		return '<'+st+'>';
        	}).join(' ');
        	
        	var qry = prefixes + queryForPopoverGroup;
            var constraint = 'VALUES ?id2 { ' + ids + ' } . ';
            
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result;
            });
        }
     
    }
})();
