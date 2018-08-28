/**
 * @file swan's navigator interface for user
 * @author houyu(houyu01@baidu.com)
 */
import Slave from './slave';
import History from './history';
import TabSlave from './tab-slave';
import {pathResolver} from '../../utils';
import swanEvents from '../../utils/swan-events';

export class Navigator {
    constructor(swaninterface) {
        this.history = new History([]);
        this.swaninterface = swaninterface;
    }
    setAppConfig(appConfig) {
        // 第一次从客户端获取到appConfig
        this.appConfig = appConfig;
    }
    pushInitSlave(initParams) {
        // Route事件监听开启
        this.listenRoute();

        swanEvents('master_active_create_initslave');
        // 创建初始化slave
        this.initSlave = this.createInitSlave(initParams.pageUrl, this.appConfig);
        
        // slave的init调用
        this.initSlave.init(initParams)
        .then(initRes => {
            swanEvents('master_active_create_initslave_end');
            // 入栈
            this.history.pushHistory(this.initSlave);
            swanEvents('master_active_push_initslave_end');

            // 调用slave的onEnqueue生命周期函数
            this.initSlave.onEnqueue();
            swanEvents('master_active_onqueue_initslave');

        });
    }
    navigateTo(params) {
        params.url = this.pathResolver(params.url);
        const {url, slaveId} = params;
        const {appConfig, swaninterface} = this;
        const newSlave = new Slave({
            uri: url,
            slaveId,
            appConfig,
            swaninterface
        });
        // TODO: openinit openNext 判断有问题
        return newSlave.open(params)
        .then(res => {
            const slaveId = res.wvID;
            // navigateTo的第一步，将slave完全实例化
            newSlave.setSlaveId(slaveId);
            // navigateTo的第二步，讲slave推入栈
            this.history.pushHistory(newSlave);
            // navigateTo的第三步，调用slave的onEnqueue生命周期函数
            newSlave.onEnqueue();
            return res;
        });
    }
    redirectTo(paramsObj) {
        paramsObj.url = this.pathResolver(paramsObj.url);
        return this.history.historyStack.filter(slave =>
        !slave.isClosing)[this.history.historyStack.length - 1].redirect(paramsObj);
    }
    navigateBack(paramsObj = {}) {
        const topSlave = this.history.getTopSlaves()[0];
        // 将即将退栈的slave状态改为退栈中（实际上还未退出）
        topSlave.isClosing = true;
        return this.swaninterface.invoke('navigateBack', paramsObj).finally(() => {
            // 真正完成退栈
            topSlave.isClosing = false;
        });
    }
    switchTab(paramsObj) {
        paramsObj.url = this.pathResolver(paramsObj.url);
        return this.initSlave.switchTab(paramsObj);
    }
    reLaunch(paramsObj = {}) {
        if (!paramsObj.url) {
            const topSlave = this.history.getTopSlaves()[0];
            paramsObj.url = topSlave.getFrontUri();
        }
        paramsObj.url = this.pathResolver(paramsObj.url);
        const targetSlave = this.getSlaveEnsure(paramsObj.url, true);
        return targetSlave.reLaunch(paramsObj)
        .then(res => {
            const slaveId = res.wvID;
            this.initSlave = targetSlave;
            // reluanch的第一步，先把栈清空
            this.history.clear();
            // 然后重新入栈当前重新生成的slave
            this.history.pushHistory(targetSlave);
            // 调用重新入栈的生命周期方法
            targetSlave.onEnqueue();
            return res;
        });
    }

    listenRoute() {
        // 原生层传递过来的消息
        return this.swaninterface
        .invoke('onRoute', ({routeType, fromId, toId, toPage}) => {
            swanEvents('pageSwitchStart', {
                slaveId: toId,
                timestamp: Date.now() + ''
            });
            this[`on${routeType}`].call(this, fromId, toId, toPage);
        });
    }
    oninit(fromId, toId) {}
    onnavigateTo(fromId, toId) {}
    onredirectTo(fromId, toId) {}
    onreLaunch(fromId, toId) {}
    onnavigateBack(fromId, toId) {
        // 弹出delta个slave并挨个执行其close方法
        this.history.popTo(toId);
    }
    onswitchTab(fromId, toId, toPage) {
        this.initSlave.onswitchTab({fromId, toId, toPage});
    }
    pathResolver(path) {
        if (/^\//g.exec(path)) {
            return path.replace(/^\//g, '');
        }
        const topSlaveUri = this.history.getTopSlaves()[0].getUri().replace(/[^\/]*$/g, '');
        const uriStack = pathResolver(topSlaveUri, path, () => {
            console.error(`navigateTo:fail url "${path}"`);
        });
        return uriStack.join('/').replace(/^\//g, '');
    }
    /**
     * 从history栈中获取slave，如果获取不到，则产生新的slave
     *
     * @param {string} [url] 需要获取的slaveid
     * @param {boolean} [getSuperSlave] 是否需要获取叶子节点，还是需要获取composite就行
     * @return {Object} slave对象
     */
    getSlaveEnsure(url, getSuperSlave) {
        let targetSlave = this.history.seek(url, getSuperSlave);
        if (!targetSlave) {
            targetSlave = this.createInitSlave(url, this.appConfig);
        }
        return targetSlave;
    }
    /**
     * 产生初始化的slave的工厂方法
     *
     * @param {string} initUri 初始化的uri
     * @param {Object} appConfig 小程序配置的app.json中的配置内容
     * @return {Object} 一个slave或slaveSet
     */
    createInitSlave(initUri, appConfig) {
        let tabBarList = [];
        try {
            tabBarList = appConfig.tabBar.list;
        }
        catch (e) {}
        const initPath = initUri.split('?')[0];
        const currentIndex = tabBarList.findIndex(tab => tab.pagePath === initPath);
        const swaninterface = this.swaninterface;
        if (tabBarList.length > 1 && currentIndex > -1) {
            return new TabSlave({
                list: tabBarList,
                currentIndex,
                appConfig,
                swaninterface
            });
        }
        return new Slave({
            uri: initUri,
            appConfig,
            swaninterface
        });
    }
}
