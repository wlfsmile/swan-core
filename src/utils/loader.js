/**
 * @file load js or some other sources
 * @author houyu(houyu01@baidu.com)
 */
import swanEvents from './swan-events';

const doc = document;
export default class Loader {
    constructor(basePath = '') {
        this.basePath = basePath;
        this.loadedResource = {
            js: {},
            css: {}
        };
    }
    loadjs(src, action) {
        const loadPath = this.basePath + src;
        if (this.loadedResource.js[loadPath]) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            let ua = navigator.userAgent;
            let reg = /baiduboxapp\/(\d{1,}\.\d{1,})/g;
            let semver = reg.exec(ua);
            let addCors = false;
            if (Array.isArray(semver) && parseFloat(semver[1]) >= 10.12 && ua.indexOf('Android') >= 0) {
                if (window['Bdbox_aiapps_jsbridge'].allowCrossOrigin() === '1') {
                    addCors = true;
                }
            }
            const script = doc.createElement('script');
            script.type = 'text/javascript';
            if (addCors) {
                script.crossOrigin = 'anonymous';
            }
            script.src = loadPath;
            script.onload = () => {
                this.loadedResource.js[loadPath] = true;
                action && swanEvents(action);
                resolve();
            };
            script.onerror = reject;
            doc.head.appendChild(script);
        });
    }
    loadcss(src, action) {
        const loadPath = this.basePath + src;
        if (this.loadedResource.js[loadPath]) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = loadPath;
            link.onload = () => {
                this.loadedResource.css[loadPath] = true;
                action && swanEvents(action);
                resolve();
            };
            link.onerror = reject;
            doc.head.appendChild(link);
        });
    }
    // TODO other files type
}
