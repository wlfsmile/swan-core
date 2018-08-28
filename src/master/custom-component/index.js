/**
 * @file 用户的自定义组件(在master中的句柄)的创建工厂
 * @author houyu(houyu01@baidu.com)
 */
import swanEvents from '../../utils/swan-events';
import Communicator from '../../utils/communication';
import {deepClone, deepAssign, mixin, Data} from '../../utils';

export default class VirtualComponentFactory {

    constructor() {
        this.virtualClassInfos = {};
        this.behaviorsMap = {};
        swanEvents('master_preload_construct_virtual_component_factory');
    }

    /**
     * 创建虚拟组件实例的方法
     * @param {Object} ClassEntity - 组件的类
     * @param {Object} instanceProperties - 组件的所有实例化时需要装载的属性
     * @return {Object} 创建出来的自定义组件实例
     */
    createInstance(ClassEntity, instanceProperties) {
        const behaviors = ClassEntity.behaviors || [];
        const initialInstance = {
            ...instanceProperties,
            ...this.getBuiltInMethods()
        };
        // 将merge好的数据绑定到实例上
        this.bindDataToInstance(ClassEntity.properties, ClassEntity.data, instanceProperties.data, initialInstance);
        // 一些特殊处理的属性，不应直接merge
        const specielProps = ['data', 'properties'];
        // 创建一个自定义组件的句柄实例
        const instance = Object.keys(ClassEntity)
            .filter(propName => !~specielProps.indexOf(propName))
            .reduce((instance, propName) => {
                instance[propName] = deepClone(ClassEntity[propName]);
                return instance;
            }, initialInstance);
        const decoratedInstance = this.mergeBehaviors(instance, instance.behaviors);
        this.bindMethodsToInstance(decoratedInstance.methods, decoratedInstance);
        return decoratedInstance;
    }

    bindMethodsToInstance(methods, initialInstance) {
        return Object.assign(initialInstance, methods);
    }

    /**
     * 绑定产生的新数据到组件实例上
     * @param {Object} [properties] - 组件原型上的properties
     * @param {Object} [initData] - 组件原型上的data
     * @param {Object} [instanceData] - 组件实例中，外部传入的props
     * @param {Object} [initialInstance] - 组件实例
     * @return {Object} - 绑定后的实例
     */
    bindDataToInstance(properties, initData, instanceData, initialInstance) {
        const instanceProperties = deepClone(properties);
        // 将原型的properties与传入的props融合一下
        if (instanceData) {
            for (const prop in instanceData) {
                if (!instanceProperties[prop]) {
                    instanceProperties[prop] = {};
                }
                instanceProperties[prop].value = instanceData[prop];
            }
        }
        // 将properties与data进行融合
        const initDataObj = this.dataConverter(instanceProperties, initData, initialInstance);
        initialInstance['_data'] = new Data(initDataObj);
        Object.defineProperty(initialInstance, 'data', {
            get() {
                return this._data.raw;
            },
            set(value) {
                this._data.raw = value;
            }
        });
        Object.defineProperty(initialInstance, 'properties', {
            get() {
                return this._data.raw;
            },
            set(value) {
                this._data.raw = value;
            }
        });
        return initialInstance;
    }

    /**
     * 将用户设置的数据进行转换，包括将props与data进行merge，将props转换为我方代理
     *
     * @param {Object} props - 用户设置的组件初始化props
     * @param {Object} data - 用户设置的组件初始化私有数据
     * @param {Object?} context - 当数据发生变化时回调的上下文
     * @return {Object} - merge后的data对象
     */
    dataConverter(props = {}, data = {}, context) {
        const instanceData = JSON.parse(JSON.stringify(data));
        for (const name in props) {
            Object.defineProperty(instanceData, name, {
                get() {
                    return this['_' + name] || props[name].value;
                },
                set(value) {
                    this['_' + name] = value;
                    const observer = props[name].observer;
                    if (typeof observer === 'function') {
                        observer.call(context, value);
                    }
                    if (typeof observer === 'string'
                        && typeof context[observer] === 'function'
                    ) {
                        context[observer].call(context, value);
                    }
                },
                enumerable: true
            });
        }
        return instanceData;
    }

