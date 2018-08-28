/**
 * @file 分享相关的抽象
 * @author houyu(houyu01@baidu.com)
 *          jianglian(jianglian@baidu.com)
 */

export class Share {
    static shareDefaultConfig = {
        content: '世界很复杂，百度更懂你',
        path: null,
        success() {},
        fail() {},
        complete() {}
    }
    constructor(swaninterface, appid, pageObj, initPath, shareConfig) {
        this.appid = appid;
        this.pageObj = pageObj;
        this.swaninterface = swaninterface;
        this.shareConfig = this.mergeShareConfig(shareConfig, {path: initPath});
    }
    mergeShareConfig(config, options) {
        const title = this.swaninterface.boxjs.data.get({name: 'swan-appInfoSync'}).appname;
        config = config || {...Share.shareDefaultConfig, ...{title}};
        return {...config, ...options};
    }
    
    getShareParams(from = 'menu', target = null) {
        let shareConfig = this.shareConfig;
        if (this.pageObj.onShareAppMessage) {
            const userShareParams = this.pageObj.onShareAppMessage({
                from,
                target
            });
            if (userShareParams && typeof userShareParams === 'object') {
                shareConfig = {...this.shareConfig, ...userShareParams};
            }
        }
        return shareConfig;
    }
    shareAction({from, target}) {
        const shareParams = this.getShareParams({from, target});
        return new Promise((resolve, reject) => {
            global.swan.openShare({
                ...shareParams,
                success(res) {
                    shareParams.success(res);
                    shareParams.complete();
                    resolve(res);
                },
                fail(err) {
                    shareParams.fail(err);
                    shareParams.complete();
                    reject(err);
                }
            });
        });
    }
}