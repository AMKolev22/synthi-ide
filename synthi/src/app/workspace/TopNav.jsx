'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Play, TerminalSquare, Settings, Search } from 'lucide-react';

export default function TopNav({ title = 'Synthi', onRun, onToggleTerminal }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  return (
    <div className="w-full h-10 flex items-center justify-between border-b border-[#545454] bg-[#1e1e1e] px-3 select-none">
      {/* ---------- Left side: Menus ---------- */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="border-[#545454] bg-[#1e1e1e] hover:bg-[#262626] text-emerald-400 hover:text-indigo-50"
              variant="outline"
              size="sm"
            >
              File
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[200px]">
            <div className="text-xs text-muted-foreground mb-2">File actions</div>
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:underline" onClick={onRun}>
                Run current file
              </button>
              <button
                className="text-left hover:underline"
                onClick={onToggleTerminal}
              >
                Toggle terminal
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="border-[#545454] bg-[#1e1e1e] hover:bg-[#262626] text-emerald-400 hover:text-indigo-50"
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[200px]">
            <div className="text-xs text-muted-foreground mb-2">Edit actions</div>
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:underline">Undo</button>
              <button className="text-left hover:underline">Redo</button>
              <button className="text-left hover:underline">Copy</button>
              <button className="text-left hover:underline">Paste</button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="border-[#545454] bg-[#1e1e1e] hover:bg-[#262626] text-emerald-400 hover:text-indigo-50"
              variant="outline"
              size="sm"
            >
              Selection
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[200px]">
            <div className="text-xs text-muted-foreground mb-2">
              Selection actions
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:underline">
                Select all
              </button>
              <button className="text-left hover:underline">
                Expand selection
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ---------- Middle: Search bar with title ---------- */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-[50%] max-w-md">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            placeholder={searchOpen ? 'Search...' : title}
            className="w-full bg-[#2a2a2a] text-sm text-gray-100 rounded-md pl-8 pr-3 py-1.5 outline-none border border-transparent focus:border-indigo-500 transition-all duration-150"
          />
        </div>
      </div>
      {/* ---------- Right side: Quick actions ---------- */}
      <div className="flex items-center gap-2">
        <Button
          className="border-[#545454] bg-[#1e1e1e] hover:bg-[#262626] text-emerald-400 hover:text-indigo-50"
          variant="outline"
          size="sm"
          onClick={onToggleTerminal}
        >
          <TerminalSquare className="w-4 h-4 mr-0" /> Terminal
        </Button>
        <Button
          className="border-[#545454] bg-[#1e1e1e] hover:bg-[#262626] text-emerald-400 hover:text-indigo-50"
          variant="outline"
          size="sm"
          onClick={onRun}
        >
          <Play className="w-4 h-4 mr-0" /> Run
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="bg-[#1e1e1e] hover:bg-[#262626] hover:text-indigo-1"
              variant="ghost"
              size="sm"
            >
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


