(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('nlpService', nlpService);

    /* @ngInject */
    function nlpService($q, _, AdvancedSparqlService, FacetResultHandler, SPARQL_ENDPOINT_URL,
            facetService, objectMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getStatistics = getStatistics;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = facetService.getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;

        this.upos = ['VERB', 'NOUN', 'ADJ', 'PROPN'];

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
            ' } GROUP BY ?lemma ORDER BY DESC(?count) LIMIT 50';


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

        function getResults(facetSelections) {
            var self = this;
            var qry = query.replace(/<RESULT_SET>/g, facetSelections.constraint.join(' '));
            return nbfEndpoint.getObjectsNoGrouping(qry).then(function(results) {
                if (results.length > 10000) {
                    return $q.reject({
                        message: 'Tulosjoukko on liian suuri. Ole hyvä ja rajaa tuloksia suodittimien avulla'
                    });
                }
                var promises = {};
                var uposQry = lemmaQry.replace(/<DOC>/g, '<' + _.map(results, 'id').join('> <') + '>');

                self.upos.forEach(function(upos) {
                    promises[upos] = endpoint.getObjectsNoGrouping(uposQry.replace(/<UPOS>/g, upos));
                });

                return $q.all(promises);
            });
        }

        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
