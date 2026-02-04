import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const handlers = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        console.log('Reconnecting...');
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Call all handlers for this message type
        const messageHandlers = handlers.current.get(message.type);
        if (messageHandlers) {
          messageHandlers.forEach(handler => handler(message.data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const subscribe = useCallback((channel: string, handler?: MessageHandler) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, queuing subscription');
      setTimeout(() => subscribe(channel, handler), 1000);
      return;
    }

    ws.current.send(JSON.stringify({
      type: 'subscribe',
      channel,
    }));

    if (handler) {
      const channelHandlers = handlers.current.get(`${channel}_update`) || new Set();
      channelHandlers.add(handler);
      handlers.current.set(`${channel}_update`, channelHandlers);
    }
  }, []);

  const unsubscribe = useCallback((channel: string, handler?: MessageHandler) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({
      type: 'unsubscribe',
      channel,
    }));

    if (handler) {
      const channelHandlers = handlers.current.get(`${channel}_update`);
      if (channelHandlers) {
        channelHandlers.delete(handler);
      }
    }
  }, []);

  const on = useCallback((messageType: string, handler: MessageHandler) => {
    const messageHandlers = handlers.current.get(messageType) || new Set();
    messageHandlers.add(handler);
    handlers.current.set(messageType, messageHandlers);

    return () => {
      const handlers = handlers.current.get(messageType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  return { connected, subscribe, unsubscribe, on };
}
