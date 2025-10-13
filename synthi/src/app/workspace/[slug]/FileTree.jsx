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
    // Consolidated UI state from hook
    uiActionState,
    setUiActionName,
    // Direct execution handlers
    onCreateFile,
    onCreateFolder,
    onRename 
}) => {
    const inputRef = useRef(null);
    const [contextTarget, setContextTarget] = useState(null);

    const { mode, target, name } = uiActionState;
    const isCreating = mode.startsWith('create');
    const isRenaming = mode === 'rename';
    const isCreatingFile = mode === 'create-file';
    const isCreatingFolder = mode === 'create-folder';

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
            // Note: This findNodeByName is inefficient; for large trees, contextTarget should be passed via props/context.
            // Keeping for consistency with original structure, but acknowledging potential performance issue.
            setContextTarget(findNodeByName(files, nodeName));
        } else {
            setContextTarget(null);
        }
    };

    // Focus the input when creating a new file or folder, or when renaming
    useEffect(() => {
        if ((isCreating || isRenaming) && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                if (isRenaming) {
                    // Select all text when renaming
                    inputRef.current?.select();
                }
            }, 10);
        }
    },);

    // Handle keydown events for inline input
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (isCreatingFile) {
                onCreateFile(name, target);
            } else if (isCreatingFolder) {
                onCreateFolder(name, target);
            } else if (isRenaming) {
                onRename(target, name);
            }
        } else if (e.key === 'Escape') {
            // Cancel the action
            onAction(isCreating? 'cancel-create' : 'cancel-rename');
        }
    };

    // Handle blur event for inline input (Safely removes auto-save on creation blur)
    const handleBlur = () => {
        if (isCreating) {
            // For creation, blur acts as cancellation, forcing the user to press ENTER to save
            // This prevents race conditions with ESCAPE key and ambiguous user intent.
            onAction('cancel-create');
        } else if (isRenaming) {
            // For renaming, if a valid and different name is entered, execute the rename on blur.
            if (name.trim() && name!== target.name) {
                onRename(target, name);
            } else {
                // Otherwise, cancel the inline rename UI
                onAction('cancel-rename');
            }
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
                        <button
                            onClick={onToggleOrientation}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title={isRightSide? "Move to left" : "Move to right"}
                        >
                            {isRightSide? (
                                <PanelLeftClose className="w-4 h-4 text-gray-400" />
                            ) : (
                                <PanelRightClose className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                    <div className="flex-grow">
                        {files.map((item, index) => (
                            <FileItem key={item.path || index} item={item} onFileSelect={onFileSelect} activeFile={activeFile} onAction={onAction} />
                        ))}
                        
                        {/* Inline creation input */}
                        {(isCreating) && (
                            <div className="px-2 py-1">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                        {isCreatingFolder? (
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
                                        value={name}
                                        onChange={(e) => setUiActionName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={handleBlur}
                                        placeholder={isCreatingFolder? "New folder name..." : "New file name..."}
                                        className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Inline rename input */}
                        {isRenaming && target && (
                            <div className="px-2 py-1">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                        {target.isFolder? (
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
                                        value={name}
                                        onChange={(e) => setUiActionName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={handleBlur}
                                        placeholder={`Rename ${target.type}...`}
                                        className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                {contextTarget? (
                    contextTarget.isFolder? (
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