import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Web Worker 在 jsdom 中不存在，所以我們模擬 self 環境來測試 worker 邏輯
let workerHandler;
const posted = [];

function setupWorkerEnv() {
    posted.length = 0;
    const mockSelf = {
        postMessage: (msg) => posted.push(msg),
        onmessage: null,
    };
    globalThis.self = mockSelf;

    // 載入 worker 程式碼（會設定 self.onmessage）
    // 由於 worker 直接設定 self.onmessage，我們需要用動態方式載入
    delete require.cache[require.resolve('../src/timerWorker.js')];
    require('../src/timerWorker.js');
    workerHandler = mockSelf.onmessage;
}

function sendToWorker(data) {
    workerHandler({ data });
}

describe('timerWorker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setupWorkerEnv();
    });

    afterEach(() => {
        sendToWorker({ type: 'stop' });
        vi.useRealTimers();
        delete globalThis.self;
    });

    describe('start', () => {
        it('啟動後為每個啟用的訊息發送 timerInfo', () => {
            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'hello', scheduleMode: 'fixed', fixedIntervalSeconds: 600, enabled: true },
                    { id: 'b', content: 'world', scheduleMode: 'fixed', fixedIntervalSeconds: 300, enabled: true },
                ]
            });

            const timerInfos = posted.filter(m => m.type === 'timerInfo');
            expect(timerInfos).toHaveLength(2);
            expect(timerInfos.map(m => m.id).sort()).toEqual(['a', 'b']);
        });

        it('停用的訊息不排程', () => {
            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'hello', scheduleMode: 'fixed', fixedIntervalSeconds: 600, enabled: false },
                ]
            });

            const timerInfos = posted.filter(m => m.type === 'timerInfo');
            expect(timerInfos).toHaveLength(0);
        });

        it('固定間隔到時發送 sendMessage', () => {
            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'hello', scheduleMode: 'fixed', fixedIntervalSeconds: 600, enabled: true },
                ]
            });

            posted.length = 0;
            vi.advanceTimersByTime(600 * 1000);

            const sends = posted.filter(m => m.type === 'sendMessage');
            expect(sends).toHaveLength(1);
            expect(sends[0].id).toBe('a');
            expect(sends[0].content).toBe('hello');
        });

        it('發送後自動重新排程', () => {
            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'hello', scheduleMode: 'fixed', fixedIntervalSeconds: 300, enabled: true },
                ]
            });

            posted.length = 0;
            vi.advanceTimersByTime(300 * 1000);
            expect(posted.filter(m => m.type === 'sendMessage')).toHaveLength(1);

            // 第二次排程也應該觸發
            posted.length = 0;
            vi.advanceTimersByTime(300 * 1000);
            expect(posted.filter(m => m.type === 'sendMessage')).toHaveLength(1);
        });

        it('隨機範圍的延遲在 min 和 max 之間', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0.5);

            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'hi', scheduleMode: 'random', randomMinSeconds: 300, randomMaxSeconds: 900, enabled: true },
                ]
            });

            const timerInfo = posted.find(m => m.type === 'timerInfo');
            const delay = timerInfo.nextSendAt - Date.now();
            // random=0.5 → delay = 300*1000 + 0.5*(900-300)*1000 = 300000 + 300000 = 600000 (600秒)
            expect(delay).toBe(600 * 1000);

            Math.random.mockRestore();
        });
    });

    describe('stop', () => {
        it('停止所有計時器並發送 stopped', () => {
            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'hello', scheduleMode: 'fixed', fixedIntervalSeconds: 300, enabled: true },
                ]
            });

            posted.length = 0;
            sendToWorker({ type: 'stop' });

            expect(posted.find(m => m.type === 'stopped')).toBeTruthy();

            // 時間推進後不應有 sendMessage
            posted.length = 0;
            vi.advanceTimersByTime(600 * 1000);
            expect(posted.filter(m => m.type === 'sendMessage')).toHaveLength(0);
        });
    });

    describe('updateMessages', () => {
        it('重新排程所有訊息', () => {
            sendToWorker({
                type: 'start',
                messages: [
                    { id: 'a', content: 'old', scheduleMode: 'fixed', fixedIntervalSeconds: 600, enabled: true },
                ]
            });

            posted.length = 0;
            sendToWorker({
                type: 'updateMessages',
                messages: [
                    { id: 'a', content: 'new', scheduleMode: 'fixed', fixedIntervalSeconds: 120, enabled: true },
                ]
            });

            // 新排程的 timerInfo
            const timerInfos = posted.filter(m => m.type === 'timerInfo');
            expect(timerInfos).toHaveLength(1);

            // 120 秒後應發送新內容
            posted.length = 0;
            vi.advanceTimersByTime(120 * 1000);
            const sends = posted.filter(m => m.type === 'sendMessage');
            expect(sends).toHaveLength(1);
            expect(sends[0].content).toBe('new');
        });
    });
});
