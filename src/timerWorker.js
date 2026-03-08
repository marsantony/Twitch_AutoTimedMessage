/* Web Worker：管理所有訊息的定時排程 */

const timers = new Map(); // id -> timeoutId

/**
 * 計算下次發送的延遲毫秒數
 * @param {{ scheduleMode: string, fixedIntervalSeconds: number, randomMinSeconds: number, randomMaxSeconds: number }} msg
 * @returns {number}
 */
function calculateDelay(msg) {
    if (msg.scheduleMode === 'random') {
        const min = msg.randomMinSeconds * 1000;
        const max = msg.randomMaxSeconds * 1000;
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

    const delay = calculateDelay(msg);
    const nextSendAt = Date.now() + delay;

    const timeoutId = setTimeout(() => {
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
    timers.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    timers.clear();
}

self.onmessage = (e) => {
    const data = e.data;

    switch (data.type) {
        case 'start':
        case 'updateMessages':
            stopAll();
            data.messages.filter((m) => m.enabled).forEach(scheduleMessage);
            break;

        case 'stop':
            stopAll();
            self.postMessage({ type: 'stopped' });
            break;
    }
};
