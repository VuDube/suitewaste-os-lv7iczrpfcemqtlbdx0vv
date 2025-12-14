import { useState, useEffect, useCallback, useRef } from 'react';
type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'mock';
export const useSerialScale = () => {
  const [status, setStatus] = useState<ScaleStatus>('disconnected');
  const [weight, setWeight] = useState<number>(0);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef<boolean>(false);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (error) {
        console.warn('Error cancelling reader:', error);
      } finally {
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
    }
    if (portRef.current?.writable) {
        try {
            await portRef.current.writable.getWriter().close();
        } catch (error) {
            console.warn('Error closing writer:', error);
        }
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (error) {
        console.error('Failed to close serial port:', error);
      } finally {
        portRef.current = null;
      }
    }
    setStatus('disconnected');
    setWeight(0);
    console.log('Serial port disconnected.');
  }, []);
  const readLoop = useCallback(async () => {
    const decoder = new TextDecoder();
    let buffer = '';
    while (portRef.current?.readable && keepReadingRef.current) {
      try {
        readerRef.current = portRef.current.readable.getReader();
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const match = line.match(/ST,GS,\s*\+\s*([0-9.]+)/);
            if (match && match[1]) {
              setWeight(parseFloat(match[1]));
            }
          }
        }
        readerRef.current.releaseLock();
        readerRef.current = null;
      } catch (error) {
        console.error('Read loop error:', error);
        setStatus('error');
        break;
      }
    }
  }, []);
  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      console.warn('Web Serial API not supported. Using mock data.');
      setStatus('mock');
      mockIntervalRef.current = setInterval(() => {
        setWeight(prev => parseFloat((prev + Math.random() * 2 - 1).toFixed(2)));
      }, 1000);
      return;
    }
    if (portRef.current) {
      await disconnect();
    }
    try {
      setStatus('connecting');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      keepReadingRef.current = true;
      setStatus('connected');
      console.log('Serial port connected.');
      readLoop();
    } catch (error) {
      console.error('Failed to connect to serial port:', error);
      setStatus('error');
    }
  }, [disconnect, readLoop]);
  useEffect(() => {
    return () => {
      if (portRef.current) {
        disconnect();
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
      }
    };
  }, [disconnect]);
  return { weight, status, connect, disconnect };
};