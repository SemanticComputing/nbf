(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('nlpService', nlpService);

    /* @ngInject */
    function nlpService($q, _, AdvancedSparqlService, FacetResultHandler, SPARQL_ENDPOINT_URL,
            mapfacetService, objectMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getWordCount = getWordCount;
        this.getResultsTop10 = getResultsTop10;
        this.getResultsBottom10 = getResultsBottom10;
        this.getResultsBottomCat = getResultsBottomCat;
        this.getResultsTopCat = getResultsTopCat;
        this.getStatistics = getStatistics;
        this.getLenStatistics = getLenStatistics;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = mapfacetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        this.upos = [
            {
                key: 'VERB',
                label: 'Verbi'

            },
{
                key: 'NOUN',
                label: 'Substantiivi'

            },
            {
                key: 'ADJ',
                label: 'Adjektiivi'

            },
            {
                key: 'PROPN',
                label: 'Erisnimi'

            },
        ];

        /* Implementation */

        var prefixes =
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX dct: <http://purl.org/dc/terms/> ' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX skosxl: <http://www.w3.org/2008/05/skos-xl#> ' +
            ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
            ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
            ' PREFIX gvp: <http://vocab.getty.edu/ontology#> ' +
            ' PREFIX nbf: <http://ldf.fi/nbf/> ' +
            ' PREFIX categories: <http://ldf.fi/nbf/categories/> ' +
            ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
            ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
            ' PREFIX conll: <http://ufal.mff.cuni.cz/conll2009-st/task-description.html#> ' +
            ' PREFIX nif: <http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#> ' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the person URI.
        var query =
            ' SELECT DISTINCT ?id WHERE {' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            ' }';

        var lemmaQry = prefixes +
            ' SELECT DISTINCT ?lemma (COUNT(?lemma) AS ?count) { ' +
            '  VALUES ?doc { <DOC> } ' +
            '  ?s nif:structure/<http://ldf.fi/nbf/biography/data#bioId> ?doc . ' +
            '  ?s a nif:Sentence . ' +
            '  ?word nif:sentence ?s . ' +
            '  ?word conll:UPOS "<UPOS>" . ' +
            '  ?word conll:LEMMA ?lemma . ' +
            '  FILTER(STRLEN(STR(?lemma))>1) ' +
            '  FILTER (regex(?lemma, ".*(?<![.])$")) . ' +
            ' } GROUP BY ?lemma ORDER BY DESC(?count) LIMIT 50';

	var lemmaCountQry = prefixes +
            ' SELECT  (SUM(xsd:integer(?cnt)) AS ?count) (SUM(xsd:integer(?verb)) AS ?verbCount) (SUM(xsd:integer(?adj)) AS ?adjCount) (SUM(xsd:integer(?noun)) AS ?nounCount) (SUM(xsd:integer(?pnoun)) AS ?pnounCount) { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id . ' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt ;' +
            '      <http://ldf.fi/nbf/biography/data#verbCount> ?verb ;' +
            '      <http://ldf.fi/nbf/biography/data#adjCount> ?adj ;' +
            '      <http://ldf.fi/nbf/biography/data#nounCount> ?noun ;' +
            '      <http://ldf.fi/nbf/biography/data#propnCount> ?pnoun .' +
            ' } ';

	var topTenResults = prefixes +
	    ' SELECT DISTINCT ?id ?name ?cnt { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } ORDER BY DESC(xsd:integer(?cnt)) LIMIT 10' ;
	var topBottomResults = prefixes +
	    ' SELECT DISTINCT ?id ?name ?cnt { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } ORDER BY ASC(xsd:integer(?cnt)) LIMIT 10' ;

	var topTopCatsResults = prefixes +
	    ' SELECT DISTINCT ?category (ROUND(SUM(xsd:integer(?cnt)) / COUNT(xsd:integer(?cnt))) AS ?count) (COUNT(xsd:integer(?cnt)) as ?lkm) {' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
	    '  ?id foaf:focus/nbf:has_category ?cat .' +
	    '  ?cat skos:prefLabel ?category .' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } GROUP BY ?category ORDER BY DESC(?count) LIMIT 10' ;

	var topBottomCatsResults = prefixes +
	    ' SELECT DISTINCT ?category (ROUND(SUM(xsd:integer(?cnt)) / COUNT(xsd:integer(?cnt))) AS ?count) (COUNT(xsd:integer(?cnt)) as ?lkm){' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
	    '  ?id a <http://ldf.fi/nbf/PersonConcept> .' +
	    '  ?id <http://www.w3.org/2004/02/skos/core#prefLabel> ?name . ' +
            '  ?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] . ' +
	    '  ?id foaf:focus/nbf:has_category ?cat .' +
	    '  ?cat skos:prefLabel ?category .' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id .' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ;' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt .' +
            ' } GROUP BY ?category ORDER BY ASC(?count) LIMIT 10' ;

        var docCountByLenQry = prefixes +
            ' SELECT DISTINCT ?year (ROUND(SUM(xsd:integer(?cnt)) / COUNT(xsd:integer(?cnt))) AS ?count) { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '  ?doc <http://ldf.fi/nbf/biography/data#docRef> ?id . ' +
            '  ?ds <http://ldf.fi/nbf/biography/data#document> ?doc ; ' +
            '      <http://ldf.fi/nbf/biography/data#wordCount> ?cnt . ' +
            '  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?year) ' +
            ' } GROUP BY ?year ORDER BY ?year ';

        var docCountByDecadeQry = prefixes +
            ' SELECT DISTINCT ?year (COUNT(distinct ?id) AS ?count) { ' +
            '  { ' +
            '    <RESULT_SET> ' +
            '  } ' +
            '  ?id foaf:focus/^crm:P98_brought_into_life/nbf:time/gvp:estStart ?birth . ' +
            '  BIND (FLOOR(YEAR(?birth)/10)*10 AS ?year) ' +
            ' } GROUP BY ?year ORDER BY ?year ';

        var nbfEndpointConfig = {
            'endpointUrl': SPARQL_ENDPOINT_URL,
            'usePost': true
        };

        var nlpEndpointConfig = {
            'endpointUrl': 'https://ldf.fi/nbf-nlp/sparql',
            'usePost': true
        };

        var facetOptions = {
            endpointUrl: nbfEndpointConfig.endpointUrl,
            rdfClass: '<http://ldf.fi/nbf/PersonConcept>',
            constraint: '?id <http://xmlns.com/foaf/0.1/focus>/<http://ldf.fi/nbf/has_biography> [] .',
            preferredLang : 'fi',
            noSelectionString: '-- Ei valintaa --'
        };

        // This handler is for the additional queries.
        var endpoint = new AdvancedSparqlService(nlpEndpointConfig, objectMapperService);
        var nbfEndpoint = new AdvancedSparqlService(nbfEndpointConfig, objectMapperService);

        function getStatistics(facetSelections) {
            var qry = docCountByDecadeQry.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return nbfEndpoint.getObjectsNoGrouping(qry);
        }

	function getLenStatistics(facetSelections) {
            var qry = docCountByLenQry.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return nbfEndpoint.getObjectsNoGrouping(qry);
        }

        function getResults(facetSelections) {
            var self = this;
            var qry = query.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return nbfEndpoint.getObjectsNoGrouping(qry).then(function(results) {
                if (results.length > 10000) {
                    return $q.reject({
                        statusText: 'Tulosjoukko on liian suuri. Ole hyvä ja rajaa tuloksia suodittimien avulla'
                    });
                }
                var promises = {};
                var uposQry = lemmaQry.replace(/<DOC>/g, '<' + _.map(results, 'id').join('> <') + '>');

                self.upos.forEach(function(upos) {
                    promises[upos.key] = endpoint.getObjectsNoGrouping(uposQry.replace(/<UPOS>/g, upos.key));
                });

                return $q.all(promises);
            });
        }

	 function getResultsTop10(facetSelections) {
            var self = this;
            //var qry = query.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            //return nbfEndpoint.getObjectsNoGrouping(qry).then(function(results) {
                /*if (results.length > 10000) {
                    return $q.reject({
                        statusText: 'Tulosjoukko on liian suuri. Ole hyvä ja rajaa tuloksia suodittimien avulla'
                    });
                }*/
                var promises = {};
                var topQry = topTenResults.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

                //self.upos.forEach(function() {
		//console.log("results", promises)
                promises = nbfEndpoint.getObjectsNoGrouping(topQry);
		console.log("results", promises)
                //});
                return promises;
           // });
        }

	 function getResultsBottom10(facetSelections) {
            var self = this;
            //var qry = query.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            //return nbfEndpoint.getObjectsNoGrouping(qry).then(function(results) {
                /*if (results.length > 10000) {
                    return $q.reject({
                        statusText: 'Tulosjoukko on liian suuri. Ole hyvä ja rajaa tuloksia suodittimien avulla'
                    });
                }*/
                var promises = {};
                var topQry = topBottomResults.replace(/<RESULT_SET>/g,  facetSelections.constraint.join(' '));

                //self.upos.forEach(function() {
                promises = nbfEndpoint.getObjectsNoGrouping(topQry);
                //});
                return promises;
            //});
        }

	 function getWordCount(facetSelections) {
            var self = this;
            var promises = {};
            var qry = lemmaCountQry.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

            promises = nbfEndpoint.getObjectsNoGrouping(qry);
	    console.log(promises);
            return promises;
        }
	function getResultsTopCat(facetSelections) {
            var self = this;
            var promises = {};
            var topQry = topTopCatsResults.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

            promises = nbfEndpoint.getObjectsNoGrouping(topQry);
	    console.log(promises);
            return promises;
        }
	 function getResultsBottomCat(facetSelections) {
            var self = this;
            var promises = {};
            var topQry = topBottomCatsResults.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));

            promises = nbfEndpoint.getObjectsNoGrouping(topQry);
	    console.log(promises);
            return promises;
        }

        function getFacetOptions() {
            return angular.copy(facetOptions);
        }

    }
})();
