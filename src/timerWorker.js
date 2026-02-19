/* Web Worker：管理所有訊息的定時排程 */

var timers = new Map(); // id -> timeoutId

/**
 * 計算下次發送的延遲毫秒數
 * @param {{ scheduleMode: string, fixedIntervalSeconds: number, randomMinSeconds: number, randomMaxSeconds: number }} msg
 * @returns {number}
 */
function calculateDelay(msg) {
    if (msg.scheduleMode === 'random') {
        var min = msg.randomMinSeconds * 1000;
        var max = msg.randomMaxSeconds * 1000;
        return min + Math.random() * (max - min);
    }
    return msg.fixedIntervalSeconds * 1000;
}

/**
 * 為單則訊息排程
 * @param {object} msg
 */
function scheduleMessage(msg) {
    if (!msg.enabled) return;

    var delay = calculateDelay(msg);
    var nextSendAt = Date.now() + delay;

    var timeoutId = setTimeout(function () {
        self.postMessage({ type: 'sendMessage', id: msg.id, content: msg.content });
        scheduleMessage(msg);
    }, delay);

    timers.set(msg.id, timeoutId);
    self.postMessage({ type: 'timerInfo', id: msg.id, nextSendAt: nextSendAt });
}

/**
 * 停止所有計時器
 */
function stopAll() {
    timers.forEach(function (timeoutId) {
        clearTimeout(timeoutId);
    });
    timers.clear();
}

self.onmessage = function (e) {
    var data = e.data;

    switch (data.type) {
        case 'start':
            stopAll();
            data.messages.filter(function (m) { return m.enabled; }).forEach(scheduleMessage);
            break;

        case 'stop':
            stopAll();
            self.postMessage({ type: 'stopped' });
            break;

        case 'updateMessages':
            stopAll();
            data.messages.filter(function (m) { return m.enabled; }).forEach(scheduleMessage);
            break;
    }
};
