/**
 * @file page类的原型对象
 * @author houyu(houyu01@baidu.com)
 */
import {
    initLifeCycle
} from './life-cycle';

const noop = () => {};
/**
 * 创建一个用户的page对象的原型单例
 * @param {Object} [masterManager] masterManager底层接口方法
 * @return {Object} page存放着所有page对象的原型方法的对象
 */
export const createPagePrototype = (masterManager, globalSwan) => {
    return {
        getData(path) {
            return this.privateProperties.raw.get(path);
        },
        /**
         * 通用的，向slave传递的数据操作统一方法
         *
         * @param {Object} dataParams - 数据操作的参数
         * @param {string} dataParams.type - 数据操作的类型
         * @param {string} dataParams.path - 数据操作的路径值
         * @param {Object} dataParams.value - 数据操作的数据值
         * @param {Function} dataParams.cb - 数据操作后的回调
         * @param {Object} dataParams.options - 数据操作的额外选项
         */
        sendDataOperation({
            type,
            path,
            value,
            cb = noop,
            options
        }) {
            const {
                raw,
                slaveId
            } = this.privateProperties;
            const setObject = typeof path === 'object' ? path : {
                [path]: value
            };
            const callback = typeof value === 'function' ? value : cb;
            const pageUpdateStart = Date.now() + '';

            // 先set到本地，然后通知slave更新视图
            this.sendMessageToCurSlave({
                type: `${type}Data`,
                slaveId,
                setObject,
                pageUpdateStart,
                options
            });
            // 更新data
            for (const path in setObject) {
                raw[type] && raw[type](path, setObject[path]);
            }
            this.nextTick(callback);
        },
        sendMessageToCurSlave(message) {
            masterManager.communicator.sendMessage(this.privateProperties.slaveId, message);
        },

        /**
         * 页面中挂载的setData操作方法，操作后，会传到slave，对视图进行更改
         *
         * @param {string|Object} [path] - setData的数据操作路径，或setData的对象{path: value}
         * @param {*} [value] - setData的操作值
         * @param {Function} [cb] - setData的回调函数
         */
        setData(path, value, cb) {
            this.sendDataOperation({
                type: 'set',
                path,
                value,
                cb
            });
        },
        // splice方法系列
        pushData(path, value, cb) {
            this.sendDataOperation({
                type: 'push',
                path,
                value,
                cb
            });
        },
        popData(path, cb) {
            this.sendDataOperation({
                type: 'pop',
                path,
                value: null,
                cb
            });
        },
        unshiftData(path, value, cb) {
            this.sendDataOperation({
                type: 'unshift',
                path,
                value,
                cb
            });
        },
        shiftData(path, cb) {
            this.sendDataOperation({
                type: 'shift',
                path,
                value: null,
                cb
            });
        },
        removeAtData(path, index, cb) {
            this.sendDataOperation({
                type: 'remove',
                path,
                value: index,
                cb
            });
        },
        spliceData(path, args, cb) {
            this.sendDataOperation({
                type: 'splice',
                path,
                value: args,
                cb
            });
        },
        createCanvasContext(...args) {
            return globalSwan.createCanvasContext.call(this, ...args);
        },
        videoSyncCurrentTime(videoId, currentTime) {
            const {
                raw,
                slaveId
            } = this.privateProperties;
            masterManager.communicator.sendMessage(slaveId, {
                type: 'videoSyncCurrentTime',
                videoId,
                currentTime,
                slaveId
            });
        },

        nextTick(fn) {
            masterManager.communicator
                .onMessage(`nextTick:${this.privateProperties.slaveId}`, () => fn(), {
                    once: true
                });
        },

        selectAllComponents(selector) {
            return this.privateMethod
                .getComponentsFromList(this.privateProperties.customComponents, selector, '*');
        },

        selectComponent(selector) {
            return this.selectAllComponents(selector)[0];
        },

        // page实例中的私有方法合集
        privateMethod: {
            navigate(params) {
                switch (params.openType) {
                    case 'navigate':
                        globalSwan.navigateTo({
                            url: params.uri
                        });
                        break;
                    case 'redirect':
                        globalSwan.redirectTo({
                            url: params.uri
                        });
                        break;
                    case 'switchTab':
                        globalSwan.switchTab({
                            url: params.uri
                        });
                        break;
                    case 'reLaunch':
                        globalSwan.reLaunch({
                            url: params.uri
                        });
                        break;
                    case 'navigateBack':
                        globalSwan.navigateBack({
                            delta: +params.delta
                        });
                        break;
                }
            },
            rendered(params) {
                this._onReady({});
            },
            onPageRender(params) {
                this.privateMethod.registerCustomComponents.call(this, params.customComponents);
            },
            reachBottom(params) {
                this._reachBottom(params);
            },
            onPageScroll(params) {
                this._onPageScroll(params.event);
            },
            share(params, from) {
                this._share({
                    from: from || 'button',
                    target: params
                });
            },
            pullDownRefresh(params) {
                this._pullDownRefresh(params);
            },
            accountChange() {
                masterManager.communicator
                    .sendMessage(this.privateProperties.slaveId, {
                        type: 'openDataAccountChange'
                    });
            },
            /**
             * slave中的nextTick到达后，会进行通知
             */
            nextTickReach() {
                masterManager.communicator.fireMessage({
                    type: `nextTick:${this.privateProperties.slaveId}`
                });
            },

            /**
             * 向slave中发送message
             *
             * @param {Object} [message] - 发送的消息本体
             */
            dispatchToSlave(message) {
                masterManager.communicator.sendMessage(this.privateProperties.slaveId, message);
            },

            /**
             * 查询给定组件集合中的所有组件
             *
             * @param {Array} [componentList] - 要查询的基础自定义组件的列表
             * @param {string} [selector] - 查询自定义组件使用的选择器
             * @param {string} [nodeId] - 查询自定义组件的限定nodeId -- 即在某一个id为nodeId的组件下，查询自定义组件
             * @return {Array} 查询出来的自定义组件实例集合
             */
            getComponentsFromList(componentList, selector, nodeId) {
                // 将选择器表达式，切割成为数组
                const selectorArr = selector.split(' ');
                // 从右向左，先取出所有符合最后条件的集合
                const topSelector = selectorArr.pop();
                const judgeComponentMatch = (component, selector, ownerId) => {
                    return (component.nodeId === selector.replace(/^#/, '') || component.className.split(' ')
                        .find(className => {
                            return className.replace(/\w+__/g, '') === selector.replace(/^\./, '');
                        })) && (component.ownerId === ownerId || ownerId === '*');
                };
                // 依据某一个条件(className或nodeId)，选择出符合条件的组件实例列表
                const findInComponentList = (componentList, selector) => Object.values(componentList)
                    .filter(component => judgeComponentMatch(component, selector, nodeId));
                // 选择出的符合最后条件的集合
                const selectedComponents = findInComponentList(componentList, topSelector);
                // 针对某一个组件，从下向上遍历选择器，确定该组件是否符合条件
                const findReverse = (selectorArr, selectedComponent, index) => {
                    if (index < 0) {
                        return true;
                    }
                    if (!selectedComponent.parentId) {
                        return false;
                    }
                    const selector = selectorArr[index];
                    const matchSelector = judgeComponentMatch(selectedComponent, selector, nodeId);
                    return findReverse(
                        selectorArr,
                        componentList[selectedComponent.parentId],
                        matchSelector ? index - 1 : index
                    );
                };
                // 在所有符合最后条件的组件，过滤掉所有祖先元素不能满足剩下表达式的component，满足的则为目标对象
                return selectedComponents.filter(selectedComponent => {
                    return findReverse(selectorArr, selectedComponent, selectorArr.length - 1);
                });
            },

            ...masterManager.virtualComponentFactory.getCustomComponentMethods(),
            ...masterManager.swanComponents.getComponentRecievers(masterManager.communicator)
        }
    };
};

let pagePrototype = null;
// 获取page的prototype的单例方法，节省初始化
export const getPagePrototypeInstance = (masterManager, globalSwan, pageLifeCycleEventEmitter) => {
    if (!pagePrototype) {
        pagePrototype = createPagePrototype(masterManager, globalSwan);
        initLifeCycle(masterManager, pagePrototype, pageLifeCycleEventEmitter);
    }
    return pagePrototype;
};
