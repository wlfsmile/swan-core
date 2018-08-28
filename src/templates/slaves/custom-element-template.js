/**
 * @file swan中自定义组件的模板，自定义组件被编译为js，使用改模板作为原型
 * @author houyu(houyu01@baidu.com)
 */

(function (global, componentFragments, globalCustomComponents) {

    const customComponents = {};
    // 所有的自定义组件
    "#swanCustomComponentsDefine#";

    global.componentFactory.componentDefine(
        '<%-customComponentPath%>',
        Object.assign({}, componentFactory.getProtos('super-custom-component'), {
            template: `<swan-<%-customComponentName%>><%-customComponentTemplate%></swan-<%-customComponentName%>>`,
            componentPath: '<%-customComponentPath%>',
            componentName: '<%-customComponentName%>',
            customComponentCss: `<%-customComponentCss%>`
        }),
        {
            classProperties: {
                components: {...componentFragments, ...customComponents}
            }
        }
    );

    globalCustomComponents['<%-customComponentName%>'] = global
        .componentFactory.getComponents('<%-customComponentPath%>');

})(global, componentFragments, customComponents);
