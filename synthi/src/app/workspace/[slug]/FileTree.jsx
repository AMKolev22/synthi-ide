// src/app/FileTree.jsx
"use client"
import { useState, useRef, useEffect } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import FileItem from './FileItem';

const FileTreeView = ({ 
    files, 
    onFileSelect, 
    activeFile, 
    onAction, 
    onToggleOrientation, 
    isRightSide, 
    uiActionState,
    setUiActionName,
    onCreateFile,
    onCreateFolder,
    onRename 
}) => {
    const inputRef = useRef(null);
    const [contextTarget, setContextTarget] = useState(null);

    const { mode, target } = uiActionState;
    const isCreatingAtRoot = mode.startsWith('create') && !target;

    const findNodeByName = (nodes, name) => {
        const stack = [...nodes];
        while (stack.length) {
            const n = stack.shift();
            if (n.name === name) return n;
            if (n.isFolder && n.children) stack.push(...n.children);
        }
        return null;
    };

    const onOpenMenu = (e) => {
        const el = e?.target?.closest('[data-node-name]');
        if (el) {
            const nodeName = el.getAttribute('data-node-name');
            setContextTarget(findNodeByName(files, nodeName));
        } else {
            setContextTarget(null);
        }
    };

    // Focus input for root-level creation
    useEffect(() => {
        if (isCreatingAtRoot && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 10);
        }
    }, [isCreatingAtRoot]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (mode === 'create-file') {
                onCreateFile(uiActionState.name, null);
            } else if (mode === 'create-folder') {
                onCreateFolder(uiActionState.name, null);
            }
        } else if (e.key === 'Escape') {
            onAction('cancel-create');
        }
    };

    const handleBlur = () => {
        if (isCreatingAtRoot) {
            onAction('cancel-create');
        }
    };
    
    return (
        <ContextMenu onOpenAutoFocus={onOpenMenu} onOpenChange={(open) => { if (!open) setContextTarget(null); }}>
            <ContextMenuTrigger asChild>
                <div className="w-full h-full bg-[#262626] text-white flex flex-col overflow-y-auto" onClick={()=>{setContextTarget(null)}}>
                    <div className="px-3 py-2 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-[#1e1e1e] z-10">
                        <div className="flex items-center">
                            <span className="text-sm text-gray-200">Project</span>
                        </div>
                        <button
                            onClick={onToggleOrientation}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title={isRightSide ? "Move to left" : "Move to right"}
                        >
                            {isRightSide ? (
                                <PanelLeftClose className="w-4 h-4 text-gray-400" />
                            ) : (
                                <PanelRightClose className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                    <div className="flex-grow">
                        {/* Root-level creation input (when target is null) */}
                        {isCreatingAtRoot && (
                            <div className="px-2 py-1">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                        {mode === 'create-folder' ? (
                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={uiActionState.name}
                                        onChange={(e) => setUiActionName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={handleBlur}
                                        placeholder={mode === 'create-folder' ? "New folder name..." : "New file name..."}
                                        className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        )}

                        {files.map((item, index) => (
                            <FileItem 
                                key={item.path || index} 
                                item={item} 
                                onFileSelect={onFileSelect} 
                                activeFile={activeFile} 
                                onAction={onAction} 
                                onRightMouseButtonClick={(item)=>{setContextTarget(item)}}
                                uiActionState={uiActionState}
                                setUiActionName={setUiActionName}
                                onCreateFile={onCreateFile}
                                onCreateFolder={onCreateFolder}
                                onRename={onRename}
                            />
                        ))}
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                {contextTarget ? (
                    contextTarget.isFolder ? (
                        <>
                            <ContextMenuItem onClick={() => onAction('new-file', contextTarget)}>New File</ContextMenuItem>
                            <ContextMenuItem onClick={() => onAction('new-folder', contextTarget)}>New Folder</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => onAction('rename', contextTarget)}>Rename</ContextMenuItem>
                            <ContextMenuItem onClick={() => onAction('delete', contextTarget)}>Delete</ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <ContextMenuItem onClick={() => onFileSelect(contextTarget)}>Open</ContextMenuItem>
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

export default FileTreeView;