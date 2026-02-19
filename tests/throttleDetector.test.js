import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThrottleDetector } from '../src/throttleDetector.js';

describe('ThrottleDetector', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '<span id="throttleStatus"></span>';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('初始化後顯示正常狀態', () => {
        // 模擬頁面可見
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });

        const detector = new ThrottleDetector('throttleStatus');
        detector.start();

        // 推進 1 秒，觸發 interval
        vi.advanceTimersByTime(1000);

        const el = document.getElementById('throttleStatus');
        expect(el.textContent).toBe('正常運作中');
        expect(el.className).toBe('status-ok');

        detector.stop();
    });

    it('當延遲超過閾值時顯示節流狀態', () => {
        const detector = new ThrottleDetector('throttleStatus');
        detector.start();

        // fake timer 下 interval 都準時，無法直接模擬節流
        // 所以先觸發一次正常 tick，再手動推進系統時間模擬延遲
        vi.advanceTimersByTime(1000); // 正常 tick

        // 手動推進系統時間 3 秒，但只推進 timer 1 秒，讓 elapsed > threshold
        vi.setSystemTime(new Date(Date.now() + 3000));
        vi.advanceTimersByTime(1000);

        const el = document.getElementById('throttleStatus');
        expect(el.textContent).toContain('節流限制');
        expect(el.className).toBe('status-throttled');

        detector.stop();
    });

    it('頁面隱藏時更新狀態', () => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });

        const detector = new ThrottleDetector('throttleStatus');
        detector.start();

        // 模擬頁面隱藏
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));

        const el = document.getElementById('throttleStatus');
        expect(el.textContent).toContain('頁面已隱藏');
        expect(el.className).toBe('status-warning');

        detector.stop();
    });

    it('stop 後不再更新', () => {
        const detector = new ThrottleDetector('throttleStatus');
        detector.start();

        vi.advanceTimersByTime(1000);
        detector.stop();

        const el = document.getElementById('throttleStatus');
        const currentText = el.textContent;

        vi.advanceTimersByTime(5000);
        expect(el.textContent).toBe(currentText);
    });
});
