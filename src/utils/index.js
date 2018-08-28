/**
 * @file utils for swan
 * @author houyu(houyu01@baidu.com)
 */
import {Data} from './data';
import Loader from './loader';

// const basePath = window.basePath;
export const loader = new Loader();
export {Share} from './share';
export {executeWithTryCatch} from './code-proccess';
export {Data};
export * from './path';

export const getParams = query => {
    if (!query) {
        return { };
    }

    return (/^[?#]/.test(query) ? query.slice(1) : query)
        .split('&')
        .reduce((params, param) => {
            let [key, value] = param.split('=');
            try {
                params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
            }
            catch (e) {
                params[key] = value;
            }
            return params;
        }, { });
};

export const noop = () => {};

export const getValueSafety = (data, path) => {
    return (new Data(data)).get(path);
};

/**
 * 用于判断是否为值相同数组（若为对象数组，则对指定key执行比较）
 * @param {Array} a 目标数组
 * @param {Array} b 对比数组
 * @param {string} key 数组为对象数组时指定的比较key
 * @return {boolean} 比较结果，true表示为不同，false为相同
 */
export const isDiffArray = (a, b, key) => {
    if (a.length !== b.length) {
        return true;
    }
    let length = a.length;
    // 依次比值
    for (let i = 0; i < length; i++) {
        let result = true;
        if (typeof a[i] === 'object' && typeof b[i] === 'object') {
            result = a[i][key] === b[i][key];
        }
        else {
            result = typeof a[i] === typeof b[i] && a[i] === b[i];
        }
        if (!result) {
            return true;
        }
    }
    return false;
};

/**
 * 用于判断是否为值相同对象（若有value为对象，则对指定key进行比较）
 * @param {Array} x 目标对象
 * @param {Array} y 对比对象
 * @return {boolean} 比较结果，true表示相同，false为不同
 */
export const isEqualObject = (x = {}, y = {}) => {
    let inx = x instanceof Object;
    let iny = y instanceof Object;
    if (!inx || !iny) {
        return x === y;
    }
    if (Object.keys(x).length !== Object.keys(y).length) {
        return false;
    }
    for (let key in x) {
        let a = x[key] instanceof Object;
        let b = y[key] instanceof Object;
        if (a && b) {
            if (!isEqualObject(x[key], y[key])) {
                return false;
            }
        } else if (x[key] !== y[key]) {
            return false;
        }
    }
    return true;
};

/**
 * 深度assign的函数
 * @param {Object} targetObject 要被拷贝的目标对象
 * @param {Object} originObject 拷贝的源对象
 * @return {Object} merge后的对象
 */
export const deepAssign = (targetObject = {}, originObject) => {
    const originType = Object.prototype.toString.call(originObject);
    if (originType === '[object Array]'
        || (originType === '[object Object]' && originObject.constructor === Object)
    ) {
        for (const key in originObject) {
            targetObject[key] = deepAssign(targetObject[key], originObject[key]);
        }
        return targetObject;
    }
    else if (originType === '[object Date]') {
        return new Date(originObj.getTime());
    }
    else if (originType === '[object RegExp]') {
        const target = String(originObj);
        const lastIndex = target.lastIndexOf('/');
        return new RegExp(target.slice(1, lastIndex), target.slice(lastIndex + 1));
    }
    return originObject;
};

/**
 * 深度mixin函数
 * @param {...Array} targetObjects 需要merge的所有的对象
 * @return {Object} mixin之后的结果
 */
export const mixin = (...targetObjects) => targetObjects.reduce(deepAssign, {});

/**
 * 深度拷贝逻辑，不同于lodash等库，但是与微信一致
 * @param {*} [originObj] 原对象
 * @return {Object|Array} 拷贝结果
 */
export const deepClone = originObj => {
    return deepAssign(Object.prototype.toString.call(originObj) === '[object Array]' ? [] : {}, originObj);
};
