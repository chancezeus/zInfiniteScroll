(function (angular) {
    'use strict';
    var module = angular.module('zInfiniteScroll', []);

    module.directive('zInfiniteScroll', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs) {
                var isDestroying = false;

                var handlerCallback = $parse(attrs.zInfiniteScroll);
                var finishedCallback = $parse(attrs.scrollFinished);
                var bodyScroll = !!scope.$eval(attrs.bodyScroll);
                var inverse = !!scope.$eval(attrs.inverse);

                var finished = false;
                var loading = false;

                var lengthThreshold;
                var timeThreshold;

                lengthThreshold = parseInt(attrs.scrollThreshold, 10) || 50;
                timeThreshold = parseInt(attrs.timeThreshold, 10) || 200;

                element = element[0];
                if (bodyScroll) {
                    element = document.documentElement;
                }

                element.addEventListener('scroll', loadData);

                scope.$on('$destroy', function handleDestroyEvent() {
                    isDestroying = true;

                    element.removeEventListener('scroll', loadData);
                });

                scope.$watch(function () {
                    return finishedCallback(scope);
                }, function (value) {
                    finished = !!value;
                });

                function calculateBarScrolled() {
                    if (inverse) {
                        if (bodyScroll) {
                            return element.scrollTop || document.body.scrollTop;
                        }

                        return element.scrollTop;
                    }

                    if (bodyScroll) {
                        return element.scrollHeight - (element.clientHeight + (element.scrollTop || document.body.scrollTop));
                    }

                    return element.scrollHeight - (element.clientHeight + element.scrollTop);
                }

                function loadData() {
                    if (isDestroying || finished || loading) {
                        return;
                    }

                    var scrolled = calculateBarScrolled();
                    if (scrolled < lengthThreshold) {
                        scope.$evalAsync(function () {
                            var originalHeight = element.scrollHeight;

                            loading = true;

                            var callback = handlerCallback(scope);
                            if (!callback || typeof callback !== 'object' || typeof callback.then !== 'function') {
                                callback = $timeout(angular.noop, timeThreshold);
                            }

                            callback
                                .then(function () {
                                    loading = false;

                                    // Force a digest and give the dom time to render (this assumes dom rendering when calling $timeout)
                                    $timeout(function () {
                                        if (element.scrollHeight !== originalHeight) {
                                            if (inverse) {
                                                element.scrollTop = element.scrollHeight - originalHeight;
                                            }

                                            loadData();
                                        }
                                    });
                                }, function () {
                                    loading = false;
                                });
                        });
                    }
                }

                loadData();
            }
        };
    }]);
})(angular);
