/**
 * @file APP的lifeCycle抽象
 * @author houyu(houyu01@baidu.com)
 */
import {processParam} from '../../utils/query';

const lifeCyclePrototype = {

    /**
     * 生命周期的函数中接收到的参数处理函数
     *
     * @param {Object} [data] - 待处理的数据
     * @return {Object} 处理后的数据
     */
    _lifeCycleParamsHandle(data) {
        const obj = data && data.appInfo || {};
        obj.referrerInfo = {
            appId: obj.appId,
            extraData: obj.extraData
        };
        return ['path', 'query', 'scene', 'shareTicket', 'referrerInfo']
        .reduce((prev, cur) => (prev[cur] = obj[cur] || '', prev), {});
    },

    /**
     * 向事件流中发送生命周期消息
     *
     * @param {Object} [eventName] - 生命周期事件名称
     * @param {Object} [e] - 事件对象
     */
    _sendAppLifeCycleMessage(eventName, e) {
        this._appLifeCycleEventEmitter.fireMessage({
            type: 'ApplifeCycle',
            params: {
                eventName,
                e
            }
        });
    },

    /**
     * appLaunch生命周期，在app启动时即自执行
     *
     * @param {Object} [params] - appLaunch的生命周期函数
     */
    _onAppLaunch(params) {
        try {
            const data = processParam(params);
            this.onLaunch && this.onLaunch(this._lifeCycleParamsHandle(data));
        }
        catch (e) {
            console.error(e);
        }
        this._sendAppLifeCycleMessage('onLaunch', {
            e: params.appInfo
        });
    },

    /**
     * appShow生命周期，在app启动/前后台切换时触发
     *
     * @param {Object} [params] - appShow生命周期参数
     */
    _onAppShow(params) {
        try {
            const data = processParam(params);
            this.onShow && this.onShow(this._lifeCycleParamsHandle(data));
        }
        catch (e) {
            console.error(e);
        }
        this._sendAppLifeCycleMessage('onShow', {
            e: params.appInfo
        });
    },

    /**
     * appHide生命周期，在app前后台切换时触发
     *
     * @param {Object} [params] - appHide生命周期参数
     */
    _onAppHide(params) {
        try {
            const data = processParam(params);
            this.onHide && this.onHide(this._lifeCycleParamsHandle(data));
        }
        catch (e) {
            console.error(e);
        }
        this._sendAppLifeCycleMessage('onHide', {
            e: params.appInfo
        });
    },

    /**
     * appError生命周期，在app生命周期内，如果发生错误，即触发
     *
     * @param {Object} [params] - appError生命周期的参数
     */
    _onAppError(params) {
        this.onError && this.onError(params);
        this._sendAppLifeCycleMessage('onError', {
            e: params.appInfo
        });
    },

    /**
     * app中如果发生login的变化，则触发此函数，并携带用户信息
     *
     * @param {Object} [params] - 登录后的用户信息
     */
    _onLogin(params) {
        this.onLogin && this.onLogin(params.event.loginMsg);
        this._sendAppLifeCycleMessage('onLogin', {
            e: params.appInfo
        });
    }
};

/**
 * 初始化app的生命周期的mixin函数
 *
 * @param {Object} [appObject] - app的原型对象
 * @param {Object} [appLifeCycleEventEmitter] - app生命周期的事件流对象
 * @return {Object} 装饰后的app原型对象
 */
export const mixinLifeCycle = (appObject, appLifeCycleEventEmitter) => {
    return Object.assign(appObject, lifeCyclePrototype, {
        _appLifeCycleEventEmitter: appLifeCycleEventEmitter
    });
};
