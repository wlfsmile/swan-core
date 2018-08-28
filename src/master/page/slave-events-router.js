/**
 * @file 小程序slave中组件相关的事件的派发，到达master中
 *       需要转发给：开发者/私有对象/日志 进行对应处理
 * @author houyu(houyu01@baidu.com)
 */
import swanEvents from '../../utils/swan-events';

/**
 * slave的事件封装分发器，封装了大量的无逻辑公有方法
 *
 * @class
 */
export default class SlaveEventsRouter {
    constructor(masterManager, pageLifeCycleEventEmitter) {
        this.masterManager = masterManager;
        this.history = masterManager.navigator.history;
        this.slaveCommunicator = masterManager.communicator;
        this.pageLifeCycleEventEmitter = pageLifeCycleEventEmitter;
        swanEvents('master_preload_construct_slave_events_router');
    }
    /**
     * 初始化所有页面级相关事件的绑定
     */
    initbindingEvents() {
        this.bindPrivateEvents();
        this.bindDeveloperEvents();
        this.bindEnviromentEvents();
        this.bindLifeCycleEvent(this.pageLifeCycleEventEmitter);
        swanEvents('master_preload_init_binding_events');
    }
    /**
     * 调用发生事件的页面的同名方法
     *
     * @param {string} slaveId 想要派发的页面的slave的id
     * @param {string} methodName 事件名称
     * @param {Object|null} options 派发事件的可配置项
     * @param {...*} args 透传的事件参数
     * @return {*} 调用私有方法后，私有方法的返回值
     */
    callEventOccurredPageMethod(slaveId, methodName, options = {}, ...args) {
        const occurredSlave = this.history.seek(slaveId);
        if (occurredSlave) {
            return occurredSlave.callPrivatePageMethod(methodName, options, ...args);
        }
        return null;
    }
    /**
     * 向所有slave，派发事件
     *
     * @param {string} methodName 事件名称
     * @param {Object|null} options 发事件的可配置项
     * @param {...*} args 透传的事件参数
     */
    dispatchAllSlaveEvent(methodName, options = {}, ...args) {
        this.history.each(slave => {
            slave.callPrivatePageMethod(methodName, options, ...args);
        });
    }
    /**
     * 框架使用的私有的事件的绑定
     */
    bindPrivateEvents() {
        this.slaveCommunicator.onMessage('abilityMessage', event => {
            try {
                this.callEventOccurredPageMethod(event.slaveId, event.value.type, {}, event.value.params);
            }
            catch (e) {
                console.error(e);
            }
        });
    }


    /**
     * 调用用户在page实例上挂载的方法
     *
     * @param {String} [slaveId] - 要调用的页面实例的slaveId
     * @param {String} [methodName] - 要调用的page实例上的方法名
     * @param {...*} [args] - 透传的事件参数
     * @return {*} 函数调用后的返回值
     */
    callPageMethod(slaveId, methodName, ...args) {
        const occurredSlave = this.history.seek(slaveId);
        if (occurredSlave) {
            const occurredSlavePageObject = occurredSlave.userPageInstance.pageObj;
            if (typeof occurredSlavePageObject[methodName] === 'function') {
                try {
                    return occurredSlavePageObject[methodName](...args);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        return null;
    }

    /**
     * 绑定开发者绑定的events
     */
    bindDeveloperEvents() {
        this.slaveCommunicator.onMessage('event', event => {
            const eventOccurredPageObject = this.history.seek(event.slaveId).getUserPageInstance().pageObj;
            if (event.customEventParams) {
                const nodeId = event.customEventParams.nodeId;
                const reflectComponent = eventOccurredPageObject.privateProperties.customComponents[nodeId];
                if (reflectComponent[event.value.reflectMethod]) {
                    reflectComponent[event.value.reflectMethod]
                        .call(reflectComponent, event.value.e);
                }
            }
            else if (eventOccurredPageObject[event.value.reflectMethod]) {
                eventOccurredPageObject[event.value.reflectMethod]
                    .call(eventOccurredPageObject, event.value.e);
            }
        });
    }

    /**
     * 客户端触发的协议事件，非前端派发
     * 用于接收协议事件
     *
     */
    bindEnviromentEvents() {
        this.masterManager.swaninterface
        .bind('sharebtn', event => {
            this.callEventOccurredPageMethod(event.wvID, 'share', {}, null, 'menu');
        })
        .bind('live', event => {
            this.callEventOccurredPageMethod(event.wvID, 'live', {}, event);
        })
        .bind('video', event => {
            this.callEventOccurredPageMethod(event.wvID, 'videoEventsDispatch', {}, event);
        })
        .bind('map', event => {
            this.callEventOccurredPageMethod(event.wvID, 'mapEventsDispatch', {}, event);
        })
        .bind('camera', event => {
            this.callEventOccurredPageMethod(event.wvID, 'cameraEventsDispatch', {}, event);
        })
        .bind('ARCamera', event => {
            this.callEventOccurredPageMethod(event.wvID, 'arCameraEventsDispatcher', {}, event);
        })
        .bind('webview', event => {
            this.callEventOccurredPageMethod(event.wvID, 'webviewNAEventsDispatch', {}, event);
        })
        .bind('accountChange', event => {
            this.dispatchAllSlaveEvent('accountChange');
        })
        .bind('backtohome', ({url, from}) => {
            if (from !== 'menu' && url ===  this.history.getTopSlaves()[0].accessUri) {
                return;
            }
            this.masterManager.navigator.reLaunch({url: `/${url}`});
        });
    }

    bindLifeCycleEvent(pageLifeCycleEventEmitter) {

        const pageEventsToLifeCycle = ['onHide', 'onTabItemTap'];

        // 确保onShow在onLoad之后
        pageLifeCycleEventEmitter.onMessage('PagelifeCycle', events => {
            if (Object.prototype.toString.call(events) !== '[object Array]') {
                events = [events];
            }
            events.forEach(event => {
                if (event.params.eventName === 'onLoad') {
                    pageLifeCycleEventEmitter.onMessage('onShow', ({event: e}) => {
                        if (+event.params.slaveId === +e.wvID) {
                            this.callPageMethod(e.wvID, '_onShow', {}, e);
                        }
                    }, {listenPreviousEvent: true});
                }
            });
        }, {listenPreviousEvent: true});

        // 普通事件的绑定
        pageEventsToLifeCycle.forEach(eventName => {
            pageLifeCycleEventEmitter.onMessage(eventName, ({event}) => {
                this.callPageMethod(event.wvID, `_${eventName}`, {}, event);
            }, {listenPreviousEvent: true});
        });

        // 对于客户端事件做一次中转，因为前端有特殊逻辑处理
        this.masterManager.swaninterface
        .bind('lifecycle', event => {
            pageLifeCycleEventEmitter.fireMessage({
                type: event.lcType,
                event
            });
        })
        .bind('onTabItemTap', e => {
            pageLifeCycleEventEmitter.fireMessage({
                type: 'onTabItemTap',
                event
            });
        });
    }
}
