import { useEffect, useRef } from 'react';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function useInactivityLogout(onTimeout: () => void, enabled = true) {
    const timerRef = useRef<number>();
    const callbackRef = useRef(onTimeout);
    callbackRef.current = onTimeout;

    useEffect(() => {
        if (!enabled) return;

        const reset = () => {
            window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => callbackRef.current(), INACTIVITY_TIMEOUT_MS);
        };

        reset();
        EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));

        const onVisibility = () => {
            if (document.visibilityState === 'visible') reset();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.clearTimeout(timerRef.current);
            EVENTS.forEach((event) => window.removeEventListener(event, reset));
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [enabled]);
}
