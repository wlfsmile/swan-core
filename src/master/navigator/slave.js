/**
 * @file swan's slave leaf class
 * @author houyu(houyu01@baidu.com)
 */
import {createPageInstance} from '../page';
import {STATUE_MAP} from './slave-common-parts';
import swanEvents from '../../utils/swan-events';
import Communicator from '../../utils/communication';
import {getParams, loader, executeWithTryCatch} from '../../utils';


export default class Slave {
    /**
     * Slave构造函数
     *
     * @param {string} uri slave的uri
     * @param {string} slaveId slave的唯一标识
     * @param {Object} navigationParams slave的唯一标识
     * @param {Object} swaninterface slave使用的swan-api
     */
    constructor({
            uri,
            slaveId = null,
            appConfig = {},
            swaninterface = {}
        }) {
        this.uri = uri.split('?')[0];
        this.accessUri = uri;
        this.slaveId = slaveId;
        this.status = STATUE_MAP.INITED;
        this.appConfig = appConfig;
        this.swaninterface = swaninterface;
        this.userPageInstance = {};
        this.appRootPath = appConfig.appRootPath;
    }
    /**
     * 判断slave当前状态
     *
     * @return {boolean} 当前状态
     */
    isCreated() {
        return this.status === STATUE_MAP.CREATED;
    }
    /**
     * 获取当前slave的uri
     *
     * @return {string} 当前slave的uri
     */
    getUri() {
        return this.uri;
    }
    /**
     * 将slave实例与用户的page对象进行绑定，一实例一对象，自己管理自己的页面对象
     * userPageInstance为用户(开发者)定义的页面对象
     *
     * @param {Object} userPageInstance 开发者设定的页面的生成实例
     */
    setUserPageInstance(userPageInstance) {
        this.userPageInstance = userPageInstance;
    }
    /**
     * 获取当前slave的开发者实例
     *
     * @return {Object} 开发者的slave实例
     */
    getUserPageInstance() {
        return this.userPageInstance;
    }
    /**
     * 设置slave的id
     *
     * @param {string} slaveId slave的客户端给出的id
     * @return {Object} 当前slave的操作实例
     */
    setSlaveId(slaveId) {
        // 如果新的slaveid与之前的slaveid不相等，证明本slave重新被创建，则进行一次重置
        if (+this.slaveId !== +slaveId) {
            this.status = STATUE_MAP.CREATING;
        }
        this.slaveId = slaveId;
        return this;
    }
    /**
     * 获取当前slave的id
     *
     * @return {string} 当前slave的id
     */
    getSlaveId() {
        return this.slaveId;
    }
    /**
     * 设置当前slave的uri
     *
     * @param {string} uri 当前slave的uri
     * @return {Object} 当前slave的操作实例
     */
    setSlaveUri(uri) {
        this.uri = uri;
        return this;
    }
    /**
     * 获取slave展示给用户的slave的uri，对于普通slave来讲，当前展示的就是自己
     *
     * @return {string} 当前slave的uri
     */
    getFrontUri() {
        return this.uri;
    }
    /**
     * 在当前slave中查找slave，对于普通slave来讲，获取的就是自己
     *
     * @return {Object} 当前slave实例
     */
    findChild() {
        return this;
    }
    /**
     * 在当前的slave中查找
     *
     * @return {Object} 当前slave的操作实例
     */
    getCurrentChildren() {
        return this;
    }
    /**
     * 切换tab客户端回调函数
     *
     * @param {Object} params 切换tab后，客户端派发的参数
     */
    onswitchTab(params) {
        return;
    }
    /**
     * 调用当前slave的page对象的私有方法
     *
     * @param {string} methodName 方法名
     * @param {Object} options 调用私有方法的选项
     * @param {...*} args 传递给page对象的方法
     * @return {*} 私有方法的return值
     */
    callPrivatePageMethod(methodName, options = {}, ...args) {
        return this.userPageInstance.pageObj.privateMethod[methodName]
        .call(this.userPageInstance.pageObj, ...args);
    }
    /**
     * 重登录到某一个特定页面
     *
     * @param {Object} navigationParams navigation跳转的参数
     * @return {Promise} relaunch处理的事件流
     */
    reLaunch(navigationParams) {
        if (!navigationParams.url) {
            navigationParams.url = this.getFrontUri();
        }
        this.status = STATUE_MAP.CREATING;
        return new Promise((resolve, reject) => {
            this.swaninterface.invoke('reLaunch', {
                ...navigationParams,
                ...{
                    success: res => {
                        executeWithTryCatch(navigationParams.success, null, 'success api execute error');
                        resolve(res);
                    },
                    fail: res => {
                        executeWithTryCatch(navigationParams.fail, null, 'fail api execute error');
                        reject(res);
                    },
                    complete: res => {
                        executeWithTryCatch(navigationParams.complete, null, 'complete api execute error');
                    }
                }
            });
        })
        .then(res => {
            if (res.root) {
                return loader.loadjs(`${this.appRootPath}/${res.root}/app.js`)
                .then(() => res);
            }
            return res;
        })
        .then(res => {
            this.slaveId = res.wvID;
            this.uri = navigationParams.url.split('?')[0];
            this.accessUri = navigationParams.url;
            this.setSlaveUri(navigationParams.url);
            return res;
        });
    }
    /**
     * 判断当前slave是否某一特定slave
     *
     * @param {string} tag 表示某一slave的特殊标记uri/slaveId均可
     * @return {boolean} 是否是当前slave
     */
    isTheSlave(tag) {
        return this.uri.split('?')[0] === ('' + tag).split('?')[0] || +this.slaveId === +tag;
    }
    /**
     * 初始化为第一个页面
     *
     * @param {Object} initParams 初始化的配置参数
     * @return {Promise} 返回初始化之后的Promise流
     */
    init(initParams) {
        return Promise.resolve(initParams)
        .then(initParams => {
            if (initParams.root) {
                swanEvents('master_active_init_action', Communicator.getInstance(this.swaninterface));
                return loader.loadjs(`${this.appRootPath}/app.js`, 'master_active_app_js_loaded')
                .then(() => {
                    return initParams;
                });
            }
            return initParams;
        })
        .then(initParams => {
            this.uri = initParams.pageUrl.split('?')[0];
            this.accessUri = initParams.pageUrl;
            this.slaveId = initParams.slaveId;
            // init的事件为客户端处理，确保是在slave加载完成之后，所以可以直接派发
            this.swaninterface.communicator.fireMessage({
                type: `slaveLoaded${this.slaveId}`,
                message: {slaveId: this.slaveId}
            });
            return initParams;
        });
    }
    /**
     * 入栈之后的生命周期方法
     *
     * @return {Object} 入栈之后，创建的本slave的页面实例对象
     */
    onEnqueue() {
        return this.createPageInstance();
    }
    open(navigationParams) {
        this.status = STATUE_MAP.CREATING;
        return new Promise((resolve, reject) => {
            this.swaninterface.invoke('navigateTo', {
                ...navigationParams,
                ...{
                    success: res => {
                        executeWithTryCatch(navigationParams.success, null, 'success api execute error');
                        resolve(res);
                    },
                    fail: res => {
                        executeWithTryCatch(navigationParams.fail, null, 'fail api execute error');
                        reject(res);
                    },
                    complete: res => {
                        executeWithTryCatch(navigationParams.complete, null, 'complete api execute error');
                    }
                }
            });
        })
        .then(res => {
            if (res.root) {
                return loader.loadjs(`${this.appRootPath}/${res.root}/app.js`)
                .then(() => res);
            }
            return res;
        })
        .then(res => {
            this.slaveId = res.wvID;
            return res;
        });
    }
    redirect(navigationParams) {
        this.close();
        return new Promise((resolve, reject) => {
            this.swaninterface.invoke('redirectTo', {
                ...navigationParams,
                ...{
                    success: res => {
                        executeWithTryCatch(navigationParams.success, null, 'success api execute error');
                        resolve(res);
                    },
                    fail: res => {
                        executeWithTryCatch(navigationParams.fail, null, 'fail api execute error');
                        reject(res);
                    },
                    complete: res => {
                        executeWithTryCatch(navigationParams.complete, null, 'complete api execute error');
                    }
                }
            });
        })
        .then(res => {
            if (res.root) {
                return loader.loadjs(`${this.appRootPath}/${res.root}/app.js`)
                .then(() => res);
            }
            return res;
        })
        .then(res => {
            this.uri = navigationParams.url.split('?')[0];
            this.accessUri = navigationParams.url;
            this.slaveId = res.wvID;
            this.status = STATUE_MAP.CREATING;
            this.createPageInstance();
            return res;
        });
    }
    /**
     * 创建页面实例，并且，当slave加载完成之后，向slave传递初始化data
     *
     * @return {Promise} 创建完成的事件流
     */
    createPageInstance() {
        if (this.isCreated()) {
            return Promise.resolve();
        }
        swanEvents('master_active_create_page_flow_start', {
            uri: this.uri
        });
        const userPageInstance = createPageInstance(this.accessUri, this.slaveId, this.appConfig);
        const query = userPageInstance.pageObj.privateProperties.accessUri.split('?')[1];
        this.setUserPageInstance(userPageInstance);

        try {
            userPageInstance.pageObj._onLoad(getParams(query));
        }
        catch (e) {
        }
        this.status = STATUE_MAP.CREATED;
        return this.swaninterface.invoke('loadJs', {
            uri: this.uri,
            eventObj: {
                wvID: this.slaveId
            },
            success: params => {
                swanEvents('master_active_create_page_flow_end');
                return userPageInstance.sendInitData(params)
            }
        });
    }

    switchTab(params) {
        return this.swaninterface.swan.reLaunch({
            ...params,
            url: '/' + params.url
        });
    }

    switchTab(params) {
        return this.swaninterface.swan.reLaunch({
            ...params,
            url: '/' + params.url
        });
    }

    /**
     * 析构方法
     *
     * @return {Object} 当前slave的操作实例
     */
    close() {
        try {
            this.userPageInstance.pageObj._onUnload();
        }
        catch (e) {}
        this.status = STATUE_MAP.CLOSED;
        return this;
    }
}
