'use client';
import Editor from '@monaco-editor/react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import TopNav from '../TopNav.jsx';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Folder, FileText } from 'lucide-react';
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
import FileTreeView from "./FileTree.jsx"
import { INITIAL_FILES_DATA } from './initial.js';

const deepCloneFiles = (files) => {
  return JSON.parse(JSON.stringify(files));
};

export default function EditorPage() {
  const [files, setFiles] = useState(deepCloneFiles(INITIAL_FILES_DATA));
  const [editorInstance, setEditorInstance] = useState(null);
  const [position, setPosition] = useState({ lineNumber: 0, column: 0 });
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('Synthi Workspace');
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [treeOnRight, setTreeOnRight] = useState(false);
  const [panelGroupKey, setPanelGroupKey] = useState(0);
  const TerminalManagerDyn = useMemo(
    () => dynamic(() => import('../TerminalManager.jsx'), { ssr: false }),
    []
  );

  const findPathToTarget = useCallback((nodes, target, path = []) => {
    for (const node of nodes) {
      const currentPath = [...path, node];
      if (node.type === 'file' && node.name === target.name && node.language === target.language) {
        return currentPath;
      }
      if (node.type === 'folder' && node.children) {
        const result = findPathToTarget(node.children, target, currentPath);
        if (result) return result;
      }
    }
    return null;
  }, []);

  const handleFileSelect = (file) => {
    if (activeFile) {
      const updatedFiles = findFileAndUpdate(files, activeFile, code);
      setFiles(updatedFiles);
    }

    setActiveFile(file);
    setCode(file.content || '');
    setTitle(file.name);
    const pathArr = findPathToTarget(files, file) || [];
    setBreadcrumb(pathArr);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode || '');
  };

  useEffect(() => {
    if (!activeFile && files.length > 0) {
      const defaultFile = files[0]?.children?.[0]?.children?.[0] || files[0];
      setActiveFile(defaultFile);
      setCode(defaultFile?.content || '');
      const pathArr = defaultFile ? (Array.isArray(files) ? [files[0], files[0]?.children?.[0], defaultFile].filter(Boolean) : []) : [];
      setBreadcrumb(pathArr);
    }
  }, [files, activeFile]);

  const findFileAndUpdate = (currentFiles, targetFile, newContent) => {
    return currentFiles.map(item => {
      if (item.type === 'file' && item.name === targetFile.name && item.language === targetFile.language) {
        return { ...item, content: newContent };
      }
      if (item.type === 'folder' && item.children) {
        return { ...item, children: findFileAndUpdate(item.children, targetFile, newContent) };
      }
      return item;
    });
  };

  const onRun = () => {
    console.log(files);
  }

  const handleTreeAction = useCallback((action, target) => {
    console.log('Tree action:', action, target);
  }, []);

  const toggleTreeOrientation = () => {
    setTreeOnRight(prev => !prev);
    setPanelGroupKey(prev => prev + 1); // Force remount
  };

  const FileTreePanel = (
    <ResizablePanel defaultSize={24} minSize={1} maxSize={35} className={`${treeOnRight ? 'border-l' : 'border-r'} border-[#545454] bg-[#252526]`}>
      <FileTreeView 
        files={files}
        onFileSelect={handleFileSelect}
        activeFile={activeFile}
        onAction={handleTreeAction}
        onToggleOrientation={toggleTreeOrientation}
        isRightSide={treeOnRight}
      />
    </ResizablePanel>
  );

  const EditorPanel = (
    <ResizablePanel defaultSize={76} minSize={20}>
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={70} minSize={20}>
          <div className="h-full flex flex-col bg-[#1e1e1e]">
            <div className="px-3 py-2 text-sm border-b border-[#2a2a2a] bg-[#252526] flex justify-between items-center gap-1 overflow-x-auto whitespace-nowrap">
              <div className='flex flex-row'>
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
                      onChange={handleCodeChange}
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

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200">
      <TopNav title={title} onRun={onRun} onToggleTerminal={() => setShowTerminal(v => !v)} />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 min-h-0"
        key={panelGroupKey} // <-- Add this line
      >
        {treeOnRight ? (
          <>
            {EditorPanel}
            <ResizableHandle withHandle />
            {FileTreePanel}
          </>
        ) : (
          <>
            {FileTreePanel}
            <ResizableHandle withHandle />
            {EditorPanel}
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}