import { useState, useRef, useCallback, useEffect } from 'react';
import { getAuthToken } from '../lib/api.js';

/**
 * Reusable hook for streaming Server-Sent Events (SSE) via fetch ReadableStream.
 * Supports GET and POST with JSON payloads, Authorization headers, and active AbortController.
 */
export function useAiStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (url, { method = 'POST', body, onToken, onDone, onError } = {}) => {
      // Cancel any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);
      setStreamedText('');
      setError(null);

      try {
        const token = getAuthToken();
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const fullUrl = url.startsWith('http')
          ? url
          : `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;

        const res = await fetch(fullUrl, {
          method,
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!res.ok) {
          let msg = `HTTP error ${res.status}`;
          try {
            const errJson = await res.json();
            msg = errJson.message || errJson.error || msg;
          } catch {
            const txt = await res.text().catch(() => '');
            if (txt) msg = txt;
          }
          throw new Error(msg);
        }

        if (!res.body) {
          throw new Error('ReadableStream not supported by this browser environment');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (!part.trim()) continue;
            const lines = part.split(/\r?\n/);
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                const val = line.slice(5).trim();
                dataStr = dataStr ? `${dataStr}\n${val}` : val;
              }
            }

            if (dataStr) {
              let parsedData;
              try {
                parsedData = JSON.parse(dataStr);
              } catch {
                parsedData = dataStr;
              }

              if (eventType === 'token') {
                const tokenText =
                  typeof parsedData === 'object' && parsedData?.text !== undefined
                    ? parsedData.text
                    : String(parsedData);
                accumulated += tokenText;
                setStreamedText(accumulated);
                onToken?.(tokenText, accumulated);
              } else if (eventType === 'done') {
                setIsStreaming(false);
                onDone?.(parsedData, accumulated);
                return parsedData;
              } else if (eventType === 'error') {
                const errMsg =
                  typeof parsedData === 'object'
                    ? parsedData?.message || 'Streaming error'
                    : String(parsedData);
                throw new Error(errMsg);
              }
            }
          }
        }

        setIsStreaming(false);
      } catch (err) {
        if (err.name === 'AbortError') {
          setIsStreaming(false);
          return;
        }
        setIsStreaming(false);
        const msg = err.message || 'Stream connection failed';
        setError(msg);
        onError?.(err);
        throw err;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isStreaming,
    streamedText,
    error,
    startStream,
    stopStream,
    setError,
  };
}

export default useAiStream;
