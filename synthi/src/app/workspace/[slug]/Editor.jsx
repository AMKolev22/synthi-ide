'use client';
import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Folder, FileText, Circle, Save } from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

const TerminalManagerDyn = dynamic(() => import('../TerminalManager.jsx'), { 
  ssr: false 
});
const EditorPanel = ({ 
  activeFile, 
  code, 
  setCode, 
  position, 
  setPosition, 
  breadcrumb, 
  handleFileSelect, 
  onRun, 
  showTerminal, 
  setShowTerminal,
  isUnsaved,
  onSave
}) => {
  const [editorInstance, setEditorInstance] = useState(null);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeFile && isUnsaved) {
          onSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, isUnsaved, onSave]);

  return (
    <ResizablePanel defaultSize={76} minSize={20}>
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={70} minSize={20}>
          <div className="h-full flex flex-col bg-[#1e1e1e]">
            <div className="px-3 py-2 text-sm border-b border-[#2a2a2a] bg-[#252526] flex justify-between items-center gap-1 overflow-x-auto whitespace-nowrap">
              <div className='flex flex-row items-center gap-2'>
                {breadcrumb && breadcrumb.length > 0 ? (
                  breadcrumb.map((node, idx) => (
                    <span key={`${node.name}-${idx}`} className="flex items-center">
                      {node.type === 'folder' ? <Folder className="w-3.5 h-3.5 mr-1 text-gray-400" /> : <FileText className="w-3.5 h-3.5 mr-1 text-gray-400" />}
                      {node.type === 'folder' ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className={`text-xs ${idx === breadcrumb.length - 1 ? 'text-gray-100' : 'text-gray-300'} hover:text-gray-100`}>{node.name}</button>
                          </PopoverTrigger>
                          <PopoverContent className="min-w-[200px] bg-[#252526] border border-[#2a2a2a]">
                            <div className="text-xs text-gray-300 mb-2">{node.name}</div>
                            <div className="space-y-1">
                              {(node.children || []).map((child, i) => (
                                <div key={`${child.name}-${i}`} className="flex items-center cursor-pointer hover:bg-[#2f2f2f] rounded px-2 py-1" onClick={() => child.type === 'file' ? handleFileSelect(child) : null}>
                                  <span className="mr-2">{child.type === 'folder' ? <Folder className="w-3.5 h-3.5 text-gray-400" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}</span>
                                  <span className="text-xs text-gray-200">{child.name}</span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className={`text-xs ${idx === breadcrumb.length - 1 ? 'text-gray-100' : 'text-gray-400'}`}>{node.name}</span>
                      )}
                      {idx < breadcrumb.length - 1 && <span className="px-1 text-gray-500">›</span>}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No file selected</span>
                )}
                {/* Unsaved indicator */}
                {isUnsaved && (
                  <Circle className="w-3 h-3 text-orange-400 fill-orange-400" />
                )}
                {/* Save button */}
                {activeFile && (
                  <button
                    onClick={onSave}
                    className="p-1 hover:bg-[#2f2f2f] rounded transition-colors"
                    title="Save file (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5 text-gray-400 hover:text-gray-200" />
                  </button>
                )}
              </div>
              <div className='flex flex-row gap-2'>
                <p className='text-xs text-gray-400'>Ln: {position.lineNumber}</p>
                <p className='text-xs text-gray-400'>Col: {position.column}</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="h-full">
                    <Editor
                      key={activeFile ? activeFile.name : 'no-file'}
                      height="100%"
                      value={code}
                      language={activeFile ? activeFile.language : 'plaintext'}
                      onChange={setCode}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        lineNumbers: true,
                        scrollbar: {
                          verticalHasArrows: true,
                          horizontalHasArrows: true,
                        }
                      }}
                      onMount={editor => {
                        setEditorInstance(editor);
                        editor.onDidChangeCursorPosition(e => {
                          setPosition({
                            lineNumber: e.position.lineNumber,
                            column: e.position.column
                          });
                        });
                      }}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => onRun()}>Run File</ContextMenuItem>
                  <ContextMenuItem onClick={() => console.log('Format document')}>Format Document</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => console.log('Find in file')}>Find…</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          </div>
        </ResizablePanel>
        {showTerminal && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={15}>
              <TerminalManagerDyn visible={true} onCloseAll={() => setShowTerminal(false)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </ResizablePanel>
  );
};

export default EditorPanel;