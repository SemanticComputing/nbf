(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('norssitVisuService', norssitVisuService);

    /* @ngInject */
    function norssitVisuService($q, $location, _, AdvancedSparqlService,
            objectMapperService, SPARQL_ENDPOINT_URL) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getResults1 = getResults1;
        this.getResults2 = getResults2;
        this.getResultsYears = getResultsYears;
        this.getResultsTopTitles = getResultsTopTitles;
        this.getResultsTopOrgs = getResultsTopOrgs;
        this.getResultsTopSchools = getResultsTopSchools;
        
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;
        /* Implementation */

        var facets = {
            // Text search facet for name
            entryText: {
                facetId: 'entryText',
                predicate: '<http://ldf.fi/schema/person_registry/entryText>',
                name: 'Haku',
                enabled: true
            },
            link: {
                facetId: 'link',
                choices: [
                    {
                        id: 'wikipedia',
                        pattern: '?id <http://ldf.fi/norssit/wikipedia> [] .',
                        label: 'Wikipedia'
                    },
                    {
                        id: 'kansallisbiografia',
                        pattern: '?id <http://ldf.fi/norssit/kansallisbiografia> [] .',
                        label: 'Kansallisbiografia'
                    },
                    {
                        id: 'kirjasampo',
                        pattern: '?id <http://ldf.fi/norssit/kirjasampo> [] .',
                        label: 'Kirjasampo'
                    },
                    {
                        id: 'kulttuurisampo',
                        pattern: '?id <http://ldf.fi/norssit/kulttuurisampo> [] .',
                        label: 'Kulttuurisampo'
                    },
                    {
                        id: 'sotasampo',
                        pattern: '?id <http://ldf.fi/norssit/warsa> [] .',
                        label: 'Sotasampo'
                    },
                    {
                        id: 'blf',
                        pattern: '?id <http://ldf.fi/norssit/sls_biografi> [] .',
                        label: 'BLF'
                    },
                    {
                        id: 'wikidata',
                        pattern: '?id <http://ldf.fi/norssit/wikidata> [] .',
                        label: 'Wikidata'
                    },
                    {
                        id: 'ulan',
                        pattern: '?id <http://ldf.fi/norssit/ulan> [] .',
                        label: 'ULAN'
                    },
                    {
                        id: 'viaf',
                        pattern: '?id <http://ldf.fi/norssit/viaf> [] .',
                        label: 'VIAF'
                    },
                    {
                        id: 'genicom',
                        pattern: '?id <http://ldf.fi/norssit/genicom> [] .',
                        label: 'Geni.com'
                    }
                ],
                enabled: true,
                name: 'Linkit'
            },
            familyName: {
                facetId: 'familyName',
                predicate: '<http://schema.org/familyName>',
                name: 'Sukunimi'
            },
            birthPlace: {
                facetId: 'birthPlace',
                predicate: '<http://ldf.fi/schema/person_registry/birthPlace>',
                name: 'Syntymäpaikka',
                enabled: true
            },
            enrollmentYear: {
                facetId: 'enrollmentYear',
                predicate: '<http://ldf.fi/schema/person_registry/enrollmentYear>',
                name: 'Aloittamisvuosi',
                enabled: true
            },
            matriculationYear: {
                facetId: 'matriculationYear',
                predicate: '<http://ldf.fi/schema/person_registry/matriculationYear>',
                name: 'Valmistumisvuosi',
                enabled: true
            },
            occupation: {
                facetId: 'occupation',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to_title>',
                name: 'Arvo tai ammatti',
                enabled: true
            },
            education: {
                facetId: 'education',
                predicate: '^<http://ldf.fi/schema/bioc/education_inheres_in>/<http://ldf.fi/schema/bioc/relates_to_title>',
                name: 'Koulutus',
                enabled: true
            },
            organization: {
                facetId: 'organization',
                predicate: '^(<http://ldf.fi/schema/bioc/title_inheres_in>|<http://ldf.fi/schema/bioc/education_inheres_in>)/<http://ldf.fi/schema/bioc/relates_to>',
                name: 'Työpaikka tai oppilaitos',
                enabled: true
            },
            gender: {
                facetId: 'gender',
                predicate: '<http://schema.org/gender>',
                name: 'Sukupuoli',
                enabled: true
            },
            hobby: {
                facetId: 'hobby',
                predicate: '<http://schema.org/hobby>',
                name: 'Harrastus'
            },
            medal: {
                facetId: 'medal',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to_medal>',
                name: 'Kunniamerkit ja -mitalit',
                enabled: true
            },
            rank: {
                facetId: 'rank',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to_rank>',
                name: 'Sotilasarvo tai -toimi',
                enabled: true
            }
        };

        var prefixes =
	        ' PREFIX hobbies: <http://ldf.fi/hobbies/> ' +
	        ' PREFIX norssit: <http://ldf.fi/norssit/> ' +
	        ' PREFIX nach: <http://ldf.fi/norssit/achievements/> ' +
	        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
	        ' PREFIX person_registry: <http://ldf.fi/schema/person_registry/> ' +
	        ' PREFIX places: <http://ldf.fi/places/> ' +
	        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
	        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
	        ' PREFIX relatives: <http://ldf.fi/relatives/> ' +
	        ' PREFIX schema: <http://schema.org/> ' +
	        ' PREFIX schemax: <http://topbraid.org/schemax/> ' +
	        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
	        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
	        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
	        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
	        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
	        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the norssit URI.
        var query = prefixes +
        	' SELECT distinct ?occupation ?education ?organization ?eduorganization ?id ' +
            '  WHERE {' +
            '  	 { <RESULT_SET> } ' +
        	'  { ?evt bioc:education_inheres_in ?id ; bioc:relates_to_title/skos:prefLabel ?education . ' +
        	'    OPTIONAL { ?evt bioc:relates_to ?org .' +
        	'	 	?org a schema:EducationalOrganization ; skos:prefLabel ?eduorganization }' +
        	'  }' +
        	'  UNION' +
        	'  { ?evt bioc:title_inheres_in ?id ;' +
        	'     	bioc:relates_to_title ?cls .' +
        	'    FILTER (?cls != bioc:Title)' +
        	'    ?cls skos:prefLabel ?occupation .' +
        	'    OPTIONAL { ?evt bioc:relates_to/skos:prefLabel ?organization }' +
        	'  }' +
        	'}';
            
       var queryYears = prefixes +
		    ' SELECT ?year ?index (count(distinct ?id) AS ?count) ' +
		   	' WHERE { ' +
		   	'  { <RESULT_SET> } ' +
		   	'  VALUES (?prop ?index) {  ' +
		   	'    (person_registry:enrollmentYear 0)  ' +
		   	'    (person_registry:matriculationYear 1) } ' +
		   	'  ?id ?prop ?year .   ' + 
		   	'} GROUP BY ?year ?index ORDER BY ?year ';
       
        var queryTopTitles = prefixes + 
	    	' SELECT ?label ?year (count (distinct ?id) AS ?count) ' +
	    	' WHERE { ' +
	    	'    { ' +
	    	'    SELECT ?class (count (distinct ?id) AS ?no) ' +
	    	'    WHERE { ' +
	    	'      ?class rdfs:subClassOf+ bioc:Title . ' +
	    	'      ?evt bioc:relates_to_title ?class ; ' +
	    	'           bioc:title_inheres_in ?id . ' +
	    	'        { <RESULT_SET> } ' +
	    	'    } GROUP BY ?class ORDER BY desc(?no) LIMIT 5 ' +
	    	'    } ' +
	    	'    ?class skos:prefLabel ?label . ' +
	    	'    ?evt bioc:relates_to_title ?class ; ' +
	    	'         bioc:title_inheres_in ?id ; ' +
	    	'         schema:startDate ?date . ' +
	    	'    { <RESULT_SET> } ' +
	    	' 	 BIND (floor(year(?date)/10)*10 AS ?year)' +
	    	'  } GROUP BY ?label ?year ORDER by ?year ';
        
        var queryTopOrgs = prefixes + 
	        'SELECT ?label ?year (count (distinct ?id) AS ?count) ' +
	    	'  WHERE { ' +
	    	'    { ' +
	    	'    SELECT ?org (count (distinct ?id) AS ?no) ' +
	    	'    WHERE { ' +
	    	'  	   ?evt bioc:title_inheres_in ?id ; ' +
            '      		bioc:relates_to ?org . ' +
            '		?org a foaf:Organization . ' +
	    	'      { <RESULT_SET> } ' +
	    	'    } GROUP BY ?org ORDER BY desc(?no) LIMIT 5 ' +
	    	'    } ' +
	    	'    ?org skos:prefLabel ?label . ' +
	    	'    ?evt bioc:title_inheres_in ?id ; ' +
	    	'    	  bioc:relates_to ?org; ' +
	    	'         schema:startDate ?date . ' +
	    	'    { <RESULT_SET> } ' +
	    	' 	 BIND (floor(year(?date)/10)*10 AS ?year)' +
	    	'  } GROUP BY ?label ?year ORDER by ?year ';
	    
        var queryTopSchools = prefixes + 
	        ' SELECT ?label ?year (count (distinct ?id) AS ?count) ' +
	    	' WHERE { ' +
	    	'    { ' +
	    	'    SELECT ?org (count (distinct ?id) AS ?no) ' +
	    	'    WHERE { ' +
	    	'  	   ?evt bioc:education_inheres_in ?id ; ' +
	        '      		bioc:relates_to ?org . ' +
	        ' 	   ?org a schema:EducationalOrganization ' +	
	    	'      { <RESULT_SET> } ' +
	    	'    } GROUP BY ?org ORDER BY desc(?no) LIMIT 5 ' +
	    	'    } ' +
	    	'    ?org skos:prefLabel ?label .' +
	    	'    ?evt bioc:education_inheres_in ?id ; ' +
	    	'    	  bioc:relates_to ?org; ' +
	    	'         schema:startDate ?date . ' +
	    	'    { <RESULT_SET> } ' +
	    	' 	 BIND (floor(year(?date)/10)*10 AS ?year)' +
	    	' } GROUP BY ?label ?year ORDER by ?year ';
    
        
        // The SPARQL endpoint URL
        var endpointUrl = SPARQL_ENDPOINT_URL;

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://xmlns.com/foaf/0.1/Person>',
            preferredLang : 'fi'
        };

        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);
        
        function getResults1(facetSelections) {
        	var q = query.replace("<RESULT_SET>", facetSelections.constraint.join(' '));
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getResultsYears(facetSelections) {
        	var cons = facetSelections.constraint.join(' '),
        		q = queryYears.replace("<RESULT_SET>", cons);
        	return endpoint.getObjectsNoGrouping(q);
        }
        
        function getResultsTopTitles(facetSelections) {
        	var q = queryTopTitles.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
        	return endpoint.getObjectsNoGrouping(q);
        }

        function getResultsTopOrgs(facetSelections) {
        	return endpoint.getObjectsNoGrouping(queryTopOrgs.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' ')));
        }
        
        function getResultsTopSchools(facetSelections) {
        	// console.log(queryTopSchools.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' ')));
        	return endpoint.getObjectsNoGrouping(queryTopSchools.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' ')));
        }
        
        
        function getResults(facetSelections) {
        	var promises = [
            	this.getResults1(facetSelections),
            	this.getResultsYears(facetSelections),
            	this.getResultsTopTitles(facetSelections),
            	this.getResultsTopOrgs(facetSelections),
            	this.getResultsTopSchools(facetSelections)
            ];
        	return $q.all(promises);
        }
        
        function getResults2(facetSelections) {
        	var promises = [
            	this.getResults1(facetSelections)
            ];
        	return $q.all(promises);
        }
        
        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
