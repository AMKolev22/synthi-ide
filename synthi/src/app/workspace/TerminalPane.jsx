'use client';
import React, { useEffect, useRef } from 'react';

export default function TerminalPane() {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let term;
    let fitAddon;
    let ws;

    const init = async () => {
      // Prevent multiple initializations
      if (initializedRef.current) return;
      initializedRef.current = true;

      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');

      term = new Terminal({
        convertEol: false,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
        cursorBlink: true,
        allowTransparency: false,
        cols: 80,
        rows: 24,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();

      // Open WebSocket to Rust backend (removed /terminal path)
      ws = new WebSocket('ws://192.168.100.104:8080');
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer'; // Handle binary data

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Optionally send initial terminal size
        const { cols, rows } = term;
        console.log(`Terminal size: ${cols}x${rows}`);
      };

      // Display backend output in terminal
      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Convert ArrayBuffer to Uint8Array to string
          const uint8Array = new Uint8Array(event.data);
          term.write(uint8Array);
        } else if (typeof event.data === 'string') {
          term.write(event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket readyState:', ws.readyState);
        console.error('WebSocket url:', ws.url);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed');
        console.log('Close code:', event.code);
        console.log('Close reason:', event.reason);
        console.log('Was clean:', event.wasClean);
      };
      // Send user input to backend
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Convert string to Uint8Array for binary transmission
          const encoder = new TextEncoder();
          ws.send(encoder.encode(data));
        }
      });

      // Handle terminal resize
      const handleResize = () => {
        if (fitAddon && term) {
          fitAddon.fit();
          // Optionally send new size to backend
          const { cols, rows } = term;
          console.log(`Terminal resized: ${cols}x${rows}`);
        }
      };

      // Use ResizeObserver for better resize detection
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', handleResize);

      // Store for cleanup
      termRef.current = { term, fitAddon, handleResize, resizeObserver };
    };

    init();

    return () => {
      initializedRef.current = false;
      if (termRef.current) {
        const { term, handleResize, resizeObserver } = termRef.current;
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (term) term.dispose();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}