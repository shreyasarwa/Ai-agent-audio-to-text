import { useEffect, useRef } from 'react';
import { clientId } from '../lib/api';
import { useUploadStore, useTranscriptStore, useUIStore } from '../store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export function useWebSocket() {
  const { setProcessingProgress, setDone, setUploadError } = useUploadStore();
  const { addOrUpdateTranscript } = useTranscriptStore();
  const { addToast } = useUIStore();

  // Use refs so the connect closure always sees the latest values
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    destroyedRef.current = false;

    function connect() {
      // Don't open a new connection if we're tearing down
      if (destroyedRef.current) return;

      // Clear any pending reconnect before opening a new socket
      clearTimeout(reconnectTimerRef.current);

      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.addEventListener('open', () => {
        console.log('[WS] Connected');
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'identify', clientId }));
        }
      });

      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'progress') {
            setProcessingProgress(msg.pct, msg.stage);
          } else if (msg.type === 'done') {
            setDone();
            addOrUpdateTranscript({
              id: msg.id,
              title: msg.title,
              duration: msg.duration,
              status: 'DONE',
              createdAt: new Date().toISOString(),
              content: '',
            });
            addToast({ type: 'success', message: `"${msg.title}" transcribed successfully` });
          } else if (msg.type === 'error') {
            setUploadError(msg.message);
            addToast({ type: 'error', message: msg.message || 'Transcription failed' });
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.addEventListener('close', () => {
        if (destroyedRef.current) return; // intentional close — stop reconnecting
        console.log('[WS] Disconnected — reconnecting in 3s');
        reconnectTimerRef.current = setTimeout(connect, 3000);
      });

      // On error, close the socket cleanly — the close handler will schedule reconnect
      ws.addEventListener('error', (err) => {
        console.warn('[WS] Error:', err);
        ws.close();
      });
    }

    connect();

    return () => {
      destroyedRef.current = true;
      clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, []);
}
