/**
 * 寫入 log textarea，新訊息會在最前面
 * @param {HTMLTextAreaElement} logEl
 * @param {string} text
 */
function addLog(logEl, text) {
    logEl.value = text + '\r\n' + logEl.value;
}

/**
 * 時間戳格式化
 * @param {number} [timestamp]
 * @returns {string}
 */
function formatTimestamp(timestamp) {
    return new Date(timestamp || Date.now()).toLocaleString('sv-SE');
}

/**
 * 倒數計時格式化（回傳 MM:SS）
 * @param {number} targetMs - 目標時間的毫秒數
 * @returns {string}
 */
function formatCountdown(targetMs) {
    const diff = Math.max(0, targetMs - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

/**
 * 秒數格式化為人類可讀
 * @param {number} seconds
 * @returns {string}
 */
function formatSeconds(seconds) {
    if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? mins + ' 分 ' + secs + ' 秒' : mins + ' 分鐘';
    }
    return seconds + ' 秒';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addLog, formatTimestamp, formatCountdown, formatSeconds };
}
