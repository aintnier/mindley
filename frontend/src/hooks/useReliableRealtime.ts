import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Reliable realtime hook with automatic HTTP polling fallback.
 *
 * Sections:
 *  - subscribeRealtime: Establish websocket channels
 *  - unsubscribe (cleanupChannels): Remove channels
 *  - startPolling / stopPolling: Fallback interval logic
 *  - error handling: track failures & switch modes
 *  - reconnection: exponential backoff + online listener
 */

export type ConnectionMode = 'connected' | 'polling' | 'error' | 'initializing';

export interface PostgresChangeFilter {
  event: string; // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema: string; // usually 'public'
  table: string;
  filter?: string; // e.g. user_id=eq.xxx
}

export interface RealtimeSource {
  /** Logical key used for synthetic events coming from this source */
  key: string;
  /** Postgres Changes filter definition */
  filter: PostgresChangeFilter;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SyntheticEvent<T = any> {
  source: string; // key of source
  payload: T; // domain payload (can mimic supabase payload shape)
  isSynthetic: boolean; // true if generated via polling
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseReliableRealtimeConfig<TSynthetic = any> {
  sources: RealtimeSource[];
  pollIntervalMs?: number;
  poller?: () => Promise<SyntheticEvent<TSynthetic>[]>; // produce synthetic delta events
  onEvent: (evt: SyntheticEvent) => void; // consumer handler (toast logic lives elsewhere)
  maxFailuresBeforeBackoff?: number;
}

export interface UseReliableRealtimeState {
  mode: ConnectionMode;
  error: string | null;
  lastActivityAt: number | null;
  failures: number;
  forceReconnect: () => void;
}

export function useReliableRealtime(config: UseReliableRealtimeConfig): UseReliableRealtimeState {
  const { sources, pollIntervalMs = 5000, poller, onEvent, maxFailuresBeforeBackoff = 3 } = config;

  const [mode, setMode] = useState<ConnectionMode>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null);

  const channelsRef = useRef<Record<string, RealtimeChannel>>({});
  const pollTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  // Track current subscription generation to ignore stale channel callbacks
  const generationRef = useRef(0);
  // Track last logged status per channel (per generation) to avoid log spam
  const lastStatusRef = useRef<Record<string, string>>({});
  // Mirror mode in ref for access inside callbacks without stale closure
  const modeRef = useRef<ConnectionMode>(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ---------------- Polling ----------------
  const clearPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startPolling = useCallback(() => {
    if (!poller) return; // nothing to do
    if (pollTimerRef.current) return; // already polling
    setMode((m) => (m === 'connected' ? m : 'polling'));
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const events = await poller();
        events.forEach((evt) => {
          setLastActivityAt(Date.now());
          onEvent({ ...evt, isSynthetic: true });
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.warn('[useReliableRealtime] Poller error', e);
      }
    }, pollIntervalMs) as unknown as number;
  }, [poller, pollIntervalMs, onEvent]);

  const stopPolling = useCallback(() => {
    clearPolling();
  }, []);

  // ---------------- Subscription ----------------
  const cleanupChannels = useCallback(() => {
    Object.values(channelsRef.current).forEach((ch) => {
      try { supabase.removeChannel(ch); } catch { /* noop */ }
    });
    channelsRef.current = {};
  }, []);

  const subscribeRealtime = useCallback(() => {
    cleanupChannels();
    if (!sources.length) return;
    setMode((m) => (m === 'polling' ? m : 'initializing'));
    let subscribedCount = 0;
    let aborted = false;
    generationRef.current += 1;
    const currentGeneration = generationRef.current;
    lastStatusRef.current = {};

    sources.forEach((source) => {
      const channel = supabase
        .channel(`reliable-${source.key}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes', source.filter as any, (payload) => {
          if (!isMountedRef.current) return;
          // Ignore events from stale generations
          if (generationRef.current !== currentGeneration) return;
          setLastActivityAt(Date.now());
          onEvent({ source: source.key, payload, isSynthetic: false });
        })
        .subscribe((status, err) => {
          if (!isMountedRef.current) return;
          // Ignore callbacks from stale generations
            if (generationRef.current !== currentGeneration) return;
          if (err) {
            if (lastStatusRef.current[source.key] !== 'ERROR') {
              console.warn('[useReliableRealtime] Channel error', source.key, err);
              lastStatusRef.current[source.key] = 'ERROR';
            }
            aborted = true;
            setError(err.message || 'Channel error');
            setFailures((f) => f + 1);
            setMode('polling');
            startPolling();
            return;
          }
          if (status === 'SUBSCRIBED') {
            subscribedCount += 1;
            if (subscribedCount === sources.length && !aborted) {
              setMode('connected');
              setError(null);
              setFailures(0);
              stopPolling();
            }
          } else if (['TIMED_OUT', 'CHANNEL_ERROR'].includes(status) || (status === 'CLOSED' && modeRef.current === 'connected')) {
            // Only log once per channel per status per generation
            if (lastStatusRef.current[source.key] !== status) {
              console.warn('[useReliableRealtime] Channel status issue', source.key, status);
              lastStatusRef.current[source.key] = status;
            }
            if (modeRef.current !== 'polling') {
              setMode('polling');
              startPolling();
            }
          }
        });
      channelsRef.current[source.key] = channel;
    });
  }, [sources, cleanupChannels, onEvent, startPolling, stopPolling]);

  // ---------------- Reconnection ----------------
  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    const backoffMs = Math.min(30000, 1000 * Math.pow(2, Math.max(0, failures - maxFailuresBeforeBackoff)));
    reconnectTimerRef.current = window.setTimeout(() => {
      if (navigator.onLine) {
        subscribeRealtime();
      } else {
        scheduleReconnect(); // keep waiting
      }
    }, backoffMs) as unknown as number;
  }, [failures, maxFailuresBeforeBackoff, subscribeRealtime]);

  const forceReconnect = useCallback(() => {
    setFailures(0);
    subscribeRealtime();
  }, [subscribeRealtime]);

  // ---------------- Lifecycle ----------------
  const teardown = useCallback(() => {
    cleanupChannels();
    stopPolling();
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
  }, [cleanupChannels, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    subscribeRealtime();
    if (poller) startPolling(); // safety net until realtime established
    return () => {
      isMountedRef.current = false;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sources)]);

  // Reconnect when browser returns online
  useEffect(() => {
    const handleOnline = () => { if (mode === 'polling') scheduleReconnect(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [mode, scheduleReconnect]);

  // If stuck in polling, keep scheduling reconnect attempts.
  useEffect(() => {
    if (mode === 'polling') scheduleReconnect();
  }, [mode, failures, scheduleReconnect]);

  return { mode, error, lastActivityAt, failures, forceReconnect };
}
