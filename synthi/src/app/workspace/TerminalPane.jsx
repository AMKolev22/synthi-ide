'use client';

import React, { useEffect, useRef } from 'react';

export default function TerminalPane() {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    let term;
    let fitAddon;
    let webLinksAddon;
    let dispose;

    const init = async () => {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('xterm-addon-web-links');

      term = new Terminal({
        convertEol: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#aeafad',
          selection: '#264f78',
        },
      });
      fitAddon = new FitAddon();
      webLinksAddon = new WebLinksAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(containerRef.current);
      fitAddon.fit();
      term.writeln('Welcome to Synthi Terminal');
      term.write('\r\nPS C:\\> ');

      term.onData((data) => {
        // Basic local echo and simple prompt handling
        if (data === '\r') {
          term.write('\r\nPS C:\\> ');
          return;
        }
        if (data === '\u007F' || data === '\b') { // Backspace
          // Move cursor back and clear char
          term.write('\b \b');
          return;
        }
        term.write(data);
      });

      const onResize = () => fitAddon.fit();
      window.addEventListener('resize', onResize);
      dispose = () => window.removeEventListener('resize', onResize);

      // Observe container resize to avoid flashing/recreation
      if (containerRef.current && 'ResizeObserver' in window) {
        resizeObserverRef.current = new ResizeObserver(() => {
          fitAddon.fit();
        });
        resizeObserverRef.current.observe(containerRef.current);
      }

      termRef.current = term;
    };

    init();

    return () => {
      if (resizeObserverRef.current) {
        try { resizeObserverRef.current.disconnect(); } catch {}
      }
      if (dispose) dispose();
      if (term) term.dispose();
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}


