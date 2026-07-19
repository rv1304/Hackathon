'use client';

import { useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { PipelineResult } from './types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

export function usePipelineWebSocket(onPipeline: (data: PipelineResult) => void) {
  const clientRef = useRef<Client | null>(null);
  const cbRef = useRef(onPipeline);
  cbRef.current = onPipeline;

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as unknown as WebSocket,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe('/topic/pipeline', (msg) => {
          try {
            const data = JSON.parse(msg.body) as PipelineResult;
            cbRef.current(data);
          } catch { /* ignore parse errors */ }
        });
      },
    });
    client.activate();
    clientRef.current = client;
  }, []);

  useEffect(() => {
    connect();
    return () => { clientRef.current?.deactivate(); };
  }, [connect]);
}
