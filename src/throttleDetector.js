/**
 * 偵測主線程是否受到瀏覽器節流
 * 透過檢查 setInterval 的實際觸發間隔來判斷
 */
class ThrottleDetector {
    #statusEl = null;
    #intervalId = null;
    #lastTick = 0;
    #threshold = 2000; // 如果 1000ms 的 interval 超過 2000ms 才觸發，表示被節流
    #visibilityHandler = null;

    constructor(statusElId) {
        this.#statusEl = document.getElementById(statusElId);
    }

    start() {
        this.#lastTick = Date.now();
        this.#intervalId = setInterval(() => {
            var now = Date.now();
            var elapsed = now - this.#lastTick;
            this.#lastTick = now;
            var throttled = elapsed > this.#threshold;
            this.#updateDisplay(throttled, elapsed);
        }, 1000);

        this.#visibilityHandler = () => { this.#updateVisibility(); };
        document.addEventListener('visibilitychange', this.#visibilityHandler);
        this.#updateVisibility();
    }

    stop() {
        if (this.#intervalId) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }
        if (this.#visibilityHandler) {
            document.removeEventListener('visibilitychange', this.#visibilityHandler);
            this.#visibilityHandler = null;
        }
    }

    #updateVisibility() {
        if (!this.#statusEl) return;
        if (document.hidden) {
            this.#statusEl.textContent = '頁面已隱藏（背景中）';
            this.#statusEl.className = 'status-warning';
        }
    }

    #updateDisplay(throttled, elapsed) {
        if (!this.#statusEl) return;
        if (throttled) {
            this.#statusEl.textContent = '主線程受到節流限制（延遲 ' + elapsed + 'ms）';
            this.#statusEl.className = 'status-throttled';
        } else {
            this.#statusEl.textContent = '正常運作中';
            this.#statusEl.className = 'status-ok';
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThrottleDetector };
}
