/**
 * @file swan-core test for Route
 * @author wangxin63@baidu.com
 */
describe('route test', () => {
    const root = 'pages/route/';
    const {swan, swanInterface, getCurrentPages} = window;
    const dispatchEvent = window.testutils.clientActions.dispatchEvent;
    let called = 0;
    function createSwanPage(uri = `${root}page1`) {
        return new Promise(resolve => {
            window.define(uri, () => new window.Page({
                data: {
                    name: 'route test'
                }
            }));
            window.__swanRoute = uri;
            require(uri);
            dispatchEvent('AppReady', {
                pageUrl: uri,
                wvID: '1',
                appPath: '',
                appConfig: '{'
                +    '"pages": ['
                +        `"${root}page1",`
                +        `"${root}page2"`
                +    '],'
                +    '"tabBar": {'
                +        '"list": ['
                +            '{'
                +               '"iconPath": "images/component_normal.png",'
                +               '"selectedIconPath": "images/component_selected.png",'
                +               `"pagePath": "${root}page1",`
                +               '"text": "标签1"'
                +            '},'
                +            '{'
                +               '"iconPath": "images/API_normal.png",'
                +               '"selectedIconPath": "images/API_selected.png",'
                +               `"pagePath": "${root}page2",`
                +               '"text": "标签2"'
                +            '}'
                +        ']'
                +    '}'
                + '}'
            });
            setTimeout(resolve, 5);
        });
    }
    function getHistoryStack() {
        return window.masterManager.navigator.history.historyStack;
    }
    // +
    function getTopSlave() {
        const historyStack = getHistoryStack();
        return historyStack[historyStack.length - 1];
    }
    function getTopSlaveUri() {
        const topSlave = getTopSlave();
        return topSlave.uri ? topSlave.uri : topSlave.getCurrentChildren().uri;
        // const historyStack = getHistoryStack();
        // const topSlave = historyStack[historyStack.length - 1];
        // return topSlave.uri ? topSlave.uri : topSlave.getCurrentChildren().uri;
    }
    beforeAll(() => {
        // 扩展swanInterface
        swanInterface.close = params => new Promise((resolve, reject) => {
            const args = {};
            resolve(args);
            params.success && params.success(args);
        });
        swanInterface.navigateBack = params => new Promise((resolve, reject) => {
            const args = {};
            resolve(args);
            params.success && params.success(args);
            called++;
        });
        swanInterface.onRoute = cb => {
            swanInterface.bind('route', e => {
                cb && cb(e);
            });
            return swanInterface;
        };
    });
    beforeEach(() => {
        const historyStack = getHistoryStack();
        if (historyStack && historyStack.length !== 0) {
            historyStack.forEach(item => item.close());
            window.masterManager.navigator.history.historyStack = [];
        }
    });
    describe('execute getCurrentPages', () => {
        it('Should report current page uri', done => {
            createSwanPage().then(() => {
                expect(getCurrentPages).toEqual(jasmine.any(Function));
                const currentPages = getCurrentPages();
                expect(currentPages).toEqual(jasmine.any(Array));
                expect(currentPages.length).toEqual(1);
                expect(currentPages[0].uri).toEqual(`${root}page1`);
                done();
            });
        });
    });

    describe('swan route test', () => {
        it('Get one slave id', () => {
            createSwanPage().then(() => {
                const topSlave = getTopSlave();
                const newslaveId = topSlave.getSlaveId();
                expect(topSlave.getSlaveId).toEqual(jasmine.any(Function));
                expect(newslaveId).toEqual(1);
            });
        });

        it('Get front uri', () => {
            createSwanPage().then(() => {
                const topSlave = getTopSlave();
                expect(topSlave.getFrontUri).toEqual(jasmine.any(Function));
                
                expect(topSlave.getFrontUri).toEqual(jasmine.any(Function));
                const uri = topSlave.getFrontUri();
                expect(uri).toEqual(jasmine.any(String));
                expect(uri).toEqual(`${root}page1`);
            });
        });

        it('Get current childs', () => {
            createSwanPage().then(() => {
                const topSlave = getTopSlave();
                expect(topSlave.getCurrentChildren).toEqual(jasmine.any(Function));
                const currentChild = topSlave.getCurrentChildren();
                // expect(currentChild).toEqual(jasmine.any(Object));
                // expect(currentChild.getSlaveId()).toEqual(1);
            });
        });

        it('Find child', () => {
            createSwanPage().then(() => {
                const topSlave = getTopSlave();
                expect(topSlave.findChild).toEqual(jasmine.any(Function));
                expect(topSlave.getCurrentChildren).toEqual(jasmine.any(Function));
                const currentChild = topSlave.getCurrentChildren();
                expect(currentChild).toEqual(jasmine.any(Object));
                expect(currentChild.findChild).toEqual(jasmine.any(Function));
                const findChild = currentChild.findChild();
                expect(findChild).toEqual(jasmine.any(Object));
            });
        });

        it('Page private method', done => {
            createSwanPage().then(() => {
                const slave = getTopSlave().getCurrentChildren();
                slave.userPageInstance = {
                    ...slave.userPageInstance,
                    pageObj: {
                        privateMethod: {
                            test() {
                                called++;
                            }
                        }
                    }
                }
                expect(slave.callPrivatePageMethod).toEqual(jasmine.any(Function));
                slave.callPrivatePageMethod('test');
                expect(called).toEqual(1);
                called = 0;
                done();
            });
        });

        it('Should not init current page', ()=> {
            createSwanPage().then(() => {
                const slave = getTopSlave();
                slave.init();
                expect(slave.init).toEqual(jasmine.any(Function));
                const init = slave.init();
                swanInterface.init = params => params.success({});
                const args = {
                    pageUrl: 'page1',
                    success() {}
                };
                spyOn(args, 'success');
                init(args).then(() => {
                    expect(args.success).toHaveBeenCalled();
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(1);
                    expect(getTopSlaveUri()).toEqual(`${root}page1`);
                    done();
                });
            });
        });
    })

    describe('swan route test', () => {
        it('Should jump to another page', done => {
            expect(swan.navigateTo).toEqual(jasmine.any(Function));
            createSwanPage().then(() => {
                // fecs规范: 回调嵌套不能超过三层
                function verification() {
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(2);
                    expect(historyStack[0].children[0].uri).toEqual(`${root}page1`);
                    expect(getTopSlaveUri()).toEqual(`${root}page2`);
                    done();
                }
                swan.navigateTo({
                    url: 'page2'
                }).then(verification);
            });
        });
        it('Should redirect to a new page', done => {
            expect(swan.redirectTo).toEqual(jasmine.any(Function));
            createSwanPage().then(() => {
                swanInterface.redirectTo = params => params.success({});
                const args = {
                    url: 'page2',
                    success() {}
                };
                spyOn(args, 'success');
                swan.redirectTo(args).then(() => {
                    expect(args.success).toHaveBeenCalled();
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(1);
                    expect(getTopSlaveUri()).toEqual(`${root}page2`);
                    done();
                });
            });
        });
        it('Should not redirecting to a new page', done => {
            expect(swan.redirectTo).toEqual(jasmine.any(Function));
            createSwanPage().then(() => {
                swanInterface.redirectTo = params => params.fail({});
                const args = {
                    url: 'page2',
                    fail() {}
                };
                spyOn(args, 'fail');
                swan.redirectTo(args).catch(() => {
                    expect(args.fail).toHaveBeenCalled();
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(1);
                    expect(getTopSlaveUri()).toEqual(`${root}page1`);
                    done();
                });
            });
        });
        it('Should reLaunch current page', done => {
            expect(swan.reLaunch).toEqual(jasmine.any(Function));
            createSwanPage().then(() => createSwanPage(`${root}page2`)).then(() => {
                swanInterface.reLaunch = params => params.success({});
                const args = {
                    url: 'page1',
                    success() {}
                };
                spyOn(args, 'success');
                swan.reLaunch(args).then(() => {
                    expect(args.success).toHaveBeenCalled();
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(1);
                    expect(getTopSlaveUri()).toEqual(`${root}page1`);
                    done();
                });
            });
        });
        it('Should not reLaunch current page', done => {
            expect(swan.reLaunch).toEqual(jasmine.any(Function));
            createSwanPage().then(() => createSwanPage(`${root}page2`)).then(() => {
                swanInterface.reLaunch = params => params.fail({});
                const args = {
                    url: 'page1',
                    fail() {}
                };
                spyOn(args, 'fail');
                swan.reLaunch(args).catch(() => {
                    expect(args.fail).toHaveBeenCalled();
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(2);
                    expect(getTopSlaveUri()).toEqual(`${root}page2`);
                    done();
                });
            });
        });
        it('Should switch current tab', done => {
            expect(swan.switchTab).toEqual(jasmine.any(Function));
            swanInterface.switchTab = () => {};
            spyOn(swanInterface, 'switchTab');
            createSwanPage().then(() => {
                swan.switchTab({url: `${root}page2`});
                expect(swanInterface.switchTab).toHaveBeenCalled();
                done();
            });
        });
        it('Should return to the last page', done => {
            expect(swan.navigateBack).toEqual(jasmine.any(Function));
            createSwanPage()
                .then(() => createSwanPage(`${root}page2`))
                .then(() => createSwanPage(`${root}page3`))
                .then(() => createSwanPage(`${root}page4`))
                .then(() => swan.navigateBack({url: `${root}page2`}))
                .then(() => {
                    expect(called).toEqual(1);
                    called = 0;
                    dispatchEvent('route', {
                        routeType: 'navigateBack',
                        toId: `${root}page3`
                    });
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(3);
                    expect(getTopSlaveUri()).toEqual(`${root}page3`);
                })
                .then(() => {
                    dispatchEvent('route', {
                        routeType: 'navigateBack',
                        toId: `${root}page2`
                    });
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(2);
                    expect(getTopSlaveUri()).toEqual(`${root}page2`);
                })
                .then(() => {
                    dispatchEvent('route', {
                        routeType: 'navigateBack',
                        toId: `${root}page1`
                    });
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(2);
                    expect(historyStack[0].getCurrentChildren().uri).toEqual(`${root}page1`);
                    done();
                });
        });
        it('A complete test of route', done => {
            swanInterface.redirectTo = params => params.success({});
            swanInterface.reLaunch = params => params.success({});
            createSwanPage()
                .then(() => createSwanPage(`${root}page2`))
                .then(() => {
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(2);
                    expect(historyStack[0].children[0].uri).toEqual(`${root}page1`);
                    expect(getTopSlaveUri()).toEqual(`${root}page2`);
                })
                .then(() => swan.redirectTo({url: 'page1'}))
                .then(() => {
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(2);
                    expect(historyStack[0].children[0].uri).toEqual(`${root}page1`);
                    expect(getTopSlaveUri()).toEqual(`${root}page1`);
                })
                .then(() => swan.navigateTo({url: 'page3'}))
                .then(() => swan.navigateTo({url: 'page4'}))
                .then(() => {
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(4);
                    expect(historyStack[0].getCurrentChildren().uri).toEqual(`${root}page1`);
                    expect(historyStack[1].getCurrentChildren().uri).toEqual(`${root}page1`);
                    expect(getTopSlaveUri()).toEqual(`${root}page4`);
                })
                .then(() => swan.redirectTo({url: 'page2'}))
                .then(() => {
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(4);
                    expect(getTopSlaveUri()).toEqual(`${root}page2`);
                })
                .then(() => {
                    dispatchEvent('route', {
                        routeType: 'navigateBack',
                        toId: `${root}page3`
                    });
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(3);
                    expect(getTopSlaveUri()).toEqual(`${root}page3`);
                })
                .then(() => swan.navigateTo({url: 'page5'}))
                .then(() => swan.navigateTo({url: 'page4'}))
                .then(() => swan.navigateTo({url: 'page6'}))
                .then(() => {
                    dispatchEvent('route', {
                        routeType: 'navigateBack',
                        toId: `${root}page4`
                    });
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(5);
                    expect(getTopSlaveUri()).toEqual(`${root}page4`);
                })
                .then(() => swan.reLaunch({url: 'page5'}))
                .then(() => {
                    const historyStack = getHistoryStack();
                    expect(historyStack.length).toEqual(1);
                    expect(getTopSlaveUri()).toEqual(`${root}page5`);
                    done();
                });
        });
    });
});