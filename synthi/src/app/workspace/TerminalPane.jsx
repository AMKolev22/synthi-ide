'use client';
import React, { useEffect, useRef } from 'react';

export default function TerminalPane() {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return;
    initializedRef.current = true;

    let term;
    let fitAddon;
    let ws;

    const init = async () => {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');

      term = new Terminal({
        convertEol: true,
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

      ws = new WebSocket('ws://lumpish-undevoutly-sonja.ngrok-free.dev');
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
        term.write('\r\n\x1b[31mWebSocket connection error. Terminal unavailable.\x1b[0m\r\n');
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
      
      let isResizing = false;
      let resizeTimeout = null;

      // Send user input to backend
      term.onData((data) => {
        // Don't send data while resizing
        if (isResizing) return;

        if (ws.readyState === WebSocket.OPEN) {
          // Convert string to Uint8Array for binary transmission
          const encoder = new TextEncoder();
          ws.send(encoder.encode(data));
        }
      });

      // Debounced resize handler
      const handleResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (fitAddon && term && containerRef.current) {
            try {
              fitAddon.fit();
              const { cols, rows } = term;
              console.log(`Terminal resized: ${cols}x${rows}`);
            } catch (e) {
              console.error('Resize error:', e);
            }
          }
        }, 100); // 100ms debounce
      };

      const resizeObserver = new ResizeObserver(() => {
        // Use requestAnimationFrame to batch resize events
        requestAnimationFrame(() => {
          handleResize();
        });
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', handleResize);
      
      // Listen for resize events to disable input only while dragging
      const handleResizeStart = () => {
        isResizing = true;
      };
      const handleResizeEnd = () => {
        isResizing = false;
      };

      document.addEventListener('pointerdown', (e) => {
        if (e.target?.closest('[data-resizable-handle]')) {
          handleResizeStart();
        }
      });
      document.addEventListener('pointerup', handleResizeEnd);
      document.addEventListener('pointercancel', handleResizeEnd);

      // Initial fit after a short delay to ensure DOM is ready
      setTimeout(() => handleResize(), 100);

      // Store for cleanup
      termRef.current = { term, fitAddon, handleResize, resizeObserver };
    };

    init();

    return () => {
      if (termRef.current) {
        const { term, handleResize, resizeObserver } = termRef.current;
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) resizeObserver.disconnect();
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