describe('swan render test', function () {

    it('slave render has dom and variables', function (done) {
        define('pages/render/render', 
            function (require, module, exports, define, swan, getApp,
                window, document, frames, self, location, navigator, localStorage, history, Caches
            ) {
                Page({
                    data: {
                        name: 'swan'
                    }
                });
            }
        );

        window.__swanRoute = 'pages/render/render';require('pages/render/render');
        // when client dispatch an ready event
        window.swan.navigateTo({
            url: '/pages/render/render',
            slaveActionMap: {
                'test:slave-dom-render': function (e) {
                    expect(e).toEqual(jasmine.any(Object));
                },
                'test:slave-dom-get-data': function (e) {
                    expect(e.content).toEqual('swan');
                    done();
                }
            },
            template: `'<div id="test_content">{{name}}</div>'`,
            slaveHookJs: `
                window.afterSlave = function () {
                    var testContent = document.getElementById('test_content');
                    if (testContent) {
                        window.testutils.clientActions.sendMasterMessage({
                            type: 'test:slave-dom-render',
                        });
                        window.testutils.clientActions.sendMasterMessage({
                            type: 'test:slave-dom-get-data',
                            content: testContent.innerHTML
                        });
                    }
                };
            `
        })
        .then(function (res) {
            window.testutils.clientActions.bind('slaveLoaded', function (e) {
                if (+e.slaveId === +res.wvID) {
                    expect(e).toEqual(jasmine.any(Object));
                    expect(e.slaveId).toEqual(jasmine.any(Number));
                    window.testutils.clientActions.dispatchEvent(e.type, e);
                }
            });
            done();
        });
    });
});
