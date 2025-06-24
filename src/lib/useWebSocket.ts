import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketHookResult {
  send: (msg: any) => void;
  lastMessage: MessageEvent | null;
  readyState: number;
  error: Event | null;
}

export function useWebSocket(
  url: string,
  subscribeMessages: any[] = [],
  options?: {
    protocols?: string | string[];
    reconnectInterval?: number;
    maxReconnectInterval?: number;
  }
): WebSocketHookResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const [error, setError] = useState<Event | null>(null);

  const send = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const connect = () => {
      const ws = new WebSocket(url, options?.protocols);
      wsRef.current = ws;
      setReadyState(ws.readyState);

      ws.onopen = () => {
        reconnectCount.current = 0;
        setReadyState(ws.readyState);
        subscribeMessages.forEach((msg) => ws.send(JSON.stringify(msg)));
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
      };

      ws.onerror = (evt) => {
        setError(evt);
      };

      ws.onclose = () => {
        setReadyState(WebSocket.CLOSED);
        const interval = Math.min(
          (options?.reconnectInterval ?? 1000) * 2 ** reconnectCount.current,
          options?.maxReconnectInterval ?? 30000
        );
        reconnectCount.current += 1;
        if (isMounted) {
          setTimeout(connect, interval);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, JSON.stringify(subscribeMessages)]);

  return { send, lastMessage, readyState, error };
} 