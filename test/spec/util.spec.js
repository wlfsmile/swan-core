describe('util-query', () => {
    const {
        dispatchEvent
    } = window.testutils.clientActions;
    dispatchEvent('onAppShow', {
        pageUrl: 'pages/lifycycle/lifycycle',
        wvID: '1',
        e: {
            appLaunchScheme: 'baiduboxapp://swan/4fecoAqgCIUtzIyA4FAPgoyrc4oUc25c_dev9145/pages/button/button/?name=xx&age=11&_baiduboxapp={"from":"rtyu","ext":{}}&callback=_bdbox_js_275&upgrade=0'
        }
    });

    var appOnLaunch = 0;
    var appOnShow = 0;
    var appOnHide = 0;
    var appLaunche = null;
    var appShowe = null;

    const appObj = {
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
        }
    };

    App(appObj)._onAppLaunch({
        appInfo: {
            appLaunchScheme: 'baiduboxapp://swan/4fecoAqgCIUtzIyA4FAPgoyrc4oUc25c_dev9145/pages/button/button/?name=xx&age=11&_baiduboxapp={"from":"rtyu","ext":{}}&callback=_bdbox_js_275&upgrade=0'
        },
        type: 'onAppLaunch'
    });
});
