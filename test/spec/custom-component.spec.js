describe('swan custom-component test', function() {
    const root = 'pages/route/';
    define(`${root}comp`,
    function (require, module, exports, define, swan, getApp,
        window, document, frames, self, location, navigator, localStorage, history, Caches
    ) {
        const myBehavior = Behavior({
            properties: {
                name: {
                    type: String,
                    value: 'swan'
                }
            }
        });

        Component({
            properties: {
                title: {
                    type: String,
                    value: 'title'
                }
            },

            data: {
                content: 'content'
            },

            behaviors: [myBehavior],

            attached() {

            },

            ready() {

            }
        });
    });

    window.__swanRoute = `${root}comp`;
    require(`${root}comp`);

    // let customComponentPageInstance = null;
    define('pages/customcomponent/customcomponent',
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
    window.__swanRoute = 'pages/customcomponent/customcomponent';
    require('pages/customcomponent/customcomponent');
    window.usingComponents = ['pages/route/comp'];

    const methodObj = window.master.virtualComponentFactory.getComponentInstance(`${root}comp`, {
        data: {
            tilte: 'component'
        }
    });

    // swan.navigateTo({url: 'pages/customcomponent/customcomponent'})

    // const customComponentPageInstance = window.masterManager.navigator.history
        //.seek('pages/customcomponent/customcomponent').userPageInstance.pageObj;

    // customComponentPageInstance.privateMethod.onPageRender({
    //     customComponents: [{
    //         componentName: "mbdsqa",
    //         componentPath: "pages/component/mbdsqa/mbdsqa",
    //         nodeId: "_f4213",
    //         data: {}
    //     }]
    // });

    // methodObj.selectAllComponents('.class');
});
