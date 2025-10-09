'use client';
import Editor from '@monaco-editor/react';
import { useEffect, useState, useCallback } from 'react';
import TopNav from '../TopNav.jsx';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Folder as LFolderIcon, FolderIcon, Folder, FolderOpen, FileText, FileCode2, FileJson, FileType } from 'lucide-react';
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

const deepCloneFiles = (files) => {
  return JSON.parse(JSON.stringify(files));
};


const INITIAL_FILES_DATA = [
  {
    name: 'src', type: 'folder', children: [
      {
        name: 'main.cpp', type: 'file', language: 'cpp', content:
          "#include \"core/Logger.h\"\n\n" +
          "int main() {\n" +
          "    Logger::log(\"Application started.\");\n" +
          "    // Main application logic here\n" +
          "    Logger::log(\"Application finished successfully.\");\n" +
          "    return 0;\n" +
          "}"
      },
      {
        name: 'utility.cpp', type: 'file', language: 'cpp', content:
          "#include \"../include/utility.h\"\n\n" +
          "int add(int a, int b) {\n" +
          "    return a + b;\n" +
          "}"
      },
    ]
  },
  {
    name: 'include', type: 'folder', children: [
      {
        name: 'utility.h', type: 'file', language: 'cpp', content:
          "#pragma once\n\n" +
          "int add(int a, int b);\n"
      },
      {
        name: 'core', type: 'folder', children: [
          {
            name: 'Logger.h', type: 'file', language: 'cpp', content:
              "#pragma once\n#include <iostream>\n\n" +
              "class Logger {\n" +
              "public:\n" +
              "    static void log(const std::string& message) {\n" +
              "        std::cout << \"[LOG] \" << message << std::endl;\n" +
              "    }\n" +
              "};\n"
          }
        ]
      }
    ]
  },
  {
    name: 'build', type: 'folder', children: [
      { name: '.gitkeep', type: 'file', language: 'plaintext', content: "Placeholder for build output" }
    ]
  },
  {
    name: 'CMakeLists.txt', type: 'file', language: 'cmake', content:
      "cmake_minimum_required(VERSION 3.10)\n" +
      "project(SimpleCppProject)\n\n" +
      "set(CMAKE_CXX_STANDARD 17)\n\n" +
      "include_directories(include)\n\n" +
      "add_executable(app src/main.cpp src/utility.cpp)\n"
  },
  {
    name: 'README.md', type: 'file', language: 'markdown', content:
      "# Simple C++ Project\n\n" +
      "A basic C++ project structure using CMake.\n"
  }
];

