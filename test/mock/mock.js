const noop = function () {};
window.swanInterface = {
	handlerQueue:[],
	loadJsQueue:{},
	boxjs:{
		data:{
			get:function(){
				return {
					appid:123
				}
			}
		},
		log:noop,
        platform: {
            versionCompare: noop,
            boxVersion: noop
        }
	},
	swan:{
        request: noop
    },
	communicator:{
		fireMessage:noop
	},
	bind:function(type, cb) {
        document.addEventListener(type, cb, false);
        return this;
    },
    unbind:function(type, cb) {
        document.removeEventListener(type, cb, false);
        return this;
    },
    loadJs: function (params) {
        this.bind('slaveLoaded', function (e) {
            if (+e.slaveId === +params.eventObj.wvID) {
                params.success(e);
            }
        });
    },
	invoke: function (type, ...args) {
        return this[type] && this[type](...args);
    },
    navigateTo: function (params) {
        return new Promise(function (resolve, reject) {
            const wvID = window.testutils.clientActions
                        .createSlave(params.slaveActionMap, params.template, params.slaveHookJs);
            resolve({wvID});
            params.success && params.success({wvID});
        });
    },
	adaptMaster:noop,
	bindSlaveLoadedEvents:noop,
    getAppConfig:noop,
	init:noop,
    postMessage: function (slaveId, message) {
        if (slaveId === 'master') {
            window.testutils.clientActions.sendMasterMessage(message);
        }
        else {
            // document.getElementById(slaveId).contentWindow.postMessage(JSON.stringify(message), '*');
            return '123';
        }
    },
    onMessage: function (callback) {
        this.bind('message', e => {
            if (e.message) {
                let message = null;
                try {
                    if (typeof e.message === 'object') {
                        message = e.message;
                    }
                    else {
                        message = JSON.parse(unescape(decodeURIComponent(e.message)));
                    }
                } catch (event) {
                    console.log(event);
                }
                callback && callback(message);
            }
        });
        return this;
    }
};
window.swanComponents = {
	getContextOperators:noop,
	getComponentRecievers:noop,
    // methods run on slave
    getComponents: function () {
        return {
            'super-page': {
                dependencies: ['swaninterface', 'communicator'],
                slaveLoaded: function () {
                    window.testutils.clientActions.sendMasterMessage({
                        type: 'slaveLoaded',
                        value: {
                            status: 'loaded'
                        },
                        slaveId: window.slaveId
                    });
                },
                slaveJsLog: noop,
                setInitData: function (params) {
                    for (var k in params.value) {
                        this.data.set(k, params.value[k]);
                    }
                }
            },
            'swan-component': {
                dependencies: ['swaninterface', 'communicator']
            }
        };
    },
    getBehaviorDecorators: function () {
        return function (behaviors, target) {
            return target;
        };
    }
};

window.rainMonitor = {
	log: noop
}
window.testutils = {
    clientActions: {
        dispatchEvent: function (type, params) {
            var event = new Event(type);
            for (var i in params) {
                event[i] = params[i];
            }
            document.dispatchEvent(event);
        },
        dispatchMessage: function (message) {
            var event = new Event('message');
            event.message = message;
            document.dispatchEvent(event);
        },
        appReady: function (slaveId, pageUrl) {
            this.dispatchEvent('AppReady', {
                // pageUrl: 'pages/component/component',
                pageUrl: pageUrl,
                wvID: slaveId,
                // wvID: '1',
                appP: '',
                appConfig: '{"pages":["' + pageUrl + '","pages/api/api"], "tabBar": {"list": [{"iconPath":"images/component_normal.png","selectedIconPath":"images/component_selected.png","pagePath":"pages/component/component","text":"组件"},{"iconPath":"images/API_normal.png","selectedIconPath":"images/API_selected.png","pagePath":"pages/api/api","text":"接口"}]}}'
            });
            this.appShow();
        },

        appShow: function () {
            this.dispatchEvent('lifecycle', {
                lcType: 'onAppShow'
            });
        },
        appHide: function () {
            this.dispatchEvent('lifecycle', {
                lcType: 'onAppHide'
            });
        },
        show: function (wvID = 1) {
            this.dispatchEvent('lifecycle', {
                lcType: 'onShow',
                wvID
            });
        },
        hide: function (wvID = '1') {
            this.dispatchEvent('lifecycle', {
                lcType: 'onHide',
                wvID
            });
        },
        wvID: 2,
        createSlave: function (slaveActionMap, template, slaveHookJs) {
            const wvID = this.wvID++;
            for (let actionKey in slaveActionMap) {
                this.bind(actionKey, function (e) {
                    if (+e.slaveId === +wvID) {
                        slaveActionMap[actionKey](e);
                    }
                });
            }
            const slaveFrame = document.createElement('iframe');
            document.body.appendChild(slaveFrame);
            const slaveContent = `
                <base href="${location.href}" />
                <script src="./base/test/mock/mock.js"></script>
                <script src="./base/test/mock/slave.mock.js"></script>
                <script src="./base/test/mock/master.mock.js"></script>
                <script>window.slaveId = ${wvID}</script>
                <script>${slaveHookJs}</script>
                <script>
                    slaveInit(${template});
                </script>
            `;
            slaveFrame.setAttribute('src', 'about:blank');
            slaveFrame.setAttribute('id', wvID);
            slaveFrame.srcdoc = slaveContent;
            return wvID;
        },
        sendMasterMessage: function (message) {
            message.slaveId = window.slaveId;
            window.parent.postMessage(JSON.stringify(message), '*');
        },
        bind: function (type, cb) {
            window.addEventListener('message', function (e) {
                var messageObj = e.data;
                if (typeof messageObj === 'string') {
                    try {
                        messageObj = JSON.parse(messageObj);
                    }
                    catch (e) {
                        messageObj = e.data;
                    }
                }
                if (messageObj.type === type) {
                    cb(messageObj);
                }
            });
        }
    }
};
