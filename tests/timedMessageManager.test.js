import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimedMessageManager } from '../src/timedMessageManager.js';

import * as utils from '../src/utils.js';
import * as store from '../src/messageStore.js';
globalThis.addLog = utils.addLog;
globalThis.formatTimestamp = utils.formatTimestamp;
globalThis.loadMessages = store.loadMessages;
globalThis.saveMessages = store.saveMessages;
globalThis.addMessage = store.addMessage;
globalThis.STORAGE_CHANNEL = store.STORAGE_CHANNEL;

function createMockTmiClient() {
    return {
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(() => Promise.resolve()),
        say: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
    };
}

function createMockWorker() {
    return {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
    };
}

function setupDOM() {
    document.body.innerHTML = `
        <select id="channel">
            <option value="shuteye_orange">蝦愛橘子</option>
            <option value="marsantonymars">姬柊雪菜我老婆</option>
        </select>
        <textarea id="log"></textarea>
        <span id="connectionStatus"></span>
    `;
}

describe('TimedMessageManager', () => {
    beforeEach(() => {
        setupDOM();
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('Twitch_OAuthToken', 'testtoken');
        sessionStorage.setItem('Twitch_OAuthUsername', 'testuser');
    });

    describe('start', () => {
        it('建立 tmi 連線並啟動 worker', () => {
            const mockClient = createMockTmiClient();
            const mockWorker = createMockWorker();
            const manager = new TimedMessageManager({
                tmiClientFactory: vi.fn(() => mockClient),
                workerFactory: () => mockWorker,
            });

            addMessage({ content: 'test' });
            manager.start();

            expect(mockClient.connect).toHaveBeenCalled();
            expect(mockWorker.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'start' })
            );
            expect(manager.isRunning).toBe(true);
        });

        it('連線時使用 sessionStorage 的 token', () => {
            const mockClient = createMockTmiClient();
            const factory = vi.fn(() => mockClient);
            const manager = new TimedMessageManager({
                tmiClientFactory: factory,
                workerFactory: () => createMockWorker(),
            });

            manager.start();

            expect(factory).toHaveBeenCalledWith(
                expect.objectContaining({
                    identity: {
                        username: 'testuser',
                        password: 'testtoken'
                    }
                })
            );
        });

        it('連線時使用選中的頻道', () => {
            const factory = vi.fn(() => createMockTmiClient());
            const manager = new TimedMessageManager({
                tmiClientFactory: factory,
                workerFactory: () => createMockWorker(),
            });

            document.getElementById('channel').value = 'marsantonymars';
            manager.start();

            expect(factory).toHaveBeenCalledWith(
                expect.objectContaining({
                    channels: ['marsantonymars']
                })
            );
        });
    });

    describe('stop', () => {
        it('停止 worker 並斷開連線', () => {
            const mockClient = createMockTmiClient();
            const mockWorker = createMockWorker();
            const manager = new TimedMessageManager({
                tmiClientFactory: () => mockClient,
                workerFactory: () => mockWorker,
            });

            manager.start();
            manager.stop();

            expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'stop' });
            expect(mockWorker.terminate).toHaveBeenCalled();
            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(manager.isRunning).toBe(false);
        });

        it('未啟動時呼叫 stop 不會報錯', () => {
            const manager = new TimedMessageManager({
                tmiClientFactory: () => createMockTmiClient(),
                workerFactory: () => createMockWorker(),
            });

            expect(() => manager.stop()).not.toThrow();
        });
    });

    describe('refreshMessages', () => {
        it('運行中時發送 updateMessages 到 worker', () => {
            const mockWorker = createMockWorker();
            const manager = new TimedMessageManager({
                tmiClientFactory: () => createMockTmiClient(),
                workerFactory: () => mockWorker,
            });

            addMessage({ content: 'msg1' });
            manager.start();
            mockWorker.postMessage.mockClear();

            addMessage({ content: 'msg2' });
            manager.refreshMessages();

            expect(mockWorker.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'updateMessages',
                    messages: expect.arrayContaining([
                        expect.objectContaining({ content: 'msg1' }),
                        expect.objectContaining({ content: 'msg2' }),
                    ])
                })
            );
        });

        it('未運行時呼叫不會報錯', () => {
            const manager = new TimedMessageManager({
                tmiClientFactory: () => createMockTmiClient(),
                workerFactory: () => createMockWorker(),
            });

            expect(() => manager.refreshMessages()).not.toThrow();
        });
    });

    describe('worker sendMessage 事件', () => {
        it('收到 sendMessage 時透過 tmi 發送', async () => {
            const mockClient = createMockTmiClient();
            const mockWorker = createMockWorker();
            const manager = new TimedMessageManager({
                tmiClientFactory: () => mockClient,
                workerFactory: () => mockWorker,
            });

            manager.start();

            // 模擬 worker 發送 sendMessage
            mockWorker.onmessage({
                data: { type: 'sendMessage', id: 'a', content: '大家好' }
            });

            expect(mockClient.say).toHaveBeenCalledWith('shuteye_orange', '大家好');
        });

        it('發送成功時寫入日誌', async () => {
            const mockClient = createMockTmiClient();
            mockClient.say = vi.fn(() => Promise.resolve());
            const mockWorker = createMockWorker();
            const manager = new TimedMessageManager({
                tmiClientFactory: () => mockClient,
                workerFactory: () => mockWorker,
            });

            manager.start();
            mockWorker.onmessage({
                data: { type: 'sendMessage', id: 'a', content: '大家好' }
            });

            await vi.waitFor(() => {
                expect(document.getElementById('log').value).toContain('已發送');
                expect(document.getElementById('log').value).toContain('大家好');
            });
        });

        it('發送失敗時寫入錯誤日誌', async () => {
            const mockClient = createMockTmiClient();
            mockClient.say = vi.fn(() => Promise.reject(new Error('connection lost')));
            const mockWorker = createMockWorker();
            const manager = new TimedMessageManager({
                tmiClientFactory: () => mockClient,
                workerFactory: () => mockWorker,
            });

            manager.start();
            mockWorker.onmessage({
                data: { type: 'sendMessage', id: 'a', content: '大家好' }
            });

            await vi.waitFor(() => {
                expect(document.getElementById('log').value).toContain('錯誤');
                expect(document.getElementById('log').value).toContain('connection lost');
            });
        });
    });
});
