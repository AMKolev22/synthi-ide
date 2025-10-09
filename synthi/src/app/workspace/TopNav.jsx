'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Play, TerminalSquare, Settings } from 'lucide-react';

export default function TopNav({ title = 'Synthi', onRun, onToggleTerminal }) {
  return (
    <div className="w-full h-10 flex items-center justify-between border-b bg-background px-3">
      <div className="text-sm font-medium truncate">{title}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleTerminal}>
          <TerminalSquare className="w-4 h-4 mr-2" /> Terminal
        </Button>
        <Button variant="outline" size="sm" onClick={onRun}>
          <Play className="w-4 h-4 mr-2" /> Run
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[200px]">
            <div className="text-xs text-muted-foreground mb-2">Quick actions</div>
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:underline" onClick={onRun}>Run current file</button>
              <button className="text-left hover:underline" onClick={onToggleTerminal}>Toggle terminal</button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}


