"use client";

import { useEffect, useState } from 'react';
import { Search, TerminalSquare, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function TopNav({ title = 'Synthi', onRun, onToggleTerminal }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-[#2a2a2a] bg-[#1e1e1e]">
      {/* Left: file actions */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-[#4b4b4b] bg-[#262626] hover:bg-[#2e2e2e] hover:border-emerald-500 hover:text-emerald-400 text-gray-200 transition-colors"
            >
              Edit
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px]">
            <div className="text-xs text-muted-foreground mb-2">Edit</div>
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
              variant="outline" 
              size="sm" 
              className="h-8 border-[#4b4b4b] bg-[#262626] hover:bg-[#2e2e2e] hover:border-emerald-500 hover:text-emerald-400 text-gray-200 transition-colors"
            >
              Selection
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px]">
            <div className="text-xs text-muted-foreground mb-2">Selection</div>
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:underline">Select all</button>
              <button className="text-left hover:underline">Expand selection</button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Middle: centered search bar */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-[48%] max-w-xl">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            placeholder={searchOpen ? "Search files, symbols, commands…" : title}
            className="w-full bg-[#262626] text-sm text-gray-100 rounded-md pl-8 pr-3 py-1.5 outline-none border border-[#3b3b3b] focus:border-emerald-500 transition-all duration-150"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 border-[#4b4b4b] bg-[#262626] hover:bg-[#2e2e2e] hover:border-emerald-500 hover:text-emerald-400 text-gray-200 transition-colors" 
          onClick={onToggleTerminal}
        >
          <TerminalSquare className="w-4 h-4 mr-1.5" /> Terminal
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 border-[#4b4b4b] bg-[#262626] hover:bg-[#2e2e2e] hover:border-emerald-500 hover:text-emerald-400 text-gray-200 transition-colors" 
          onClick={onRun}
        >
          <Play className="w-4 h-4 mr-1.5" /> Run
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-gray-200 hover:bg-[#2a2a2a] hover:text-emerald-400 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px]">
            <div className="text-xs text-muted-foreground mb-2">Quick actions</div>
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:underline" onClick={onRun}>
                Run current file
              </button>
              <button className="text-left hover:underline" onClick={onToggleTerminal}>
                Toggle terminal
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}