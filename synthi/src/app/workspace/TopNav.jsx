"use client";

import { useEffect, useState } from 'react';
import { Search, TerminalSquare, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { toggleAutoSave, selectAutoSaveEnabled } from '@/redux/uiSlice';

export default function TopNav({ title = 'Synthi', onRun, onToggleTerminal }) {
  const dispatch = useAppDispatch();
  const autoSaveEnabled = useAppSelector(selectAutoSaveEnabled);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-[#2a2a2a] bg-[#1e1e1e]">
      <div className="text-lg font-medium truncate w-16 text-emerald-400">Synthi</div>
      {/* Left: file actions */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-[#4b4b4b] bg-[#262626] hover:bg-[#2e2e2e] hover:border-emerald-500 hover:text-emerald-400 text-gray-200 transition-colors"
            >
              File
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px]">
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:text-emerald-400">New File</button>
              <button className="text-left hover:text-emerald-400">Open File</button>
              <button className="text-left hover:text-emerald-400">Open Folder</button>
              <button className="text-left hover:text-emerald-400">Save</button>
              <button className="text-left hover:text-emerald-400">Save As</button>
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
              Edit
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px]">
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:text-emerald-400">Undo</button>
              <button className="text-left hover:text-emerald-400">Redo</button>
              <button className="text-left hover:text-emerald-400">Copy</button>
              <button className="text-left hover:text-emerald-400">Paste</button>
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
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:text-emerald-400">Select All</button>
              <button className="text-left hover:text-emerald-400">Expand Selection</button>
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
              View
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[220px]">
            <div className="flex flex-col gap-1 text-sm">
              <button className="text-left hover:text-emerald-400">Open View...</button>
              <button className="text-left hover:text-emerald-400">Appearence</button>
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
          <PopoverContent className="min-w-[220px] bg-[#262626] border-[#3a3a3a]">
            <div className="text-xs text-gray-400 mb-2 font-semibold">Settings</div>
            <div className="flex flex-col gap-2">
              {/* Auto-save toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm ">Auto Save</span>
                <button
                  onClick={() => dispatch(toggleAutoSave())}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    autoSaveEnabled ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSaveEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="border-t border-[#3a3a3a] my-1"></div>
              <div className="text-xs text-gray-400 mb-1">Quick actions</div>
              <button className="text-left text-sm hover:text-emerald-400 transition-colors" onClick={onRun}>
                Run current file
              </button>
              <button className="text-left text-sm hover:text-emerald-400 transition-colors" onClick={onToggleTerminal}>
                Toggle terminal
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}