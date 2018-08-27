(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('nbfService', nbfService);

    /* @ngInject */
    function nbfService($q, $location, _, facetService, FacetResultHandler, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = facetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = facetService.getFacetOptions;
        // Update sorting URL params.
        this.updateSortBy = updateSortBy;
        // Get the CSS class for the sort icon.
        this.getSortClass = getSortClass;
        // Get the details of a single person.
        this.getPerson = getPerson;
        this.getSimilar = getSimilar;
        this.getAuthors = getAuthors;
        this.getByAuthor = getByAuthor;
        this.getAuthoredBios = getAuthoredBios;
        this.getByReferences = getByReferences;
        this.getBios = getBios;
        this.getPopover = getPopover;
        this.getPopoverGroup = getPopoverGroup;
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
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
        ' SELECT DISTINCT * WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  }' +
        '  FILTER not exists { ?id owl:sameAs [] }' +
        '  ?id skosxl:prefLabel ?plabel . ' +
        '  		OPTIONAL { ?plabel schema:givenName ?givenName . }' +
        '  		OPTIONAL { ?plabel schema:familyName ?familyName . }' +
        '' +
        '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
        '  OPTIONAL { ?id nbf:ulan ?ulan . }' +
        '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
        '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
        '  OPTIONAL { ?id nbf:fennica ?fennica . }' +
        '  OPTIONAL { ?id nbf:warsampo ?warsampo . }' +
        '  OPTIONAL { ?id nbf:norssi ?norssi . }' +
        '  OPTIONAL { ?id nbf:blf ?blf . }' +
        '  OPTIONAL { ?id nbf:website ?website . }' +
        '  OPTIONAL { ?id nbf:genicom ?genicom . }' +
        '  OPTIONAL { ?id nbf:genitree ?genitree . }' +
        '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
        '  OPTIONAL { ?id nbf:kirjasampo ?kirjasampo . }' +
        '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
        '  OPTIONAL { ?id foaf:focus ?prs . ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:place/skos:prefLabel ?birthPlace } ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:time/skos:prefLabel ?birthDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:time/skos:prefLabel ?deathDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:place/skos:prefLabel ?deathPlace }' +
        '  		OPTIONAL { ?prs schema:gender ?gender . }' +
        '  		OPTIONAL { ?prs nbf:image [ schema:image ?images ] }' +
        '  		OPTIONAL { ?prs ^bioc:inheres_in ?occupation_id . ' +
        '  			?occupation_id a nbf:Occupation ; skos:prefLabel ?occupation ' +
        '  			OPTIONAL { ?occupation_id nbf:related_company ?company . }' +
        '		}' +
        '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
        '  		OPTIONAL { ?prs nbf:has_biography ?bio . ' +
        '  			OPTIONAL { ?bio nbf:has_paragraph [ nbf:content ?lead_paragraph ; nbf:id "0"^^xsd:integer  ] }' +
        '  		}' +
        ' }' +
        ' }';

        var detailQuery =
            ' SELECT DISTINCT * WHERE {' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  ?id skosxl:prefLabel ?plabel . ' +
            '  		OPTIONAL { ?plabel schema:givenName ?givenName . }' +
            '  		OPTIONAL { ?plabel schema:familyName ?familyName . }' +
            ' ' +
            '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
            '  OPTIONAL { ?id nbf:ulan ?ulan . }' +
            '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
            '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
            '  OPTIONAL { ?id nbf:fennica ?fennica . }' +
            '  OPTIONAL { ?id nbf:blf ?blf . }' +
            '  OPTIONAL { ?id nbf:website ?website . }' +
            '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
            '  OPTIONAL { ?id nbf:warsampo ?warsampo . }' +
            '  OPTIONAL { ?id nbf:norssi ?norssi . }' +
            '  OPTIONAL { ?id nbf:kirjasampo ?kirjasampo . }' +
            '  OPTIONAL { ?id nbf:website ?website . }' +
            '  OPTIONAL { ?id nbf:genicom ?genicom . }' +
            '  OPTIONAL { ?id nbf:genitree ?genitree . }' +
            '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
            '  OPTIONAL { ?idorg (owl:sameAs*|^owl:sameAs+)/dct:source/skos:prefLabel ?source . }' +
            '  OPTIONAL { { ?id bioc:has_family_relation [ ' +
            '  		bioc:inheres_in ?rel ; ' +
            '  		a/skos:prefLabel ?relative__type ] . } ' +
            '		UNION { ?rel bioc:has_family_relation [ ' +
            '  		bioc:inheres_in ?id ; ' +
            '  		bioc:inverse_role/skos:prefLabel ?relative__type ] . } ' +
            '		?rel owl:sameAs* ?relative__id . ' +
            '		FILTER NOT EXISTS { ?relative__id owl:sameAs [] } ' +
            '		' +
            '  		FILTER (LANG(?relative__type)="fi") ' +
            '  		?relative__id skosxl:prefLabel ?relative__label . ' +
            '  		OPTIONAL { ?relative__label schema:familyName ?relative__familyName } ' +
            '  		OPTIONAL { ?relative__label schema:givenName ?relative__givenName } ' +
            '  		BIND (REPLACE(CONCAT( COALESCE(?relative__givenName,"") ," ", COALESCE(?relative__familyName,"")),"[(][^)]+[)]\\\\s*","") AS ?relative__name)  ' + 
            '  } ' +
            '  OPTIONAL { ?id foaf:focus ?prs . ' +
            '  		OPTIONAL { ?prs ^crm:P98_brought_into_life ?bir . ' +
            '  			OPTIONAL { ?bir nbf:place/skos:prefLabel ?birthPlace } ' +
            '  			OPTIONAL { ?bir nbf:time/skos:prefLabel ?birthDate }' +
            '		} ' +
            '  		OPTIONAL { ?prs ^crm:P100_was_death_of ?dea . ' +
            '			OPTIONAL { ?dea nbf:time/skos:prefLabel ?deathDate }' +
            '  			OPTIONAL { ?dea nbf:place/skos:prefLabel ?deathPlace }' +
            '		} ' +
            '  		OPTIONAL { ?prs nbf:image [ schema:image ?images ; dct:source/skos:prefLabel ?imagesources ] }' +
            '  		OPTIONAL { ?prs ^bioc:inheres_in ?occupation_id . ' +
            '  			?occupation_id a nbf:Occupation ; skos:prefLabel ?occupation }' +
            '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
            '  }' +
            ' }';

        var bioQuery =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
            ' ?id owl:sameAs*|^owl:sameAs ?prs .' +
            ' ?prs foaf:focus/nbf:has_biography ?bio .' +
            '  OPTIONAL { ?bio dct:source ?source . ?source skos:prefLabel ?database }' +
            '  OPTIONAL { ?bio nbf:authors ?author_text }' +
            // '  OPTIONAL { ?bio schema:author ?author__url . ?author__url skos:prefLabel ?author__label }' +
            '  OPTIONAL { ?bio schema:dateCreated ?created }' +
            '  OPTIONAL { ?bio schema:dateModified ?modified }' +
            '  OPTIONAL { ?bio schema:relatedLink ?link }'  +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "0"^^xsd:integer ; nbf:content ?lead_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "1"^^xsd:integer ; nbf:content ?description    ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "2"^^xsd:integer ; nbf:content ?family_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "3"^^xsd:integer ; nbf:content ?parent_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "4"^^xsd:integer ; nbf:content ?spouse_paragraph ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "5"^^xsd:integer ; nbf:content ?child_paragraph  ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "6"^^xsd:integer ; nbf:content ?medal_paragraph  ] }' +
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' +
            '} ORDER BY str(?source)';


        //	http://yasgui.org/short/HyNJegbGQ
        var querySimilar = 
            'SELECT DISTINCT ?prs ?label ' +
        	'WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  ?dst a nbf:Distance ; ' +
        	'        bioc:relates_to ?id, ?prs ; ' +
        	'        bioc:value ?value . ' +
        	'  FILTER (?prs!=?id)  ' +
        	//'  OPTIONAL { ?prs skosxl:prefLabel/schema:familyName ?fname . } ' +
        	//'  OPTIONAL { ?prs skosxl:prefLabel/schema:givenName ?gname . }  ' +
        	//'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label) ' +
        	'} ORDER BY DESC(?value) LIMIT 16 ';
        
        //	
        var queryAuthors = 
        	'SELECT DISTINCT (?author AS ?author__url) ?author__name WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  ?id owl:sameAs*|^owl:sameAs ?prs . ' +
        	'  ?prs foaf:focus/nbf:has_biography/schema:author ?author . ' +
        	'  ?author skosxl:prefLabel ?author__label . ' +
        	'  OPTIONAL { ?author__label schema:familyName ?author__fname } ' +
        	'  OPTIONAL { ?author__label schema:givenName ?author__gname } ' +
        	'  BIND (CONCAT(COALESCE(?author__gname, "")," ",COALESCE(?author__fname, "")) AS ?author__name) ' +
        	'} ORDER BY ?author__fname ?author__gname ';
        
        //	http://yasgui.org/short/ByvETV0xm
        var queryByAuthor =
        	'SELECT DISTINCT (?id as ?id__url) ?id__name WHERE { ' +
        	'  { ' +
        	'  SELECT DISTINCT ?author ?id2 ?prs2 ' +
        	'    WHERE { ' +
        	'        <RESULT_SET> ' +
        	'        ?id2 owl:sameAs*|^owl:sameAs ?prs2 . ' +
        	'        ?prs2 foaf:focus/nbf:has_biography/nbf:authors ?author . ' +
        	'    } ' +
        	'  } ' +
        	'  ?prs foaf:focus/nbf:has_biography/nbf:authors ?author . ' +
        	'  ?prs owl:sameAs* ?id . ' +
        	'  FILTER NOT EXISTS {?id owl:sameAs []} ' +
        	'  FILTER (?id != ?prs2 && ?id != ?id2) ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname } ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname } ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?id__name) ' +
        	'} ORDER BY ?id__fname ?id__gname ';
        
        var queryAuthoredBios =
        	'SELECT DISTINCT  (?id as ?id__url) ?id__name WHERE { ' +
        	'  { <RESULT_SET> } ' +
        	'  ?id foaf:focus/nbf:has_biography/schema:author ?author . ' +
        	'   ' +
        	'  ?id skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname } ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname } ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?id__name) ' +
        	'} ORDER BY ?id__fname ?id__gname ';
        
        //	http://yasgui.org/short/SkYYOLRxm
        var queryByReferences =
        	'SELECT distinct (?id as ?id__url) ?id__name WHERE { ' +
        	' <RESULT_SET> ' +
        	' SERVICE <http://ldf.fi/nbf-nlp/sparql> { ' +
        	'   ?par <http://purl.org/dc/terms/isPartOf>/<http://ldf.fi/nbf/biography/data#bioId> ?id2 ; ' +
        	'     	<http://purl.org/dc/elements/1.1/source>/<http://ldf.fi/nbf/biography/data#link> ?target_link . ' +
        	'    BIND(REPLACE(STR(?target_link),".*?(kb/artikkeli/\\\\d+/)","$1") as ?target)  ' +
        	' } ' +
        	'  ' +
        	'  ?id nbf:formatted_link ?target ;  ' +
        	'  		skosxl:prefLabel ?id__label . ' +
        	'  OPTIONAL { ?id__label schema:familyName ?id__fname } ' +
        	'  OPTIONAL { ?id__label schema:givenName ?id__gname } ' +
        	'  BIND (CONCAT(COALESCE(?id__gname, "")," ",COALESCE(?id__fname, "")) AS ?id__name) ' +
        	'} ORDER BY ?id__fname ?id__gname ';
        
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
        	'   ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:familyName ?fname . }    ' +
        	'  OPTIONAL { ?id skosxl:prefLabel/schema:givenName ?gname . }    ' +
        	'  BIND (CONCAT(COALESCE(?gname, "")," ",COALESCE(?fname, "")) AS ?label)        ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime }    ' +
        	'  OPTIONAL { ?id foaf:focus/^crm:P100_was_death_of/nbf:time/gvp:estStart ?dtime }    ' +
        	'  BIND (CONCAT("(", COALESCE(STR(YEAR(?btime)), " "), "-", COALESCE(STR(YEAR(?dtime)), " "), ")") AS ?lifespan)     ' +
        	'} ORDER BY UCASE(?fname) ?gname ';
        
        // The SPARQL endpoint URL
        var endpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var resultOptions = {
            mapper: personMapperService,
            queryTemplate: query,
            prefixes: prefixes,
            paging: true,
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointConfig, resultOptions);

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);

        function getResults(facetSelections) {
            return resultHandler.getResults(facetSelections, getSortBy());
        }

        function getPerson(id) {
            var qry = prefixes + detailQuery;
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . ';
            return endpoint.getObjects(qry.replace('<RESULT_SET>', constraint))
            .then(function(person) {
            	if (person.length) {
                    return person[person.length-1];
                }
                return $q.reject('Not found');
            });
        }

        function getBios(id) {
            var qry = prefixes + bioQuery;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
                return result;
            });
        }
        
        function getSimilar(id) {
            var qry = prefixes + querySimilar;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
                return result;
            });
        }

        function getAuthors(id) {
            var qry = prefixes + queryAuthors;
            var constraint = 'VALUES ?id { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
        }
        
        function getByAuthor(id) {
            var qry = prefixes + queryByAuthor;
            var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
        }

        function getAuthoredBios(id) {
            var qry = prefixes + queryAuthoredBios;
            //	'VALUES ?prs { <' + id + '> } . ?prs (owl:sameAs*|^owl:sameAs*) ?id . '
            var constraint = 'VALUES ?prs { <' + id + '> } . ?prs (owl:sameAs*|^owl:sameAs*) ?author . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
        }
        
        function getByReferences(id) {
            var qry = prefixes + queryByReferences;
            var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result;
            });
        }
        
        function getPopover(id) {
        	var qry = prefixes + queryForPopover;
            var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result[0];
            });
        }
        
        function getPopoverGroup(arr) {
        	var ids = '<'+arr.join('> <')+'>';
        	var qry = prefixes + queryForPopoverGroup;
            var constraint = 'VALUES ?id2 { ' + ids + ' } . ';
            return endpoint.getObjectsNoGrouping(qry.replace('<RESULT_SET>', constraint))
            .then(function(result) {
            	return result;
            });
        }
        
        function updateSortBy(sortBy) {
            var sort = $location.search().sortBy || '?ordinal';
            if (sort === sortBy) {
                $location.search('desc', $location.search().desc ? null : true);
            }
            $location.search('sortBy', sortBy);
        }

        function getSortBy() {
            var sortBy = $location.search().sortBy;
            if (!_.isString(sortBy)) {
                sortBy = '?ordinal';
            }
            var sort;
            
            if (sortBy === '?ordinal') {
	            if ($location.search().desc) {
	                sort = sortBy;
	            } else {
	                sort = 'DESC(' + sortBy + ')';
	            }
            } else {
            	if ($location.search().desc) {
	                sort = 'DESC(' + sortBy + ')';
	            } else {
	                sort = sortBy;
	            }
            }
            return sortBy === '?ordinal' ? sort : sort + ' ?ordinal';
        }

        function getSortClass(sortBy, numeric) {
            var sort = $location.search().sortBy || '?ordinal';
            var cls = numeric ? 'glyphicon-sort-by-order' : 'glyphicon-sort-by-alphabet';
            
            if (sortBy === '?ordinal') {
	            if (sort === sortBy) {
	                if ($location.search().desc) {
	                    return cls;
	                }
	                return cls + '-alt';
	            }
            } else {
            	if (sort === sortBy) {
	                if ($location.search().desc) {
	                    return cls + '-alt';
	                }
	                return cls;
	            }
            }
        }
    }
})();
