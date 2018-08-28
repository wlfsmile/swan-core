import EventsEmitter from '@baidu/events-emitter';

const global = window;
global.swanEvents = global.swanEvents || new EventsEmitter();

export default function (type, data){
    // console.log(type)
    global.swanEvents.fireMessage({
        type,
        data
    });
}
