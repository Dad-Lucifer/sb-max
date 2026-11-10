import { useEffect, useRef } from 'react';
import { socket } from '../utils/socket';

export const AVAILABILITY_EVENTS = [
    'session:started', 'session:completed', 'session:updated', 'session:deleted',
    'booking:converted', 'booking:created', 'booking:deleted'
];

/** Calls `callback` when any of `events` fires (debounced 300 ms), on socket reconnect,
 *  and when the tab becomes visible again. No timers, no polling. */
export function useLiveRefresh(callback: () => void, events: string[], enabled = true) {
    const cb = useRef(callback);
    cb.current = callback;
    const key = events.join('|');

    useEffect(() => {
        if (!enabled) return;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const fire = () => {
            if (timer) return;
            timer = setTimeout(() => {
                timer = null;
                if (document.visibilityState === 'visible') cb.current();
            }, 300);
        };
        const onVisible = () => { if (document.visibilityState === 'visible') cb.current(); };

        events.forEach(e => socket.on(e, fire));
        socket.on('connect', fire);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            events.forEach(e => socket.off(e, fire));
            socket.off('connect', fire);
            document.removeEventListener('visibilitychange', onVisible);
            if (timer) clearTimeout(timer);
        };
    }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps
}
