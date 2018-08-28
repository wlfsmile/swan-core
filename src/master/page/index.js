/**
 * @file 控制了master中所有的用户的page的创建/初始化/merge私有方法
 * @author houyu(houyu01@baidu.com)
 */
import swanEvents from '../../utils/swan-events';
import EventsEmitter from '@baidu/events-emitter';
import SlaveEventsRouter from './slave-events-router';
import {getPagePrototypeInstance} from './page-prototype';
import {Data, getParams, Share, deepClone} from '../../utils';

const pageLifeCycleEventEmitter = new EventsEmitter();

export const slaveEventInit = master => {
    const slaveEventsRouter = new SlaveEventsRouter(
            master,
            pageLifeCycleEventEmitter 
        );
    slaveEventsRouter.initbindingEvents();
    return {
        pageLifeCycleEventEmitter
    };
};

const init = (pageInstance, slaveId, accessUri, masterManager, globalSwan, appConfig) => {
    const swaninterface = masterManager.swaninterface;
    const appid = swaninterface.boxjs.data.get({name: 'swan-appInfoSync'}).appid;
    slaveId = '' + slaveId;
    return {
        pageCreation() {
            // 获取page的原型方法单例，防止对每个page都生成方法集合
            const pagePrototype = getPagePrototypeInstance(masterManager, globalSwan, pageLifeCycleEventEmitter);
            const [route, query] = accessUri.split('?');
            // merge page的原型方法
            Object.assign(pageInstance,
                {
                    privateProperties: {
                        slaveId,
                        accessUri,
                        raw: new Data(pageInstance.data),
                        share: new Share(swaninterface, appid, pageInstance, appConfig.pages[0])
                    },
                    route,
                    options: getParams(query)
                },
                pagePrototype
            );
            swanEvents('master_active_init_user_page_instance', pageInstance);
            // lifecycleMixin(pageInstance);
        },

        sendInitData(params) {
            swanEvents('master_active_send_initdata_start');

            masterManager.communicator.sendMessage(
                slaveId,
                {
                    type: 'initData',
                    value: pageInstance.data,
                    extraMessage: {
                        componentsData: pageInstance.privateMethod.getCustomComponentsData
                        .call(pageInstance, this.pageObj.usingComponents, masterManager.communicator)
                    },
                    path: 'initData',
                    slaveId,
                    appConfig
                }
            );
            swanEvents('master_active_send_initdata_end');
        },
        pageObj: pageInstance
    };
};
const isWriteProtected = pageKey => {
    const protectedKeys = [
        'uri', 'setData', 'getData', 'shiftData',
        'popData', 'unshiftData', 'spliceData',
        'privateMethod', 'privateProperties'
    ];
    return false;
};
const cloneSwanPageObject = (pagePrototype = {}) => {
    let newSwanObject = {};
    pagePrototype.data = pagePrototype.data || {};
    newSwanObject.data = JSON.parse(JSON.stringify(pagePrototype.data));
    Object.keys(pagePrototype).filter(pageKey => pageKey !== 'data')
    .forEach(pageKey => {
        if (!isWriteProtected(pageKey)) {
            newSwanObject[pageKey] = deepClone(pagePrototype[pageKey]);
        }
        else {
            console.error(`关键字保护：${pageKey} is write-protected`);
        }
    });
    return newSwanObject;
};
// 当页面打开时(即slave加载完毕，通知master时)master可以将页面对应的page对象进行实例化
export const createPageInstance = (accessUri, slaveId, appConfig) => {
    swanEvents('master_active_get_user_page_instance');
    // 过滤传过来的originUri,临时方案；后面和生成path做个统一的方法；
    const uriPath = accessUri.split('?')[0];
    const userPageInstance = init(
        cloneSwanPageObject(global.masterManager.pagesQueue[uriPath]),
        slaveId,
        accessUri,
        global.masterManager,
        global.swan,
        appConfig
    );
    userPageInstance.pageCreation();
    return userPageInstance;
};

// 获取用户当前位于栈顶的 page 对象
export const getCurrentPages = () => {
    return global.masterManager.navigator.history.getAllSlaves()
    .map(currentSlave => currentSlave.getCurrentChildren()
        .getUserPageInstance().pageObj
    );
};
// 暴露给用户的 Page 方法
export const Page = pageObj => {
    const uri = global.__swanRoute;
    const usingComponents = global.usingComponents || [];
    const pageProto = {data: {}};
    return global.masterManager.pagesQueue[uri] = {...pageProto, ...pageObj, uri, usingComponents};
};