    /**
     * 将behaviors融合到target对象上
     *
     * @param {Object} target 目标对象
     * @param {Array} behaviors 需要merge的behaviors的集合
     * @return {Object} 融合了behaviors过后的目标对象
     */
    mergeBehaviors(target, behaviors = []) {
        const lifeCycleMethod = (oldCreated, newCreated) => function () {
                newCreated.call(this);
                oldCreated.call(this);
            };
        const attributesMergeMethods = {
            properties: (oldProperties, newProperties) => ({...oldProperties, ...newProperties}),
            data: (oldData, newData) => deepAssign(oldData, newData),
            methods: (oldMethods, newMethods) => ({...oldMethods, ...newMethods}),
            behaviors: (oldBehaviors, newBehaviors) => newBehaviors,
            created: lifeCycleMethod,
            attached: lifeCycleMethod,
            ready: lifeCycleMethod,
            detached: lifeCycleMethod,
            defaultAttribute: (oldAttribute, newAttribute) => newAttribute
        };

        behaviors.forEach(behavior => {
            for (const attribute in behavior) {
                const proccessMethod = attributesMergeMethods[attribute] || attributesMergeMethods['defaultAttribute'];
                target[attribute] = proccessMethod(target[attribute] || {}, behavior[attribute] || {});
            }
        });
        return target;
    }

    /**
     * 获取用户组件实例需要的所有方法
     * @param {Object} instanceProperties - 组件的所有实例化时需要装载的属性
     * @return {Object} 组件上所有需要挂载的方法
     */
    getBuiltInMethods() {
        return {
            setData(path, value, cb) {
                this.pageinstance
                .sendDataOperation({
                    cb,
                    path,
                    value,
                    type: 'setCustomComponent',
                    options: {
                        nodeId: this.nodeId
                    }
                });
                const setObject = typeof path === 'object' ? path : {[path]: value};
                for (const path in setObject) {
                    this._data.set(path, setObject[path]);
                }
            },
            triggerEvent(eventName, eventDetail = {}) {
                this.pageinstance
                .sendMessageToCurSlave({
                    type: 'triggerEvents',
                    nodeId: this.nodeId,
                    eventName,
                    eventDetail
                });
            },
            dispatch(name, value) {
                const parentComponent = this.pageinstance.privateProperties.customComponents[this.ownerId];
                if (parentComponent.messages) {
                    const receiver = parentComponent.messages[name] || parentComponent.messages['*'];
                    if (typeof receiver === 'function') {
                        receiver.call(
                            parentComponent,
                            {target: this, value: value, name: name}
                        );
                        return;
                    }
                }
                parentComponent && parentComponent.dispatch(name, value);
            },
            selectAllComponents(selector) {
                return this.pageinstance.privateMethod.getComponentsFromList(
                    this.pageinstance.privateProperties.customComponents,
                    selector
                );
            },
            selectComponent(selector) {
                return this.selectAllComponents(selector)[0];
            },
            createSelectorQuery() {
                return window.swan.createSelectorQuery().in(this);
            },
            _propsChange({key, value}) {
                this._data.set(key, value);
            },
            hasBehavior() {}
        };
    }

    /**
     * 定义master中控制component的虚拟component对象，对外是Component函数
     *
     * @param {Object} componentProto - 组件的原型
     * @param {string} componentPath - 组件的路径(当作组件的唯一标识)
     * @return {class} 注册好的类
     */
    defineVirtualComponent(componentProto, componentPath = global.__swanRoute) {
        this.virtualClassInfos[componentPath] = {
            componentProto
        };
    }

    /**
     * 将behaviors mixin到组件的原型中
     * @param {Object} componentProto 需要被装饰的组件原型
     * @param {Object} behaviors 需要装饰的behaviors的集合
     */
    mixinBehaviors(componentProto, behaviors) {
        const behaviorsType = Object.prototype.toString.call(behaviors);
        const lifeCycleMethods = ['attached', 'created', 'ready', 'detached'];
        if (behaviorsType === '[object Array]') {
            behaviors.forEach(behavior => {
                this.mixinBehaviors(componentProto, behavior);
            });
        }
        else if (behaviorsType === '[object Object]') {
            for (const key in behaviors) {
                if (lifeCycleMethods.find(key)) {
                    componentProto[key] = (...args) => {
                        componentProto[key].call(componentProto, ...args);
                        behaviors[key].call(componentProto, ...args);
                    };
                }
                else {
                    componentProto[key] = mixin(componentProto[key], behaviors[key]);
                }
            }
        }
    }

    defineBehavior(behaviorProto) {
        if (Object.prototype.toString.call(behaviorProto.behaviors) === '[object Array]') {
            return mixin({}, behaviorProto, ...behaviorProto.behaviors);
        }
        return behaviorProto;
    }

