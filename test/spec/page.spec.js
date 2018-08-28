describe('SWAN Page data|setData|getData test', function () {
    const {dispatchEvent} = window.testutils.clientActions;
    beforeAll(function() {
        define('pages/datatest/datatest',
            function (require, module, exports, define, swan, getApp,
                window, document, frames, self, location, navigator, localStorage, history, Caches
            ) {
                Page({
                    data: {
                        status: 'init'
                    },
                    pageObj: {
                        name: 'yican'
                    }
                });
            }
        );
        window.__swanRoute = 'pages/datatest/datatest';window.usingComponents=[];require('pages/datatest/datatest');
        window.basePath = '';
        dispatchEvent('AppReady', {
            pageUrl: 'pages/datatest/datatest',
            wvID: '1',
            appPath: '',
            appConfig: '{"pages":["pages/datatest/datatest"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/datatest/datatest","text":"组件"}]}}'
        });
    })

    it('Page function and its data exist', function (done) {
        const rendered = window.masterManager.navigator.history.historyStack[0].getCurrentChildren().callPrivatePageMethod('rendered');
        const reachBottom = window.masterManager.navigator.history.historyStack[0].getCurrentChildren().callPrivatePageMethod('reachBottom');
        const share = window.masterManager.navigator.history.historyStack[0].getCurrentChildren().callPrivatePageMethod('share');
        const pullDownRefresh = window.masterManager.navigator.history.historyStack[0].getCurrentChildren().callPrivatePageMethod('pullDownRefresh');
        const onPageScroll = window.masterManager.navigator.history.historyStack[0].getCurrentChildren().callPrivatePageMethod('onPageScroll', {}, {
            event: 'onPageScroll'
        });
        const navigateArr = ['navigate', 'redirect', 'switchTab', 'reLaunch', ''];
        navigateArr.forEach(item => {
            window.masterManager.navigator.history.historyStack[0].getCurrentChildren().callPrivatePageMethod('navigate', {}, {
                openType: item,
                uri: 'pages/datatest/datatest'
            });
        });
        expect(Page).toEqual(jasmine.any(Function));
        expect(Page().data).toEqual(jasmine.any(Object));
        expect(Page().uri).toEqual(jasmine.any(String));
        expect(Page().usingComponents).toEqual(jasmine.any(Array));
        done();
    });

    it('Page setData|getData', function(done) {
        let {historyStack} = window.masterManager.navigator.history;
        let {pageObj} = historyStack[0].children[0].userPageInstance;
        expect(pageObj).toEqual(jasmine.any(Object));
        expect(pageObj.data).toEqual(jasmine.any(Object));
        expect(pageObj.setData).toEqual(jasmine.any(Function));
        expect(pageObj.getData).toEqual(jasmine.any(Function));
        // expect(pageObj.getData('status')).toEqual('init');

        /* Uncaught TypeError: Cannot read property 'contentWindow' of null thrown */
        pageObj.setData('status', 'modified');
        expect(pageObj.getData('status')).toEqual('modified');
        expect(pageObj.getData('status')).toEqual(pageObj.data.status);
       
        done();
    });
});