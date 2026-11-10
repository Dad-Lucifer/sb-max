import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import { useLiveRefresh } from './useLiveRefresh';

export interface ActiveSessionLite {
    id: string;
    customer: string;
    startTime: string;
    duration: number;
}

export function useActiveSessions() {
    const [sessions, setSessions] = useState<ActiveSessionLite[]>([]);
    const load = useCallback(async () => {
        try {
            setSessions((await api.get('/api/sessions/active')).data);
        } catch (e) {
            console.error('Failed to fetch sessions', e);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    useLiveRefresh(load, ['session:started', 'session:completed', 'session:updated', 'session:deleted', 'booking:converted']);
    return sessions;
}
