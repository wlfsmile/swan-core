describe('swan Page data operation', function () {

    function dispatchEvent(type, params) {
        var event = new Event(type);
        for (var i in params) {
            event[i] = params[i];
        }
        document.dispatchEvent(event);
    }


    it('setData', function (done) {
        var pageObject = null;
        define('pages/component/setdata',
            function (require, module, exports, define, swan, getApp,
                window, document, frames, self, location, navigator, localStorage, history, Caches
            ) {
                Page({
                    data: {
                        name: 'yican',
                        sex: [1, 0, 1, 1],
                        flag: true,
                        test: 'test',
                        attr: 'yican',
                        person: {
                            name: 'yican',
                            age: 18,
                            爱好: '滑雪',
                            with: {
                                tt: 'test',
                                dd: 'dd'
                            }
                        },
                        bigObj: {
                            name: 'hy',
                            age: 1,
                            height: 180
                        }
                    },
                    onLoad: function () {
                        pageObject = this;
                        setTimeout(() => {
                            this.setData({
                                attr: 'yican update',
                                test: 'test update',
                                sex: [1, 1, 0, 1],
                                person: {
                                    name: 'yican update',
                                    with: {
                                      tt: 'tt'
                                    }
                                },
                                name: ['john', 'leborn', 'james', 'yty', 'hy', 'test']
                            });
                        }, 100);
                    }
                });
            }
        );
        window.__swanRoute = 'pages/component/setdata';
        require('pages/component/setdata');

        // when client dispatch an ready event
        window.basePath = '';
        dispatchEvent('AppReady', {
            pageUrl: 'pages/component/setdata',
            wvID: '3',
            appPath: '',
            appConfig: '{"pages":["pages/datatest/datatest","pages/api/api"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/datatest/datatest","text":"组件"}]}}'
            // appConfig: '{"pages":["pages/component/component","pages/api/api"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/component/component","text":"组件"},{"iconPath":"images/API_normal.png","selectedIconPath":"images/API_selected.png","pagePath":"pages/api/api","text":"接口"}]}}'
        });
        setTimeout(() => {
            pageObject.setData({
                attr: 'yican update',
                test: 'test update',
                person: {
                    name: 'yican update',
                    with: {
                        tt: 'tt'
                    }
                },
                name: ['john', 'leborn', 'james', 'yty', 'hy', 'test']
            });
            expect(pageObject.getData('attr')).toEqual('yican update');
        }, 20);

        setTimeout(() => {
            pageObject.pushData({
                company: 'baidu'
            });
            // expect(pageObject.getData('company')).toEqual('baidu');
            pageObject.popData({
                company: 'baidu'
            });

            pageObject.unshiftData({
                pos: 'xibeiwang'
            });
            pageObject.shiftData({
                pos: 'xibeiwang'
            });

            pageObject.removeAtData({
                name: 'yican'
            }, 1);

            pageObject.spliceData({
                name: 'yican'
            }, 1);

            // pageObject.createCanvasContext('myCanvas');
        }, 20);

        // setTimeout(function () {
        //     pageObject.setData({
        //         attr: 'yican update',
        //         test: 'test update',
        //         person: {
        //             name: 'yican update',
        //             with: {
        //               tt: 'tt'
        //             }
        //         },
        //         name: ['john', 'leborn', 'james', 'yty', 'hy', 'test']
        //     });
        //     expect(pageObject.getData('attr')).toEqual('yican update');
        // }, 1);
        done();
    });
});