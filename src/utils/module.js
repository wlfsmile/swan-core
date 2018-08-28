/**
 * @file module loader(define & require)
 * @author houyu(houyu01@baidu.com)
 */
import {pathResolver} from './path';
const MODULE_PRE_DEFINED = 1;
const MODULE_DEFINED = 2;
const global = window;

let modModules = {};
const parseId = baseId => {
    const idStructure = baseId.match(/(.*)\/([^\/]+)?$/);
    return (idStructure && idStructure[1]) || './';
};

const createLocalRequire = (baseId, require) => id => {
    const normalizedId = parseId(baseId);
    const paths = pathResolver(normalizedId, id, () => {
        throw new Error(`can't find module : ${id}`);
    });
    const absId = paths.join('/').replace(/\.js$/g, '');
    return require(absId);
};

export const require = id => {
    if (typeof id !== 'string') {
        throw new Error('require args must be a string');
    }
    let mod = modModules[id];
    if (!mod) {
        throw new Error('module "' + id + '" is not defined');
    }
    if (mod.status === MODULE_PRE_DEFINED) {
        const factory = mod.factory;
        let localModule = {
            exports: {}
        };
        let factoryReturn = undefined;
        if (factory) {
            factoryReturn = factory(
                createLocalRequire(id, require),
                localModule,
                localModule.exports,
                define,
                global.swan,
                global.getApp
            );
        }
        mod.exports = localModule.exports || factoryReturn;
        mod.status = MODULE_DEFINED;
    }
    return mod.exports;
};

export const define = (id, factory) => {
    modModules[id] = {
        status: MODULE_PRE_DEFINED,
        factory
    };
};
