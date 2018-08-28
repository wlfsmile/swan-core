import Slave from '../../src/slave/index.js';
var slave = new Slave(window, window.swanInterface, window.swanComponents);
window.slave = slave;
console.log('slave-xx');
window.slaveInit = function (template) {
    // var Slave = window.default;
    // new Slave(window, window.swanInterface, window.swanComponents);
    window.afterSlaveFrameWork && window.afterSlaveFrameWork();
    if (window.pageRender) {
        window.pageRender(template, [], []);
        window.testutils.clientActions.bind('initData', function (e) {
            window.testutils.clientActions.dispatchMessage(e);
            setTimeout(function () {
                window.afterSlave && window.afterSlave();
            }, 1);
        });
    }
};
