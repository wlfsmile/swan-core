describe('SWAN Page lifycycle test', function () {
    const {dispatchEvent} = window.testutils.clientActions;
    const testValMap = {
        mainOnLoad: 0,
        mainOnReady: 0,
        mainOnShow: 0,
        mainOnHide: 0,
        mainOnUnload: 0,
        mainOnPullDownRefresh: 0,
        mainOnTabItemTap: 0,
        mainOnPageScroll: 0,
        mainOnReachBottom: 0,
        mainOnShareAppMessage: 0
    }
    beforeAll(function() {
        define('pages/lifycycle/lifycycle', 
            function (require, module, exports, define, swan, getApp,
                window, document, frames, self, location, navigator, localStorage, history, Caches
            ) {
                Page({
                    data: {
                        status: 'init'
                    },
                    onLoad: function () {
                        testValMap.mainOnLoad++;
                    },
                    onReady: function () {
                        testValMap.mainOnReady++;
                    },
                    onShow: function (e) {
                        testValMap.mainOnShow++;
                    },
                    onHide: function () {
                        testValMap.mainOnHide++;
                    },
                    onUnload: function () {
                        testValMap.mainOnUnload++;
                    },
                    onPullDownRefresh: function() {
                        testValMap.mainOnPullDownRefresh++;
                    },
                    onTabItemTap: function() {
                        testValMap.mainOnTabItemTap++;
                    },
                    onPageScroll: function() {
                        testValMap.mainOnPageScroll++;
                    },
                    onReachBottom: function() {
                        testValMap.mainOnReachBottom++;
                    },
                    onShareAppMessage: function() {
                        testValMap.mainOnShareAppMessage++;
                    }
                });
            }
        );
        window.__swanRoute = 'pages/lifycycle/lifycycle';window.usingComponents=[];require('pages/lifycycle/lifycycle');
        window.basePath = '';
        dispatchEvent('AppReady', {
            pageUrl: 'pages/lifycycle/lifycycle',
            wvID: '99',
            appPath: '',
            appConfig: '{"pages":["pages/lifycycle/lifycycle","pages/api/api"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/lifycycle/lifycycle","text":"组件"},{"iconPath":"images/API_normal.png","selectedIconPath":"images/API_selected.png","pagePath":"pages/api/api","text":"接口"}]}}'
        });
    });

    it('check Page lifecycle', function(done) {
        const {historyStack} = window.masterManager.navigator.history;
        const lifeCyclePageInstance = window.masterManager.navigator.history
            .seek('99').userPageInstance.pageObj;
        expect(historyStack).toEqual(jasmine.any(Array));
        expect(historyStack.length).toBeGreaterThan(0);        

        expect(testValMap.mainOnLoad).toEqual(1);
        expect(testValMap.mainOnReady).toEqual(0);
        expect(testValMap.mainOnShow).toEqual(0);
        expect(testValMap.mainOnHide).toEqual(0);
        expect(testValMap.mainOnUnload).toEqual(0);

        // [start] 测试onShow生命周期
        dispatchEvent('lifecycle', {
            lcType: 'onShow', 
            wvID: '99'
        });

        expect(testValMap.mainOnShow).toEqual(1);
        expect(testValMap.mainOnHide).toEqual(0);
        // [end]

        // [start] 测试onReady生命周期
        dispatchEvent('lifecycle', {
            lcType: 'onReady', 
            wvID: '99'
        });
        expect(testValMap.mainOnReady).toEqual(0);
        // [end]

        // [start] 测试onTabItemTap生命周期
        dispatchEvent('onTabItemTap', {
            wvID: '99'
        });
        dispatchEvent('onTabItemTap', {
            wvID: '99'
        });
        expect(testValMap.mainOnTabItemTap).toEqual(2);
        // [end]

        // [start] 测试onHide生命周期
        dispatchEvent('lifecycle', {
            lcType: 'onHide', 
            wvID: '99'
        });
        expect(testValMap.mainOnShow).toEqual(1);
        expect(testValMap.mainOnHide).toEqual(1);
        // [end]

        // 以下均为slave感知并触发通知master, 故由此test
        // [start] 测试onUnload生命周期,close slave触发
        lifeCyclePageInstance._onUnload();
        expect(testValMap.mainOnUnload).toEqual(1);
        // [end]

        // [start] 测试onPullDownRefresh生命周期
        lifeCyclePageInstance._pullDownRefresh({});
        expect(testValMap.mainOnPullDownRefresh).toEqual(1);
        // [end]

        // [start] 测试onPageScroll生命周期
        lifeCyclePageInstance._onPageScroll({});
        expect(testValMap.mainOnPageScroll).toEqual(1);
        // [end]
        // [end]

        // [start] 测试onReachBottom生命周期
        lifeCyclePageInstance._reachBottom({});
        expect(testValMap.mainOnReachBottom).toEqual(1);
        // [end]

        // [start] 测试onShareAppMessage生命周期
        lifeCyclePageInstance._share({});
        expect(testValMap.mainOnShareAppMessage).toEqual(1);
        // [end]

        done();
    });  
});
// ****** end
