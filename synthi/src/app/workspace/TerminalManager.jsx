'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { SplitSquareHorizontal, Plus, Trash2, X, Dock } from 'lucide-react';

const TerminalPane = dynamic(() => import('./TerminalPane.jsx'), { ssr: false });

export default function TerminalManager({ visible, onCloseAll }) {
  const [terminals, setTerminals] = useState([{ id: 'term-1', label: 'Terminal 1', split: false }]);
  const [activeId, setActiveId] = useState('term-1');
  const dragRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    // Ensure at least one terminal exists
    if (terminals.length === 0) {
      setTerminals([{ id: 'term-1', label: 'Terminal 1', split: false }]);
      setActiveId('term-1');
    }
  }, [visible]);

  const addTerminal = () => {
    const nextIndex = terminals.length + 1;
    const id = `term-${Date.now()}`;
    const newTerm = { id, label: `Terminal ${nextIndex}`, split: false };
    setTerminals(prev => [...prev, newTerm]);
    setActiveId(id);
  };

  const toggleSplit = () => {
    setTerminals(prev => prev.map(t => t.id === activeId ? { ...t, split: !t.split } : t));
  };

  const closeActive = () => {
    setTerminals(prev => {
      const idx = prev.findIndex(t => t.id === activeId);
      if (idx === -1) return prev;
      const next = prev.filter(t => t.id !== activeId);
      if (next.length > 0) {
        const newIdx = Math.max(0, idx - 1);
        setActiveId(next[newIdx].id);
      }
      return next;
    });
  };

  const closeById = (id) => {
    setTerminals(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      if (id === activeId && next.length > 0) {
        const newIdx = Math.max(0, idx - 1);
        setActiveId(next[newIdx].id);
      }
      return next;
    });
  };

  const handleCloseAll = () => {
    setTerminals([]);
    setActiveId(undefined);
    if (onCloseAll) onCloseAll();
  };

  const header = (
    <div className="h-9 flex items-center justify-between px-2 border-b border-[#2a2a2a] bg-[#252526] select-none" ref={dragRef}>
      <div className="flex items-center gap-2 overflow-x-auto">
        {terminals.map(t => (
          <div key={t.id} className={`flex items-center gap-1 px-2 py-1 rounded ${t.id === activeId ? 'bg-[#1e1e1e] text-gray-100' : 'text-gray-300 hover:bg-[#2f2f2f]'}`} onClick={() => setActiveId(t.id)}>
            <span className="text-xs">{t.label}</span>
            <button className="p-0.5 hover:text-red-400" onClick={(e) => { e.stopPropagation(); closeById(t.id); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button className="ml-1 text-gray-300 hover:text-gray-100" onClick={addTerminal} title="New Terminal">
          <Plus className="w-4 h-4" />
        </button>
        <button className="text-gray-300 hover:text-gray-100" onClick={toggleSplit} title="Split Terminal">
          <SplitSquareHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-gray-300 hover:text-red-400" onClick={handleCloseAll} title="Close All">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Removed dragging logic per request

  if (!visible) return null;
  const body = (
    <div className="bg-[#1e1e1e] flex-1 overflow-hidden">
      {terminals.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-gray-400">No terminals</div>
      ) : (
        terminals.find(t => t.id === activeId) && (
          <div className="h-full w-full">
            <TerminalPane key={activeId} />
          </div>
        )
      )}
    </div>
  );

  return (
    <div className="border-t border-[#2a2a2a] bg-[#1e1e1e] h-full flex flex-col">
      {header}
      {body}
    </div>
  );
}


