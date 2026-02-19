/* global addLog, formatTimestamp, loadMessages, tmi, TwitchAuth, STORAGE_CHANNEL */

class TimedMessageManager {
    #client = null;
    #worker = null;
    #channel = '';
    #isRunning = false;
    #tmiClientFactory;
    #workerFactory;

    constructor(deps) {
        this.#tmiClientFactory = (deps && deps.tmiClientFactory) || ((opts) => new tmi.Client(opts));
        this.#workerFactory = (deps && deps.workerFactory) || (() => new Worker('./src/timerWorker.js'));
    }

    get isRunning() { return this.#isRunning; }

    #connect() {
        this.#disconnect();
        var channelEl = document.getElementById('channel');
        this.#channel = channelEl.value;

        this.#client = this.#tmiClientFactory({
            options: {
                debug: false,
                skipMembership: true,
                skipUpdatingEmotesets: true,
            },
            connection: {
                reconnect: true,
                secure: true
            },
            identity: {
                username: sessionStorage.getItem('Twitch_OAuthUsername') || '',
                password: sessionStorage.getItem('Twitch_OAuthToken') || ''
            },
            channels: [this.#channel]
        });

        this.#client.connect().catch(function (err) {
            var logEl = document.getElementById('log');
            addLog(logEl, '[錯誤] IRC 連線失敗: ' + err.message);
        });
    }

    #disconnect() {
        if (this.#client) {
            this.#client.disconnect().catch(function () {});
            this.#client = null;
        }
    }

    #initWorker() {
        this.#worker = this.#workerFactory();
        this.#worker.onmessage = (e) => {
            var data = e.data;
            switch (data.type) {
                case 'sendMessage':
                    this.#sendToChat(data.id, data.content);
                    break;
                case 'timerInfo':
                    this.#updateTimerDisplay(data.id, data.nextSendAt);
                    break;
            }
        };
    }

    #sendToChat(id, content) {
        if (!this.#client || !this.#isRunning) return;
        var logEl = document.getElementById('log');

        this.#client.say(this.#channel, content).then(function () {
            var timestamp = formatTimestamp();
            addLog(logEl, timestamp + ' [已發送] ' + content);
        }).catch(function (err) {
            addLog(logEl, '[錯誤] 發送失敗: ' + err.message);
        });
    }

    #updateTimerDisplay(id, nextSendAt) {
        var el = document.querySelector('[data-msg-id="' + id + '"] .next-send');
        if (el) {
            el.dataset.nextSendAt = nextSendAt;
        }
    }

    start() {
        this.#connect();
        this.#initWorker();
        var messages = loadMessages();
        this.#worker.postMessage({ type: 'start', messages: messages });
        this.#isRunning = true;
    }

    stop() {
        if (this.#worker) {
            this.#worker.postMessage({ type: 'stop' });
            this.#worker.terminate();
            this.#worker = null;
        }
        this.#disconnect();
        this.#isRunning = false;
    }

    refreshMessages() {
        if (this.#worker && this.#isRunning) {
            var messages = loadMessages();
            this.#worker.postMessage({ type: 'updateMessages', messages: messages });
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimedMessageManager };
}
