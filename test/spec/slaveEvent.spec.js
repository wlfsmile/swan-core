describe('slave-events', function() {
    const {
        dispatchEvent
    } = window.testutils.clientActions;
    define('pages/slave/event',
        function (require, module, exports, define, swan, getApp,
            window, document, frames, self, location, navigator, localStorage, history, Caches
        ) {
            Page({
                share() {
                    return 'share'
                },
                live() {
                    return 'live';
                },
                videoEventsDispatch() {
                    return 'video';
                },
                mapEventsDispatch() {
                    return 'map';
                },
                cameraEventsDispatch() {
                    return 'camera';
                }
            });
        }
    );
    window.__swanRoute = 'pages/slave/event';require('pages/slave/event');
    window.basePath = '';
    window.testutils.clientActions.appReady(2, 'pages/slave/event');
    window.testutils.clientActions.show(2);
    window.masterManager.navigator.history.seek(2);
    window.masterManager.navigator.history.hasTheSlave(2);

    describe('swan route test', () => {
        var eventsArr = ['sharebtn', 'live', 'video', 'map', 'camera', 'ARCamera', 'backtohome'];
        eventsArr.forEach(item => {
            it(`${item}`, () => {
                dispatchEvent(`${item}`, {
                    pageUrl: 'pages/slave/event',
                    wvID: '2'
                });
            });
        });
        var historyArr = [];
        window.masterManager.navigator.history.each(index => {
            historyArr.push(`pos-${index}`);
        });
        it('test history stack', () => {
            expect(historyArr.length).toEqual(1);
        })
    });
});