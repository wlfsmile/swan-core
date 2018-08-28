/**
 * @file app的相关方法
 * @author houyu(houyu01@baidu.com)
 */
import {mixinLifeCycle} from './life-cycle';
import swanEvents from '../../utils/swan-events';

/**
 * 绑定app的环境相关事件
 *
 * @param {Object} [appObject] - app对象的实例
 * @param {Object} [swaninterface] - swaninterface小程序底层接口
 */
const bindLifeCycleEvent = (appObject, swaninterface) => {
    const appEventsToLifeCycle = ['onAppShow', 'onAppHide'];
    const appInfo = swaninterface.boxjs.data.get({name: 'swan-appInfoSync'});

    swaninterface
    .bind('lifecycle', event => {
        if (~appEventsToLifeCycle.indexOf(event.lcType)) {
            appObject[`_${event.lcType}`]
                && appObject[`_${event.lcType}`]({
                    event,
                    appInfo,
                    type: event.lcType
                });
        }
    })
    .bind('onLogin', event => {
        appObject['_onLogin']({
            event,
            appInfo,
            type: event.lcType
        });
    });

    swanEvents('master_preload_init_binding_environment_events');
};

/**
 * 获取所有的app操作方法(App/getApp)
 *
 * @param {Object} [swaninterface] - swan底层接口
 * @param {Object} [appLifeCycleEventEmitter] - app的数据流
 * @return {Object} 所有App相关方法的合集
 */
export const getAppMethods = (swaninterface, appLifeCycleEventEmitter) => {
    let initedAppObject = null;

    const getApp = () => initedAppObject;

    const App = appObject => {
        // 用生命周期去绑定用户传入的app对象
        // const appLifeCycle = this.lifeCycle.bindAppLifeCycle(appObject);
        // 将初始化之后的app对象，返回到上面，getApp时，可以访问
        initedAppObject = mixinLifeCycle(appObject, appLifeCycleEventEmitter);
        bindLifeCycleEvent(initedAppObject, swaninterface);
        // 获取app的相关信息，onLaunch是框架帮忙执行的，所以需要注入客户端信息
        const appInfo = swaninterface.boxjs.data.get({name: 'swan-appInfoSync'});
        // 触发launch事件
        initedAppObject._onAppLaunch({
            appInfo,
            event: {},
            type: 'onAppLaunch'
        });
        return initedAppObject;
    };

    return {App, getApp};
};
