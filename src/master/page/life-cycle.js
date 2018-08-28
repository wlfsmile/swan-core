/**
 * @file 单个页面的生命周期管理
 * @author houyu(houyu01@baidu.com)
 */
import swanEvents from '../../utils/swan-events';

const lifeCyclePrototype = {

    /**
     * onLoad生命周期，在页面入栈后既开始执行，在页面展现前既开始执行
     *
     * @param {Object} [params] - 页面onLoad的参数
     */
    _onLoad(params) {
        try {
            this.onLoad && this.onLoad(params);
        }
        catch (e) {
            console.error(e);
        }
        this._sendPageLifeCycleMessage('onLoad', params);
    },

    /**
     * onReady生命周期，在页面渲染完成，并通知master之后执行
     *
     * @param {Object} [params] - 页面onReady的参数
     *
     */
    _onReady(params) {
        try {
            this.onReady && this.onReady(params);
        }
        catch (e) {
            console.error(e);
        }
        this._sendPageLifeCycleMessage('onReady', params);
    },

    /**
     * onShow生命周期，在页面展现出来后，但还未渲染前执行(或页面从后台切到前台，则执行)
     *
     * @param {Object} [params] - onShow生命周期的参数
     */
    _onShow(params) {
        try {
            this.onShow && this.onShow(params);
        }
        catch (e) {
            console.error(e);
        }
        swanEvents('pageSwitchEnd', {
            slaveId: this.privateProperties.slaveId,
            timestamp: Date.now() + ''
        });
        this._sendPageLifeCycleMessage('onShow', params);
    },

    /**
     * onHide生命周期，在页面切换到后台，不在当前界时触发
     *
     * @param {Object} [params] - onHide生命周期的参数
     */
    _onHide(params) {
        this.onHide && this.onHide(params);
        this._sendPageLifeCycleMessage('onHide', params);
    },

    /**
     * onUnload生命周期，页面被卸载时执行(页面退栈)
     *
     * @param {Object} [params] - onUnload的生命周期参数
     */
    _onUnload(params) {
        this.onUnload && this.onUnload(params);
        this._sendPageLifeCycleMessage('onUnload', params);
    },

    /**
     * 页面下拉刷新时执行
     *
     * @param {Object} [params] - 页面发生下拉刷新时的参数
     */
    _pullDownRefresh(params) {
        this.onPullDownRefresh && this.onPullDownRefresh(params);
        this._sendPageLifeCycleMessage('onPullDownRefresh', params);
    },

    _onTabItemTap(params) {
        const proccessedParams = [].concat(params)[0];
        this.onTabItemTap && this.onTabItemTap(proccessedParams.e);
        this._sendPageLifeCycleMessage('onTabItemTap', params);
    },

    _share(params) {
        // 分享不需要清除之前postMessage过来的数据
        this.privateProperties.share.shareAction(params)
        .then(res => this._sendPageLifeCycleMessage('shareSuccess', res))
        .catch(err => this._sendPageLifeCycleMessage('shareFailed', err));
        this._sendPageLifeCycleMessage('shareAction', params);
    },

    _reachBottom(params) {
        this.onReachBottom && this.onReachBottom(params);
        this._sendPageLifeCycleMessage('onReachBottom', params);
    },

    _onPageScroll(params) {
        this.onPageScroll && this.onPageScroll(params);
        this._sendPageLifeCycleMessage('onPageScroll', params);
    },

    /**
     * 向事件流中发送生命周期通知，以便于下游使用
     *
     * @param {string} [eventName] - 发生的事件名称
     * @param {Object} [e] - 发生事件的参数
     */
    _sendPageLifeCycleMessage(eventName, e) {
        this._pageLifeCycleEventEmitter.fireMessage({
            type: 'PagelifeCycle',
            params: {
                eventName,
                slaveId: this.privateProperties.slaveId,
                accessUri: this.privateProperties.accessUri,
                e
            }
        });
    }
};

/**
 * Page中的生命周期
 * @param {Object} [pagePrototype] - Page的prototype
 * @param {Object} [swaninterface] - swaninterface
 * @param {Object} [pageLifeCycleEventEmitter] - 页面生命周期的事件流对象
 * @return merge后的Page的prototype
 */
export const mixinLifeCycle = (mastermanager, pagePrototype, pageLifeCycleEventEmitter) => {
    const swaninterface = mastermanager.swaninterface;
    return Object.assign(pagePrototype, lifeCyclePrototype, {
        _pageLifeCycleEventEmitter: pageLifeCycleEventEmitter
    });
};