    /**
     * 获取一个component的实例
     *
     * @param {string} componentPath - 创建component的路径
     * @param {Object} componentProperties - 创建component鞋带的property
     * @return {Object} 获取一个组件的实例
     */
    getComponentInstance(componentPath, componentProperties = {}) {
        return this.createInstance(this.virtualClassInfos[componentPath].componentProto, componentProperties);
    }

    /**
     * 获取所有可序列化的数据值
     *
     * @param {Object} data - 数据对象树
     * @return {Object} 真正数据值的对象树
     */
    getDataValues(data) {
        return Object.keys(data).reduce((dataValues, key) => {
            dataValues[key] = data[key];
            return dataValues;
        }, {});
    }

    /**
     * 获取某一类组件的可序列化数据，传到slave中初始化组件用
     *
     * @param {Array} componentPath - 所有当前页面用到的自定义组件的路径集合
     * @return {Object} 所有当前页面用到的自定义组件的初始化数据
     */
    getComponentData(componentPath) {
        const componentClass = this.getComponentInstance(componentPath);
        if (!componentClass) {
            console.error(`can't find ${componentPath}, please check your config`);
            return {};
        }
        return this.getDataValues(componentClass.data);
    }

    /**
     * 获取所有master中所有承接slave的自定义组件的方法
     * 当master收到slave来的消息后，会调用相应方法，注册或更改自己的virtual-component
     *
     * @return {Object} 所有承接slave自定义组件方法的集合
     */
    getCustomComponentMethods() {
        const virtualComponentFactory = this;
        const callMethodSafty = (obj, methodName, ...args) => {
            try {
                obj[methodName] && obj[methodName](...args);
            }
            catch (e) {
                console.error(e);
            }
        };

        return {

            /**
             * 获取某一组自定义组件的初始数据
             *
             * @param {Array} componentPathSet - 需要获取数据的一组自定义组件
             * @return {Object} 该类组件的数据
             */
            getCustomComponentsData(componentPathSet = [], communicator) {
                // this.privateMethod.listenCustomComponentEvents.call(this, communicator);
                return componentPathSet.reduce((componentsData, componentPath) => {
                    componentsData[componentPath] = virtualComponentFactory.getComponentData(componentPath);
                    return componentsData;
                }, {});
            },

            /**
             * 注册一组自定义组件
             *
             * @param {Array} componentsInfo - 一组组件的原型
             */
            registerCustomComponents(componentsInfo = []) {
                componentsInfo
                .forEach(componentInfo => this.privateMethod.registerCustomComponent.call(this, componentInfo));
            },

            customComponentEvent(params) {
                switch (params.type) {
                    case 'customComponent:detached':
                        callMethodSafty(this.privateProperties.customComponents[params.nodeId], 'detached');
                        break;
                    case 'customComponent:_propsChange':
                        callMethodSafty(
                            this.privateProperties.customComponents[params.nodeId],
                            '_propsChange',
                            params.raw
                        );
                        break;
                }
            },

            /**
             * 注册一个自定义组件
             *
             * @param {Array} componentInfo - 组件的注册信息
             * @param {string} componentInfo.nodeId - 组件的唯一标识
             * @param {string} componentInfo.ownerId - 组件实例的父组件标识
             * @param {string} componentInfo.parentId - 组件实例的视图父元素
             * @param {Object} componentInfo.data - 组件的初始化数据(merge过用户传递的props之后)
             * @param {string} componentInfo.componentPath - 需要初始化的组件的路径
             * @param {string} componentInfo.className - 自定义组件的类
             */
            registerCustomComponent({nodeId, ownerId, parentId, data, componentPath, className}) {
                try {
                    this.privateProperties.customComponents = this.privateProperties.customComponents || {};
                    this.privateProperties.customComponents[nodeId] = virtualComponentFactory
                    .getComponentInstance(componentPath, {
                        data,
                        className,
                        nodeId,
                        ownerId,
                        parentId,
                        pageinstance: this
                    });
                    callMethodSafty(this.privateProperties.customComponents[nodeId], 'created');
                    callMethodSafty(this.privateProperties.customComponents[nodeId], 'attached');
                    callMethodSafty(this.privateProperties.customComponents[nodeId], 'ready');
                }
                catch (e) {
                    console.error(e);
                }
            }
        };
    }
}
