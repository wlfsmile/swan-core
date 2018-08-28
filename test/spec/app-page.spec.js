describe('swan App & Page test', function () {
    const {dispatchEvent} = window.testutils.clientActions;
    var appOnLaunch = 0;
    var appOnShow = 0;
    var appOnHide = 0;
    var appLaunche = null;
    var appShowe = null;
    var appOnError = 0;
    App({
        onLaunch: function (e) {
            appOnLaunch++;
            appLaunche = e;
        },
        onShow: function (e) {
            appShowe = e;
            appOnShow++;
        },
        onHide: function () {
            appOnHide++;
        },
        onError: function () {
            appOnError++;
        }
    });

    var mainOnLoad = 0;
    var mainOnReady = 0;
    var mainOnShow = 0;
    var mainOnHide = 0;
    var mainOnUnload = 0;
    define('pages/component/component', 
        function (require, module, exports, define, swan, getApp,
            window, document, frames, self, location, navigator, localStorage, history, Caches
        ) {
            Page({
                data: {
                    name: 'swan'
                },
                onLoad: function () {
                    mainOnLoad++;
                },
                onReady: function () {
                    mainOnReady++;
                },
                onShow: function () {
                    mainOnShow++;
                },
                onHide: function () {
                    mainOnHide++;
                },
                onUnload: function () {
                    mainOnUnload++;
                }
            });
        }
    );

    window.__swanRoute = 'pages/component/component';require('pages/component/component');
    // when client dispatch an ready event
    window.basePath = '';
    window.testutils.clientActions.appReady('1', 'pages/component/component');

    dispatchEvent('onAppError', {
        pageUrl: 'pages/component/component',
        wvID: '1',
        appPath: '',
        appConfig: '{"pages":["pages/datatest/datatest","pages/api/api"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/datatest/datatest","text":"组件"}]}}'
        // appConfig: '{"pages":["pages/component/component","pages/api/api"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/lifycycle/lifycycle","text":"组件"},{"iconPath":"images/API_normal.png","selectedIconPath":"images/API_selected.png","pagePath":"pages/api/api","text":"接口"}]}}'
    });
    
    describe('swan App test', function () {
        it('App exist', function (done) {
            expect(App).toEqual(jasmine.any(Function));
            done();
        });

        it('App life cycle', function (done) {
            setTimeout(function () {
                expect(appLaunche).toEqual(jasmine.any(Object));
                expect(appLaunche.path).toEqual(jasmine.any(String));
                expect(appLaunche.query).toEqual(jasmine.any(String));
                expect(appLaunche.scene).toEqual(jasmine.any(String));
                expect(appShowe).toEqual(jasmine.any(Object));
                expect(appShowe.path).toEqual(jasmine.any(String));
                expect(appShowe.query).toEqual(jasmine.any(String));
                expect(appShowe.scene).toEqual(jasmine.any(String));
                expect(appOnLaunch).toEqual(1);
                expect(appOnShow).toEqual(2);
                expect(appOnHide).toEqual(0);

                window.testutils.clientActions.appHide();
                setTimeout(function () {
                    expect(appOnShow).toEqual(2);
                    expect(appOnHide).toEqual(1);
                    done();
                }, 1);
            }, 1);
        });
    });

    describe('swan Page test', function () {
        function showLog(logs) {}

        window.rainMonitor = {
            log: () => {}
        };

        it('Page function exist', function (done) {
            expect(window.Page).toEqual(jasmine.any(Function));
            done();
        });

        it('Page execute check', function (done) {
            var pState = {};
            define('pages/api/api',
                function (require, module, exports, define, swan, getApp,
                    window, document, frames, self, location, navigator, localStorage, history, Caches
                ) {
                    pState.pageObj = Page({
                        data: {
                            name: 'swan'
                        }
                    });
                }
            );
            window.__swanRoute = 'pages/api/api';require('pages/api/api');

            showLog(pState);

            expect(pState.pageObj).toEqual(jasmine.any(Object));
            expect(pState.pageObj.data).toEqual(jasmine.any(Object));
            expect(pState.pageObj.uri).toEqual('pages/api/api');
            done();
        });

        it('Page init and life cycle, simulate client\'s events', function (done) {

            setTimeout(function () {
                var historyStack = window.masterManager.navigator.history.historyStack;
                expect(historyStack).toEqual(jasmine.any(Array));
                expect(historyStack.length).toBeGreaterThan(0);
                expect(historyStack[0].children).toEqual(jasmine.any(Array));
                expect(mainOnLoad).toEqual(1);
                expect(mainOnReady).toEqual(0);
                expect(mainOnShow).toEqual(0);
                expect(mainOnHide).toEqual(0);
                expect(mainOnUnload).toEqual(0);
                
                // when client dispatch an show event
                window.testutils.clientActions.show(1);
                
                setTimeout(function () {
                    expect(mainOnShow).toEqual(1);
                    expect(mainOnHide).toEqual(0);
                    // when client dispatch an hide event
                    window.testutils.clientActions.hide(1);
                    setTimeout(function () {
                        expect(mainOnShow).toEqual(1);
                        expect(mainOnHide).toEqual(1);
                        done();
                    }, 1);
                }, 1);
            }, 1);
        });
    });
});
