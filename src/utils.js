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
    var diff = Math.max(0, targetMs - Date.now());
    var mins = Math.floor(diff / 60000);
    var secs = Math.floor((diff % 60000) / 1000);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

/**
 * 分鐘數格式化為人類可讀
 * @param {number} minutes
 * @returns {string}
 */
function formatMinutes(minutes) {
    if (minutes < 1) return Math.round(minutes * 60) + ' 秒';
    return minutes + ' 分鐘';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addLog, formatTimestamp, formatCountdown, formatMinutes };
}
