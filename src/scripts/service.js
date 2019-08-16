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
        
        this.getAuthors = getAuthors;
        this.getByAuthor = getByAuthor;
        this.getAuthoredBios = getAuthoredBios;
        this.getBios = getBios;
        this.getReferences = getReferences;
        this.getByReferences = getByReferences;
        this.getPerson = getPerson;
        this.getRelatives = getRelatives;
        this.getSecondRelatives = getSecondRelatives;
        this.getSimilar = getSimilar;
        
        //	init login
        this.getPortal = getPortal;
        
        /* Implementation */

        var prefixes =
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX categories: <http://ldf.fi/nbf/categories/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/>' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/>' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#>' +
        ' PREFIX nbf: <http://ldf.fi/nbf/>' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#>' +
        ' PREFIX rels: <http://ldf.fi/nbf/relations/> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
        ' PREFIX sources: <http://ldf.fi/nbf/sources/>' +
        ' PREFIX schema: <http://schema.org/>' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#>' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
        ' SELECT DISTINCT * WHERE {' +
        '  { ' +
        '  <RESULT_SET> ' +
        '  }' +
        '  FILTER not exists { ?id owl:sameAs [] }' +
        '  ?id skosxl:prefLabel ?plabel . ' +
        '  OPTIONAL { ?plabel schema:familyName ?familyName . }' +
        '  OPTIONAL { ?plabel schema:givenName ?givenName . }' +
        '' +
        '  OPTIONAL { ?id nbf:blf ?blf . } ' +
        '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
        '  OPTIONAL { ?id nbf:fennica ?fennica . }' +
        '  OPTIONAL { ?id nbf:genicom ?genicom . }' +
        '  OPTIONAL { ?id nbf:kirjasampo ?kirjasampo . }' +
        '  OPTIONAL { ?id nbf:norssi ?norssi . }' +
        '  OPTIONAL { ?id nbf:genitree ?genitree . }' +
        '  OPTIONAL { ?id nbf:warsampo ?warsampo . }' +
        '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
        '  OPTIONAL { ?id nbf:ulan ?ulan . }' +
        '  OPTIONAL { ?id nbf:website ?website . }' +
        '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
        '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
        '  OPTIONAL { ?id nbf:yo1853 ?yo1853 . }' +
        '  OPTIONAL { ?id schema:relatedLink ?kansallisbiografia . }' +
        '  OPTIONAL { ?id foaf:focus ?prs . ' +
        '  	 OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:place/skos:prefLabel ?birthPlace } ' +
        '  		OPTIONAL { ?prs ^crm:P98_brought_into_life/nbf:time/skos:prefLabel ?birthDate . }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:place/skos:prefLabel ?deathPlace }' +
        '  		OPTIONAL { ?prs ^crm:P100_was_death_of/nbf:time/skos:prefLabel ?deathDate . }' +
        '  		OPTIONAL { ?prs schema:gender ?gender . }' +
        '  		OPTIONAL { ?prs nbf:image [ schema:image ?images ; dct:source ?imagesources ] }' +
        '  		OPTIONAL { ?prs bioc:has_profession ?occupation_id . ' +
        '  		   ?occupation_id a nbf:Title ; skos:prefLabel ?occupation ' +
        '  		  OPTIONAL { ?occupation_id nbf:related_company ?company . }' +
        '		}' +
        '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
        '  		OPTIONAL { ?prs nbf:has_biography ?bio . ' +
        '  		  OPTIONAL { ?bio nbf:has_paragraph [ nbf:content ?lead_paragraph ; nbf:id "0"^^xsd:integer  ] }' +
        '  		}' +
        '   }' +
        ' }';

        var detailQuery =
            ' SELECT DISTINCT * WHERE {' +
            '  { <RESULT_SET> } ' +
            '  ?id skosxl:prefLabel ?plabel . ' +
            '  	 OPTIONAL { ?plabel schema:familyName ?familyName . }' +
            '  	 OPTIONAL { ?plabel schema:givenName ?givenName . }' +
            '' +
            '  OPTIONAL { ?id nbf:blf ?blf . }' +
            '  OPTIONAL { ?id nbf:eduskunta ?eduskunta . }' +
            '  OPTIONAL { ?id nbf:fennica ?fennica . }' +
            '  OPTIONAL { ?id nbf:genitree ?genitree . }' +
            '  OPTIONAL { ?id nbf:genicom ?genicom . }' +
            '  OPTIONAL { ?id nbf:kirjasampo ?kirjasampo . }' +
            '  OPTIONAL { ?id nbf:norssi ?norssi . }' +
            '  OPTIONAL { ?id nbf:viaf ?viaf . }' +
            '  OPTIONAL { ?id nbf:warsampo ?warsampo . }' +
            '  OPTIONAL { ?id nbf:website ?website . }' +
            '  OPTIONAL { ?id nbf:wikidata ?wikidata . }' +
            '  OPTIONAL { ?id nbf:wikipedia ?wikipedia . }' +
            '  OPTIONAL { ?id nbf:ulan ?ulan . } ' +
            '  OPTIONAL { ?id nbf:yo1853 ?yo1853 . }' +
            '  OPTIONAL { ?idorg (owl:sameAs*|^owl:sameAs+)/schema:relatedLink ?kansallisbiografia . }' +
            '  OPTIONAL { ?idorg (owl:sameAs*|^owl:sameAs+)/dct:source/skos:prefLabel ?source . }' +
            ' ' +
            '  OPTIONAL { ?id foaf:focus ?prs . ' +
            '  	OPTIONAL { ?prs ^crm:P98_brought_into_life ?bir . ' +
            '  			OPTIONAL { ?bir nbf:place ?birth__id . ?birth__id skos:prefLabel ?birth__label } ' +
            '  			OPTIONAL { ?bir nbf:time/skos:prefLabel ?birthDate }' +
            '		} ' +
            '  		OPTIONAL { ?prs ^crm:P100_was_death_of ?dea . ' +
            '			OPTIONAL { ?dea nbf:time/skos:prefLabel ?deathDate }' +
            '  			OPTIONAL { ?dea nbf:place ?death__id . ?death__id skos:prefLabel ?death__label }' +
            '		} ' +
            '  		OPTIONAL { ?prs nbf:image [ schema:image ?images ; dct:source ?is ] ' +
            '			OPTIONAL { ?is skos:prefLabel ?il } ' +
            '			BIND (COALESCE(?il, ?is) AS ?imagesources ) ' +
            '	    }' +
            '  		OPTIONAL { ?prs bioc:has_profession ?occupation_id . ' +
            '  			?occupation_id a nbf:Title ; skos:prefLabel ?occupation }' +
            '  		OPTIONAL { ?prs nbf:has_category ?category . }'  +
            '  }' +
            ' }';
        
        //	http://yasgui.org/short/oZdfGXpuD
        var relativeQuery =
        	'SELECT DISTINCT ?type (?relative__id AS ?id2) (SAMPLE(?name2) AS ?name) ' +
        	'WHERE { <RESULT_SET>  ' +
        	'  VALUES (?class ?order) { ' +
        	'    ( rels:Father 0)' +
        	'    ( rels:Mother 1)' +
        	'    ( rels:Parent 2)' +
        	'    ( rels:Wife 3)' +
        	'    ( rels:Husband 3)' +
        	'    ( rels:Spouse 3)' +
        	'    ( rels:Daughter 4)' +
        	'    ( rels:Child 4)' +
        	'    ( rels:Son 4 ) } ' +
        	'  { ?id bioc:has_family_relation [  ' +
        	'       bioc:inheres_in ?rel ; ' +
        	'       a ?class ; ' +
        	'        a/skos:prefLabel ?type ] .  ' +
        	'  } UNION ' +
        	'  { ?rel bioc:has_family_relation [  ' +
        	'        bioc:inheres_in ?id ;  ' +
        	'       a ?class ; ' +
        	'        bioc:inverse_role/skos:prefLabel ?type ] .  ' +
        	'  }  ' +
        	'  FILTER (LANG(?type)="fi")' +
        	'  ?rel owl:sameAs* ?relative__id . ' +
        	'  FILTER NOT EXISTS { ?relative__id owl:sameAs [] } ' +
        	'  ?relative__id skosxl:prefLabel ?relative__label . ' +
        	'  OPTIONAL { ?relative__label schema:familyName ?relative__familyName } ' +
        	'  OPTIONAL { ?relative__label schema:givenName ?relative__givenName } ' +
        	'  BIND (REPLACE(CONCAT( COALESCE(?relative__givenName,"") ," ", COALESCE(?relative__familyName,"")),"[(][^)]+[)]\\\\s*","") AS ?name2)  ' +
        	'  OPTIONAL { ?relative__id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?btime } ' +
        	'} GROUP BY ?order ?type ?relative__id ORDER BY ?order ?btime ';
        
        //	http://yasgui.org/short/DZ82Sid3_ <- may not be up to date
        var secondRelativeQuery = 
        	'SELECT DISTINCT ?type (?relative__id AS ?id2) (SAMPLE(?name2) AS ?name) ?order ' +
			'  WHERE { <RESULT_SET> ' +
			'  VALUES (?class ?order) { ' +
			'    (rels:GreatGrandmother 1) ' +
			'    (rels:GreatGrandfather 1) ' +
			'    (rels:GrandMother 2) ' +
			'    (rels:GrandFather 2) ' +
			'    (rels:Uncle 3) ' +
			'    (rels:Aunt 3) ' +
			'    (rels:MothersBrother 3) ' +
			'    (rels:MotherInLaw 4) ' +
			'    (rels:FatherInLaw 4) ' +
			'    (rels:Sister 5) ' +
			'    (rels:Brother 5) ' +
			'    (rels:Cousin 6) ' +
			'    (rels:SecondCousin 7) ' +
			'    (rels:ThirdCousin 8) ' +
			'    (rels:FourthCousin 9) ' +
			'    (rels:SisterInLaw 10) ' +
			'    (rels:BrotherInLaw 10) ' +
			'    (rels:BrothersSon 11) ' +
			'    (rels:SistersSon 11) ' +
			'    (rels:BrothersDaughter 11) ' +
			'    (rels:SistersDaughter 11) ' +
			'    (rels:SonInLaw 12) ' +
			'    (rels:DaughterInLaw 12) ' +
			'    (rels:Grandchild 13) ' +
			'    (rels:GreatGrandchild 14) ' +
			'	 } ' +
			'  { ?id bioc:has_family_relation [ ' +
			'        bioc:inheres_in ?rel ; ' +
			'        a ?class ; ' +
			'        a/skos:prefLabel ?type ] . ' +
			'  } UNION ' +
			'  { ?rel bioc:has_family_relation [ ' +
			'        bioc:inheres_in ?id ; ' +
			'        a ?class ; ' +
			'        bioc:inverse_role/skos:prefLabel ?type ] . ' +
			'  } ' +
			'  FILTER (LANG(?type)="fi") ' +
			'  ?rel owl:sameAs* ?relative__id . ' +
			'  FILTER NOT EXISTS { ?relative__id owl:sameAs [] } ' +
			'  ?relative__id skosxl:prefLabel ?relative__label . ' +
			'  OPTIONAL { ?relative__label schema:familyName ?relative__familyName } ' +
			'  OPTIONAL { ?relative__label schema:givenName ?relative__givenName } ' +
			'  BIND (REPLACE(CONCAT( COALESCE(?relative__givenName,"") ," ", COALESCE(?relative__familyName,"")),"[(][^)]+[)]\\\\s*","") AS ?name2) ' +
			'} GROUP BY ?order ?type ?relative__id ORDER BY ?order ';
        
        var bioQuery =
            'SELECT DISTINCT * WHERE {' +
            ' { <RESULT_SET> }' +
            ' ?id owl:sameAs*|^owl:sameAs ?prs .' +
            ' ?prs foaf:focus/nbf:has_biography ?bio .' +
            '  OPTIONAL { ?bio dct:source ?source . ?source skos:prefLabel ?database }' + /* MOVED TO biography.service.js
            '  OPTIONAL { ?bio nbf:authors ?author_text }' +
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
            '  OPTIONAL { ?bio nbf:has_paragraph [ nbf:id "7"^^xsd:integer ; nbf:content ?source_paragraph ] }' + */
            '} ORDER BY str(?source)';


        //	http://yasgui.org/short/HyNJegbGQ
        var querySimilar = 
            'SELECT DISTINCT (GROUP_CONCAT(DISTINCT(?prs); separator=",") as ?people) (COUNT(DISTINCT ?prs) AS ?count) ' +
        	'WHERE {' +
        	'  { <RESULT_SET> } ' +
        	'  ?dst a nbf:Distance ; ' +
        	'       bioc:relates_to ?id, ?prs ; ' +
        	'       nbf:value ?value . ' +
        	'  FILTER (?prs!=?id)  ' +
        	'} ORDER BY DESC(?value) LIMIT 16 ';
        
        //	
        var queryAuthors = 
        	'SELECT DISTINCT (GROUP_CONCAT(DISTINCT(?author); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE {' +
        	'  <RESULT_SET>' +
        	'  ?id owl:sameAs*|^owl:sameAs ?prs . ' +
        	'  ?prs foaf:focus/nbf:has_biography/schema:author ?author . ' +
        	'}  ';
        
        //	http://yasgui.org/short/ByvETV0xm
        var queryByAuthor =
        	'SELECT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE {' +
        	'  { ' +
        	'  SELECT DISTINCT ?author ?id2 ?prs2 ' +
        	'    WHERE { ' +
        	'       <RESULT_SET> ' +
        	'       ?id2 owl:sameAs*|^owl:sameAs ?prs2 . ' +
        	'       ?prs2 foaf:focus/nbf:has_biography/nbf:authors ?author . ' +
        	'    } ' +
        	'  } ' +
        	'  ?prs foaf:focus/nbf:has_biography/nbf:authors ?author . ' +
        	'  ?prs owl:sameAs* ?id . ' +
        	'  FILTER NOT EXISTS {?id owl:sameAs []} ' +
        	'  FILTER (?id != ?prs2 && ?id != ?id2) ' +
        	'} ';
        
        var queryAuthoredBios =
        	'SELECT DISTINCT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE ' +
        	'  { <RESULT_SET> ' +
        	'  ?id foaf:focus/nbf:has_biography/schema:author ?author . ' +
        	'  } ' ;
        
        var queryReferences = 
        	'SELECT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE { ' +
        	' <RESULT_SET> ' +
        	'  { ?id2 nbf:in_bio ?id } ' +
        	'  UNION ' +
        	'  { ?id nbf:refers/nbf:target ?id2 } ' +
        	'  FILTER (?id!=?id2) ' +
        	' }';
        
        var queryByReferences =
        	'SELECT (GROUP_CONCAT(DISTINCT(?id); separator=",") as ?people) (COUNT(DISTINCT ?id) AS ?count) WHERE {   ' +
        	' <RESULT_SET> ' +
        	'  { ?id nbf:in_bio ?id2 ; ' +
        	'        owl:sameAs*/foaf:focus/nbf:has_biography [] } ' +
        	'  UNION  ' +
        	'  { ?id2 nbf:refers/nbf:target ?id . ' +
        	'    ?id owl:sameAs*/foaf:focus/nbf:has_biography [] } ' + 
        	'  FILTER (?id!=?id2) ' +
        	'} ';
        
        
        var queryPortal = 'SELECT * WHERE { ?x ?y ?z } LIMIT 1 ';
        
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
        	var res = resultHandler.getResults(facetSelections, getSortBy());
            return res;
        }
        
        function getPerson(id) {
        	
        	var regex = /^p[0-9_]+$/;
        	if (regex.test(id)) { id = 'http://ldf.fi/nbf/'+id; }
        	
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . FILTER NOT EXISTS { ?id owl:sameAs [] } ';
            var qry = prefixes + detailQuery.replace('<RESULT_SET>', constraint);
            console.log(qry);
            return endpoint.getObjects(qry)
            .then(function(person) {

            	if (person.length) {
                    return person[person.length-1];
                }
                return $q.reject('Not found');
            });
        }

        function getBios(id) {
        	
        	var constraint = 'VALUES ?id { <' + id + '> } . ';
        	var qry = prefixes + bioQuery.replace('<RESULT_SET>', constraint);
            
            return endpoint.getObjectsNoGrouping(qry)
            .then(function(result) {
                return result;
            });
        }

        function getRelatives(id) {
        	var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . FILTER NOT EXISTS { ?id owl:sameAs [] } ';
            var qry = prefixes + relativeQuery.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getSecondRelatives(id) {
            var constraint = 'VALUES ?idorg { <' + id + '> } . ?idorg owl:sameAs* ?id . FILTER NOT EXISTS { ?id owl:sameAs [] } ';
            var qry = prefixes + secondRelativeQuery.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
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
        	var constraint = 'VALUES ?id { <' + id + '> } . ';
            var qry = prefixes + queryAuthors.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getByAuthor(id) {
        	var constraint = 'VALUES ?id2 { <' + id + '> } . ';
            var qry = prefixes + queryByAuthor.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }

        function getAuthoredBios(id) {
        	var constraint = 'VALUES ?prs { <' + id + '> } . ?prs (owl:sameAs*|^owl:sameAs*) ?author . ';
            var qry = prefixes + queryAuthoredBios.replace('<RESULT_SET>', constraint);
            return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getByReferences(id) {
        	var constraint = 'VALUES ?id2 { <' + id + '> } . ';
        	var qry = prefixes + queryByReferences.replace('<RESULT_SET>', constraint);
        	return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getReferences(id) {
        	var constraint = 'VALUES ?id2 { <' + id + '> } . ';
        	var qry= prefixes + queryReferences.replace('<RESULT_SET>', constraint);
        	return endpoint.getObjectsNoGrouping(qry);
        }
        
        function getPortal() {
        	return endpoint.getObjectsNoGrouping(prefixes+queryPortal)
        		.then(function(result) { return result; });
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
