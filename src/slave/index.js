/**
 * @file slave's runtime js, it will be included in all slave pages
 * @author houyu(houyu01@baidu.com)
 */
import san from 'san';
import {loader} from '../utils';
import swanEvents from '../utils/swan-events';
import {getComponentFactory} from './component-factory';
import {setPageBasePath, isIOS} from '../utils/platform';

export default class Slave {
    constructor(global, swaninterface, swanComponents) {
        swanEvents('slave_preload_start');
        global.san = san;
        this.swaninterface = swaninterface;
        this.swanComponents = swanComponents;
        this.listenPageReady(global);
        this.registerComponents();
        swanEvents('slave_preload_end');
    }
    listenPageReady(global) {
        swanEvents('slave_preload_listened');
        this.swaninterface.bind('PageReady', event => {
            swanEvents('slave_active_start',{
                pageInitRenderStart: Date.now() + ''
            });
            const appPath = event.appPath;
            const pagePath = event.pagePath.split('?')[0];
            const onReachBottomDistance = event.onReachBottomDistance;
            // 给框架同学用的彩蛋
            const corePath = global.location.href
                            .replace(/[^\/]*\/[^\/]*.html$/g, '')
                            .replace(/^file:\/\//, '');
            global.debugDev = `deployPath=${appPath}\ncorePath=${corePath}`;
            
            // 给框架同学使用的刷新彩蛋
            sessionStorage.setItem('debugInfo', `${appPath}|debug|${pagePath}`);

            // 供组件中拼接绝对路径使用的全局信息
            global.pageInfo = {
                appPath,
                pagePath,
                onReachBottomDistance
            };
            let loadHook = () => {
                return loader.loadjs('../swan-devhook/slave.js').then(() => {
                    /* eslint-disable */
                    __san_devtool__.emit('san', san);
                    /* eslint-enable */
                });
            };

            let loadUserRes = () => {
                // 设置页面的基础路径为当前页面本应所在的路径
                // 行内样式等使用相对路径变成此值
                setPageBasePath(`${appPath}/${pagePath}`);
                swanEvents('slave_active_page_load_start');
                // 加载用户的资源
                Promise.all([
                    loader.loadcss(`${appPath}/app.css`, 'slave_active_app_css_loaded'),
                    loader.loadcss(`${appPath}/${pagePath}.css`, 'slave_active_page_css_loaded')
                ])
                .catch(() => {
                    console.warn('加载css资源出现问题，请检查css文件');
                })
                .then(() => {
                    // todo: 兼容天幕，第一个等天幕同步后，干掉
                    swanEvents('slave_active_css_loaded');
                    swanEvents('slave_active_swan_js_start');
                    loader.loadjs(`${appPath}/${pagePath}.swan.js`, 'slave_active_swan_js_loaded');
                });
            };
            (event.devhook === 'true' ? loadHook().then(loadUserRes).catch(loadUserRes) : loadUserRes());
        });
    }
    registerComponents() {

        const swaninterface = this.swaninterface;
        const {versionCompare, boxVersion} = this.swaninterface.boxjs.platform;
        const componentProtos = this.swanComponents.getComponents({
            isIOS: isIOS(),
            versionCompare,
            boxVersion
        });
        swanEvents('slave_preload_get_components');

        const componentDefaultProps = {swaninterface};

        const componentFactory = getComponentFactory(componentDefaultProps, componentProtos, this.swanComponents.getBehaviorDecorators());

        global.componentFactory = componentFactory;

        global.swaninterface = swaninterface; // 远程调试使用

        global.san = san;

        global.pageRender = (pageTemplate, templateComponents, customComponents, filters, modules) => {
            let filtersObj = {};
            filters && filters.forEach(element => {
                let func = element.func;
                let module = element.module;
                filtersObj[element.filterName] = (...args) => {
                    return modules[module][func](...args);
                };
            });

            global.isNewTemplate = true;
            swanEvents('slave_active_page_render', pageTemplate);
            // 定义当前页面的组件
            componentFactory.componentDefine(
                'page',
                {
                    template: `<swan-page tabindex="-1">${pageTemplate}</swan-page>`,
                    superComponent: 'super-page'
                },
                {
                    classProperties: {
                        components: {...componentFactory.getComponents(), ...templateComponents, ...customComponents},
                        filters: {
                            ...filtersObj
                        }
                    }
                }
            );
            swanEvents('slave_active_define_component_page');
            // 获取page的组件类
            const Page = global.componentFactory.getComponents('page');

            // 初始化页面对象
            const page = new Page();
            swanEvents('slave_active_construct_user_page');

            // 调用页面对象的加载完成通知
            page.slaveLoaded();
            swanEvents('slave_active_user_page_slaveloaded');

            // 监听等待initData，进行渲染
            page.communicator.onMessage('initData', params => {
                swanEvents('slave_active_receive_init_data');
                try {
                    // 根据master传递的data，设定初始数据，并进行渲染
                    page.setInitData(params);
                    swanEvents('slave_active_render_start');

                    // 真正的页面渲染，发生在initData之后
                    page.attach(document.body);
                    swanEvents('slave_active_page_attached');
                }
                catch (e) {
                    console.log(e)
                    global.errorMsg['renderError'] = e;
                }
            }, {listenPreviousEvent: true});

            swanEvents('slave_active_js_parsed');
            if (global.PageComponent) {
                Object.assign(global.PageComponent.components, customComponents);
            }
        };

        let debugInfo = '';
        try {
            debugInfo = sessionStorage.getItem('debugInfo');
        }
        catch (e) {}
        if (debugInfo) {
            const event = new Event('PageReady');
            event.appPath = debugInfo.split('|debug|')[0];
            event.onReachBottomDistance = '50';
            event.pagePath = debugInfo.split('|debug|')[1];
            document.dispatchEvent(event);
        }
        const compatiblePatch = () => {
            global.PageComponent = global.componentFactory.getComponents('super-page');
            global.PageComponent.components = global.componentFactory.getComponents();
            global.PageComponent.stabilityLog = global.PageComponent.stabilityLog || new Function();
        };
        compatiblePatch();
    }
}