const ChevronIcon = ({ isOpen, isSelected }) => (
  <svg
    className={`w-3 h-3 mr-1 transition-transform duration-200 ${isSelected ? 'text-white' : 'text-gray-400'} ${isOpen ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const FileIcon = ({ node, isSelected }) => {
  if (node.type === 'folder') {
    return node.__open ? (
      <FolderOpen className={`w-4 h-4 mr-2 ${isSelected ? 'text-gray-100' : 'text-gray-300'}`} />
    ) : (
      <FolderIcon className={`w-4 h-4 mr-2 ${isSelected ? 'text-gray-100' : 'text-gray-300'}`} />
    );
  }
  const name = node.name.toLowerCase();
  if (name.endsWith('.json')) return <FileJson className={`w-4 h-4 mr-2 ${isSelected ? 'text-green-300' : 'text-green-400'}`} />;
  if (name.endsWith('.md')) return <FileText className={`w-4 h-4 mr-2 ${isSelected ? 'text-blue-300' : 'text-blue-400'}`} />;
  if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode2 className={`w-4 h-4 mr-2 ${isSelected ? 'text-yellow-200' : 'text-yellow-300'}`} />;
  if (name.endsWith('.cpp') || name.endsWith('.h') || name.endsWith('.hpp')) return <FileType className={`w-4 h-4 mr-2 ${isSelected ? 'text-cyan-200' : 'text-cyan-300'}`} />;
  return <FileText className={`w-4 h-4 mr-2 ${isSelected ? 'text-gray-200' : 'text-gray-400'}`} />;
};

const FileItem = ({ item, level = 0, onFileSelect, activeFile, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingStyle = { paddingLeft: `${level * 16 + 16}px` };

  const isSelected = activeFile && activeFile.name === item.name && activeFile.language === item.language;

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
      item.__open = !isOpen;
    } else {
      onFileSelect(item);
    }
  };

  return (
    <>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer transition duration-200 rounded-sm ${isSelected ? 'bg-gray-600 text-white' : 'hover:bg-gray-700'}`}
        style={paddingStyle}
        onClick={handleClick}
        data-node-name={item.name}
      >
        {item.type === 'folder' && <ChevronIcon isOpen={isOpen} isSelected={isSelected} />}
        <FileIcon node={item} isSelected={isSelected} />
        <span className={`text-sm truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{item.name}</span>
      </div>
      {item.type === 'folder' && isOpen && item.children && (
        <div className="flex flex-col">
          {item.children.map((child, index) => (
            <FileItem
              key={index}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              activeFile={activeFile}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </>
  );
};

const FileTreeView = ({ files, onFileSelect, activeFile, onAction }) => {
  const [contextTarget, setContextTarget] = useState(null);
  const findNodeByName = (nodes, name) => {
    const stack = [...nodes];
    while (stack.length) {
      const n = stack.shift();
      if (n.name === name) return n;
      if (n.type === 'folder' && n.children) stack.push(...n.children);
    }
    return null;
  };

  const onOpenMenu = (e) => {
    const el = e?.target?.closest('[data-node-name]');
    if (el) {
      const name = el.getAttribute('data-node-name');
      setContextTarget(findNodeByName(files, name));
    } else {
      setContextTarget(null);
    }
  };

  return (
    <ContextMenu onOpenAutoFocus={onOpenMenu} onOpenChange={(open) => { if (!open) setContextTarget(null); }}>
      <ContextMenuTrigger asChild>
        <div className="w-full h-full bg-gray-800 text-white flex flex-col overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <div className="flex items-center">
              <span className="text-sm text-gray-200">Project</span>
            </div>
          </div>
          <div className="flex-grow">
            {files.map((item, index) => (
              <FileItem key={index} item={item} onFileSelect={onFileSelect} activeFile={activeFile} onAction={onAction} />
            ))}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {contextTarget ? (
          contextTarget.type === 'folder' ? (
            <>
              <ContextMenuItem onClick={() => onAction('new-file', contextTarget)}>New File</ContextMenuItem>
              <ContextMenuItem onClick={() => onAction('new-folder', contextTarget)}>New Folder</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onAction('rename', contextTarget)}>Rename</ContextMenuItem>
              <ContextMenuItem onClick={() => onAction('delete', contextTarget)}>Delete</ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onClick={() => onAction('open', contextTarget)}>Open</ContextMenuItem>
              <ContextMenuItem onClick={() => onAction('reveal-in-tree', contextTarget)}>Reveal in Tree</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onAction('rename', contextTarget)}>Rename</ContextMenuItem>
              <ContextMenuItem onClick={() => onAction('delete', contextTarget)}>Delete</ContextMenuItem>
            </>
          )
        ) : (
          <>
            <ContextMenuItem onClick={() => onAction('new-file-root', null)}>New File</ContextMenuItem>
            <ContextMenuItem onClick={() => onAction('new-folder-root', null)}>New Folder</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default function EditorPage() {
  const [files, setFiles] = useState(deepCloneFiles(INITIAL_FILES_DATA));
  const [editorInstance, setEditorInstance] = useState(null);
  const [position, setPosition] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('Synthi Workspace');
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const TerminalPane = dynamic(() => import('../TerminalPane.jsx'), { ssr: false });
  const TerminalManagerDyn = dynamic(() => import('../TerminalManager.jsx'), { ssr: false });

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
    // Hook up with actual file system logic later
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200">
      <TopNav title={title} onRun={onRun} onToggleTerminal={() => setShowTerminal(v => !v)} />
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={24} minSize={1} maxSize={35} className="border-r border-[#2a2a2a] bg-[#252526]">
          <FileTreeView files={files} onFileSelect={handleFileSelect} activeFile={activeFile} onAction={handleTreeAction} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={76} minSize={20}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={70} minSize={20}>
              <div className="h-full flex flex-col bg-[#1e1e1e]">
                <div className="px-3 py-2 text-sm border-b border-[#2a2a2a] bg-[#252526] flex justify-between items-center gap-1 overflow-x-auto whitespace-nowrap">
                  <div className='flex flex-row'>
                    {breadcrumb && breadcrumb.length > 0 ? (
                      breadcrumb.map((node, idx) => (
                        <span key={`${node.name}-${idx}`} className="flex items-center">
                          {node.type === 'folder' ? <LFolderIcon className="w-3.5 h-3.5 mr-1 text-gray-400" /> : <FileText className="w-3.5 h-3.5 mr-1 text-gray-400" />}
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
      </ResizablePanelGroup>
    </div>
  );
}