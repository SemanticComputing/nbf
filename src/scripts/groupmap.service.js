(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('groupmapService', groupmapService);

    /* @ngInject */
    function groupmapService($q, $location, _, FacetResultHandler, SPARQL_ENDPOINT_URL,
            AdvancedSparqlService, personMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getResults2 = getResults2;
        
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;
        // Update sorting URL params.
        this.updateSortBy = updateSortBy;
        // Get the CSS class for the sort icon.
        this.getSortClassOLD = getSortClass;

        /* Implementation */

        var facets = {
            entryText: {
                facetId: 'entryText',
                graph: '<http://ldf.fi/nbf/people>',
                name: 'Haku',
                enabled: true
            },
            dataset: {
                facetId: 'dataset',
                predicate: '<http://purl.org/dc/terms/source>',
                name: 'Tietokanta'
            },
            slider: {
                facetId: 'slider',
                name: 'Rajaa henkilöiden syntymäaika',
                predicate: ('<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/' +
                    '<http://ldf.fi/nbf/time>/<http://vocab.getty.edu/ontology#estStart>'),
                enabled: true
            },
            link: {
                facetId: 'link',
                choices: [
                    {
                        id: 'wikipedia',
                        pattern: '?id <http://ldf.fi/nbf/wikipedia> [] .',
                        label: 'Wikipedia'
                    },
                    {
                        id: 'wikidata',
                        pattern: '?id <http://ldf.fi/nbf/wikidata> [] .',
                        label: 'Wikidata'
                    },
                    {
                        id: 'sotasampo',
                        pattern: '?id <http://ldf.fi/nbf/warsampo> [] .',
                        label: 'Sotasampo'
                    },
                    {
                        id: 'norssit',
                        pattern: '?id <http://ldf.fi/nbf/norssi> [] .',
                        label: 'Norssit'
                    },
                    {
                        id: 'kirjasampo',
                        pattern: '?id <http://ldf.fi/nbf/kirjasampo> [] . ',
                        label: 'Kirjasampo'
                    },
                    {
                        id: 'blf',
                        pattern: '?id <http://ldf.fi/nbf/blf> [] .',
                        label: 'BLF'
                    },
                    {
                        id: 'ulan',
                        pattern: '?id <http://ldf.fi/nbf/ulan> [] .',
                        label: 'ULAN'
                    },
                    {
                        id: 'viaf',
                        pattern: '?id <http://ldf.fi/nbf/viaf> [] .',
                        label: 'VIAF'
                    },
                    {
                        id: 'genicom',
                        pattern: '?id <http://ldf.fi/nbf/genicom> [] .',
                        label: 'Geni.com'
                    },
                    {
                        id: 'website',
                        pattern: '?id <http://ldf.fi/nbf/website> [] .',
                        label: 'Kotisivu'
                    },
                    {
                        id: 'eduskunta',
                        pattern: '?id <http://ldf.fi/nbf/eduskunta> [] .',
                        label: 'Eduskunta'
                    }
                ],
                enabled: true,
                name: 'Linkit'
            },
            period: {
                facetId: 'period',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_period>/<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'Ajanjakso',
                enabled: true
            },
            author: {
                facetId: 'author',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography>/<http://schema.org/author>',
                name: 'Kirjoittaja'
            },
            birthYear: {
                facetId: 'birthYear',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>/<http://ldf.fi/nbf/time>',
                name: 'Synnyinaika',
                enabled: true
            },
            place: {
                facetId: 'place',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>)/<http://ldf.fi/nbf/place>',
                //predicate: '<http://xmlns.com/foaf/0.1/focus>/(^<http://www.cidoc-crm.org/cidoc-crm/P98_brought_into_life>|^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>)/<http://ldf.fi/nbf/place>',
                name: 'Syntymäpaikka',
                hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>',
                depth: 5, 
                enabled: true
            },
            deathYear: {
                facetId: 'birthYear',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://www.cidoc-crm.org/cidoc-crm/P100_was_death_of>/<http://ldf.fi/nbf/time>',
                name: 'Kuolinaika',
                enabled: true
            },
            title: {
                facetId: 'title',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/has_title>',
                name: 'Arvo, ammatti tai toiminta',
                hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>',
                depth: 3,
                enabled: true
            },
            company: {
                facetId: 'company',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/^<http://ldf.fi/schema/bioc/inheres_in>/<http://ldf.fi/nbf/related_company>',
                name: 'Yritys tai yhteisö',
                enabled: true
            },
            category: {
                facetId: 'category',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_category>',
                name: 'Toimiala',
                enabled: true
            },
            gender: {
                facetId: 'gender',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/sukupuoli>',
                name: 'Sukupuoli',
                enabled: true
            },
            keywords: {
                facetId: 'keywords',
                predicate: '<http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography>/<http://purl.org/dc/elements/1.1/subject>',
                name: 'Avainsanat',
                chart: true,
                enabled: true
            }
        };

        var prefixes =
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX schema: <http://schema.org/> ' +
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
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
        	'SELECT DISTINCT ?id ?evt ?person__name ?time__start ?time__end ?class ?place__uri ?place__label ?place__latitude ?place__longitude WHERE { ' +
        	'  { SELECT DISTINCT ?id WHERE { ' +
        	'   { <RESULT_SET> } ' +
        	'  } LIMIT 2500 } ' +
        	'  ?id foaf:focus ?prs . ' +
        	'  ?id skosxl:prefLabel ?person__label . ' +
    		'  OPTIONAL { ?person__label schema:familyName ?person__fname } ' +
    		'  OPTIONAL { ?person__label schema:givenName ?person__gname } ' +
    		'  BIND (CONCAT(COALESCE(?person__gname, "")," ",COALESCE(?person__fname, "")) AS ?person__name) ' +
        	'  { ?evt crm:P100_was_death_of ?prs . } ' +
        	'  UNION ' +  
        	'  { ?evt crm:P98_brought_into_life ?prs . } ' +
        	'  ' +
        	'  ?evt nbf:time ?time . ' +
        	'  OPTIONAL { ?time gvp:estStart ?time__start. } ' +
        	'  OPTIONAL { ?time gvp:estEnd ?time__end. } ' +
        	'  FILTER (BOUND(?time__start) || BOUND(?time__end)) ' +
        	'   ' +
        	'  ?evt a/skos:prefLabel ?class . ' +
        	'  FILTER (lang(?class)="en") ' +
        	'  ' +
        	'  ?evt nbf:place ?place__uri .  ' +
        	'    ?place__uri geo:lat ?place__latitude ;  ' +
        	'         geo:long ?place__longitude ; ' +
    		'         skos:prefLabel ?place__label . ' +
    		'	FILTER (lang(?place__label)="fi") ' +
        	'} ORDER BY ?person__fname';
        
        // 
        var query2 = 	
        	'SELECT * WHERE { ' +
        	'  { ' +
        	'  SELECT DISTINCT ?birth__place ?death__place (COUNT(?id) AS ?count) WHERE { ' +
        	'    <RESULT_SET> ' +
        	'    ?id foaf:focus ?prs . ' +
        	' ' +
        	'    ?death__id crm:P100_was_death_of ?prs ; ' +
        	'               nbf:place ?death__place . ' +
        	' ' +
        	'    ?birth__id crm:P98_brought_into_life ?prs ; ' +
        	'              nbf:place ?birth__place . ' +
        	'       ' +
        	'    FILTER (?birth__place!=?death__place) ' +
        	'       ' +
        	'    } GROUP BY ?birth__place ?death__place ORDER BY DESC(?count) LIMIT 500  } ' +
        	'  FILTER (?count>0) ' +
        	'  ?birth__place geo:lat ?birth__latitude ; ' +
        	'              geo:long ?birth__longitude . ' +
        	'   ' +
        	'  ?death__place geo:lat ?death__latitude ; ' +
        	'              geo:long ?death__longitude . ' +
        	'} ORDER BY ?count ';
        
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

        var resultOptions = {
            mapper: personMapperService,
            queryTemplate: query,
            prefixes: prefixes,
            paging: false,
            pagesPerQuery: 1
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointConfig, resultOptions);

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(endpointConfig, personMapperService);

        function getResults(facetSelections) {
        	var q = prefixes + query.replace("<RESULT_SET>", facetSelections.constraint.join(' '));
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getResults2(facetSelections) {
        	var q = prefixes + query2.replace("<RESULT_SET>", facetSelections.constraint.join(' '));
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
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
            if ($location.search().desc) {
                sort = 'DESC(' + sortBy + ')';
            } else {
                sort = sortBy;
            }
            return sortBy === '?ordinal' ? sort : sort + ' ?ordinal';
        }

        function getSortClass(sortBy, numeric) {
            var sort = $location.search().sortBy || '?ordinal';
            var cls = numeric ? 'glyphicon-sort-by-order' : 'glyphicon-sort-by-alphabet';

            if (sort === sortBy) {
                if ($location.search().desc) {
                    return cls + '-alt';
                }
                return cls;
            }
        }
    }
})();
