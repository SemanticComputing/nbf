(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('loginService', loginService);

    /* @ngInject */
    function loginService($q, $window, $location, SPARQL_ENDPOINT_URL, $http) {

        this.login = login;
        this.isLoggedIn = isLoggedIn;
        this.getAuthToken = getAuthToken;
        this.checkConnection = checkConnection;
        this.getHeader = getHeader;

        var url = SPARQL_ENDPOINT_URL + '?query=ASK{}';

        setAuthHeader();

        function setAuthHeader() {
            if (getAuthToken()) {
                $http.defaults.headers.common.Authorization = getHeader().Authorization;
            }
        }

        function checkConnection() {
            return $http.get(url).then(function() {
                return true;
            }).catch(function(err) {
                if (err && err.status === 401) {
                    return $http.get(url, { headers: getHeader() }).then(function() {
                        return true;
                    }).catch(function() {
                        return false;
                    });
                }
                return false;
            });
        }

        function isLoggedIn() {
            return !!$window.sessionStorage.getItem('sparqlAuthToken');
        }

        function getAuthToken() {
            return $window.sessionStorage.getItem('sparqlAuthToken');
        }

        function getHeader() {
            var token = $window.sessionStorage.getItem('sparqlAuthToken');
            return { 'Authorization': 'Basic ' + token };
        }

        function login(un, pw) {
            $window.sessionStorage.removeItem('sparqlAuthToken');
            var token = btoa(un + ':' + pw);
            var config = { headers: { 'Authorization': 'Basic ' + token } };
            return $http.get(SPARQL_ENDPOINT_URL + '?query=ASK{}', config).then(function() {
                // Success
                $window.sessionStorage.setItem('sparqlAuthToken', token);
                setAuthHeader();
                return true;
            }).catch(function(err) {
                return false;
            });
        }

    }
})();
