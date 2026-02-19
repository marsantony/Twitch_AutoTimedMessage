import { describe, it, expect, beforeEach } from 'vitest';
import {
    STORAGE_MESSAGES, loadMessages, saveMessages,
    addMessage, updateMessage, deleteMessage, toggleMessage
} from '../src/messageStore.js';

describe('messageStore', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('loadMessages', () => {
        it('無資料時回傳空陣列', () => {
            expect(loadMessages()).toEqual([]);
        });

        it('有資料時正確解析', () => {
            localStorage.setItem(STORAGE_MESSAGES, JSON.stringify([{ id: '1', content: 'hello' }]));
            expect(loadMessages()).toEqual([{ id: '1', content: 'hello' }]);
        });

        it('資料損壞時回傳空陣列', () => {
            localStorage.setItem(STORAGE_MESSAGES, 'invalid json{{{');
            expect(loadMessages()).toEqual([]);
        });
    });

    describe('saveMessages', () => {
        it('正確序列化並儲存', () => {
            saveMessages([{ id: '1', content: 'test' }]);
            expect(JSON.parse(localStorage.getItem(STORAGE_MESSAGES))).toEqual([{ id: '1', content: 'test' }]);
        });
    });

    describe('addMessage', () => {
        it('新增訊息帶有預設值', () => {
            const result = addMessage({ content: '大家好' });
            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('大家好');
            expect(result[0].scheduleMode).toBe('fixed');
            expect(result[0].fixedIntervalSeconds).toBe(600);
            expect(result[0].randomMinSeconds).toBe(300);
            expect(result[0].randomMaxSeconds).toBe(900);
            expect(result[0].enabled).toBe(true);
            expect(result[0].id).toBeTruthy();
            expect(result[0].createdAt).toBeTruthy();
        });

        it('可自訂排程參數', () => {
            const result = addMessage({
                content: 'test',
                scheduleMode: 'random',
                randomMinSeconds: 180,
                randomMaxSeconds: 480,
            });
            expect(result[0].scheduleMode).toBe('random');
            expect(result[0].randomMinSeconds).toBe(180);
            expect(result[0].randomMaxSeconds).toBe(480);
        });

        it('多次新增產生不同 ID', () => {
            addMessage({ content: 'first' });
            const result = addMessage({ content: 'second' });
            expect(result).toHaveLength(2);
            expect(result[0].id).not.toBe(result[1].id);
        });

        it('儲存到 localStorage', () => {
            addMessage({ content: 'persist' });
            const stored = JSON.parse(localStorage.getItem(STORAGE_MESSAGES));
            expect(stored).toHaveLength(1);
            expect(stored[0].content).toBe('persist');
        });
    });

    describe('updateMessage', () => {
        it('更新指定訊息的欄位', () => {
            addMessage({ content: 'original' });
            const messages = loadMessages();
            const id = messages[0].id;

            const result = updateMessage(id, { content: 'updated', fixedIntervalSeconds: 1200 });
            expect(result[0].content).toBe('updated');
            expect(result[0].fixedIntervalSeconds).toBe(1200);
        });

        it('不存在的 ID 不影響資料', () => {
            addMessage({ content: 'safe' });
            const result = updateMessage('nonexistent', { content: 'hacked' });
            expect(result[0].content).toBe('safe');
        });
    });

    describe('deleteMessage', () => {
        it('刪除指定訊息', () => {
            addMessage({ content: 'keep' });
            addMessage({ content: 'delete me' });
            const messages = loadMessages();
            const deleteId = messages[1].id;

            const result = deleteMessage(deleteId);
            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('keep');
        });

        it('不存在的 ID 不影響資料', () => {
            addMessage({ content: 'safe' });
            const result = deleteMessage('nonexistent');
            expect(result).toHaveLength(1);
        });
    });

    describe('toggleMessage', () => {
        it('啟用變停用', () => {
            addMessage({ content: 'toggle me' });
            const id = loadMessages()[0].id;

            const result = toggleMessage(id);
            expect(result[0].enabled).toBe(false);
        });

        it('停用變啟用', () => {
            addMessage({ content: 'toggle me' });
            const id = loadMessages()[0].id;

            toggleMessage(id); // false
            const result = toggleMessage(id); // true
            expect(result[0].enabled).toBe(true);
        });
    });

    describe('constants', () => {
        it('匯出正確的 localStorage key', () => {
            expect(STORAGE_MESSAGES).toBe('Twitch_AutoTimedMessage_Messages');
        });
    });
});
