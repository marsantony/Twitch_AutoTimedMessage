import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addLog, formatTimestamp, formatCountdown, formatSeconds } from '../src/utils.js';

describe('addLog', () => {
    it('新訊息插入 textarea 最前面', () => {
        const el = { value: '' };
        addLog(el, '第一條');
        expect(el.value).toBe('第一條\r\n');

        addLog(el, '第二條');
        expect(el.value).toBe('第二條\r\n第一條\r\n');
    });
});

describe('formatTimestamp', () => {
    it('將時間戳轉為 sv-SE 格式', () => {
        const result = formatTimestamp(1700000000000);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('不傳參數時使用當前時間', () => {
        const result = formatTimestamp();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
});

describe('formatCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('顯示剩餘分鐘和秒數', () => {
        const target = Date.now() + 5 * 60 * 1000 + 30 * 1000; // 5:30
        expect(formatCountdown(target)).toBe('5:30');
    });

    it('秒數小於 10 時補零', () => {
        const target = Date.now() + 3 * 60 * 1000 + 5 * 1000; // 3:05
        expect(formatCountdown(target)).toBe('3:05');
    });

    it('已過期時顯示 0:00', () => {
        const target = Date.now() - 1000;
        expect(formatCountdown(target)).toBe('0:00');
    });

    it('剛好零秒時顯示 0:00', () => {
        const target = Date.now();
        expect(formatCountdown(target)).toBe('0:00');
    });
});

describe('formatSeconds', () => {
    it('大於等於 60 秒且整除時顯示分鐘', () => {
        expect(formatSeconds(600)).toBe('10 分鐘');
        expect(formatSeconds(60)).toBe('1 分鐘');
    });

    it('大於等於 60 秒且有餘數時顯示分秒', () => {
        expect(formatSeconds(90)).toBe('1 分 30 秒');
        expect(formatSeconds(125)).toBe('2 分 5 秒');
    });

    it('小於 60 秒時顯示秒數', () => {
        expect(formatSeconds(30)).toBe('30 秒');
        expect(formatSeconds(1)).toBe('1 秒');
    });
});
