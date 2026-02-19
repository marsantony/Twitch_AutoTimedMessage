/* global localStorage */

var STORAGE_MESSAGES = 'Twitch_AutoTimedMessage_Messages';
var STORAGE_CHANNEL = 'Twitch_AutoTimedMessage_Channel';

/**
 * 產生唯一 ID
 * @returns {string}
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * 從 localStorage 載入訊息
 * @returns {Array}
 */
function loadMessages() {
    try {
        var data = localStorage.getItem(STORAGE_MESSAGES);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * 儲存訊息到 localStorage
 * @param {Array} messages
 */
function saveMessages(messages) {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}

/**
 * 新增訊息
 * @param {{ content: string, scheduleMode?: string, fixedIntervalSeconds?: number, randomMinSeconds?: number, randomMaxSeconds?: number }} msgData
 * @returns {Array}
 */
function addMessage(msgData) {
    var messages = loadMessages();
    messages.push({
        id: generateId(),
        content: msgData.content || '',
        scheduleMode: msgData.scheduleMode || 'fixed',
        fixedIntervalSeconds: msgData.fixedIntervalSeconds || 600,
        randomMinSeconds: msgData.randomMinSeconds || 300,
        randomMaxSeconds: msgData.randomMaxSeconds || 900,
        enabled: true,
        createdAt: Date.now()
    });
    saveMessages(messages);
    return messages;
}

/**
 * 更新訊息
 * @param {string} id
 * @param {object} updates
 * @returns {Array}
 */
function updateMessage(id, updates) {
    var messages = loadMessages();
    for (var i = 0; i < messages.length; i++) {
        if (messages[i].id === id) {
            Object.assign(messages[i], updates);
            break;
        }
    }
    saveMessages(messages);
    return messages;
}

/**
 * 刪除訊息
 * @param {string} id
 * @returns {Array}
 */
function deleteMessage(id) {
    var messages = loadMessages().filter(function (m) { return m.id !== id; });
    saveMessages(messages);
    return messages;
}

/**
 * 切換訊息啟用/停用
 * @param {string} id
 * @returns {Array}
 */
function toggleMessage(id) {
    var messages = loadMessages();
    for (var i = 0; i < messages.length; i++) {
        if (messages[i].id === id) {
            messages[i].enabled = !messages[i].enabled;
            break;
        }
    }
    saveMessages(messages);
    return messages;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STORAGE_MESSAGES, STORAGE_CHANNEL, generateId,
        loadMessages, saveMessages, addMessage, updateMessage, deleteMessage, toggleMessage
    };
}
