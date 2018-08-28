/**
 * @file 解析scheme中path和query的方法
 * @author xuechao(xuechao02@baidu.com)
 */

export const processParam = param => {
    const getScheme = param.appInfo.appLaunchScheme || '';
    const scheme = decodeURIComponent(getScheme);
    if (/:\/\/v[0-9]+/.test(scheme) || !getScheme) {
        return param;
    }
    const processSchemeRegx = /(_baiduboxapp|callback|upgrade).*?(&|$)/g;
    const replacedScheme = scheme.replace(processSchemeRegx, '');
    const schemeRegx = /\/\/swan\/[0-9a-z_A-Z]+\/(.*?)\?(.*)$/;
    const schemeArr = replacedScheme.match(schemeRegx);
    const path = schemeArr[1];
    const query = schemeArr[2];
    let queryObj = {};
    query.split('&').forEach(element => {
        if (!element) {
            return;
        }
        const queryItem = element.split('=');
        queryObj[queryItem[0]] = queryItem[1];
    });
    const pathQuery = {
        path: path,
        query: queryObj
    };
    param.appInfo = Object.assign(param.appInfo, pathQuery);
    return param;
};
