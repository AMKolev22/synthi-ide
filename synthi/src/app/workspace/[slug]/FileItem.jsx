// src/app/FileItem.jsx
"use client"
import { useState, useRef, useEffect } from 'react';
import { ChevronIcon, FileIcon } from './Icons';

const FileItem = ({ 
    item, 
    level = 0, 
    onFileSelect, 
    activeFile, 
    onAction, 
    onRightMouseButtonClick,
    uiActionState,
    setUiActionName,
    onCreateFile,
    onCreateFolder,
    onRename
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef(null);
    
    const { mode, target, name } = uiActionState;
    const isCreating = mode.startsWith('create');
    const isRenaming = mode === 'rename';
    const isCreatingFile = mode === 'create-file';
    const isCreatingFolder = mode === 'create-folder';
    
    // Check if this item is the target for creation or rename
    const isTargetForCreation = isCreating && target && target.path === item.path;
    const isTargetForRename = isRenaming && target && target.path === item.path;
    
    const isSelected = activeFile && activeFile.path === item.path;
    const isExpandable = item.isFolder && item.children && item.children.length > 0;

    const paddingStyle = { paddingLeft: `${level * 16 + 8}px` };
    const inputPaddingStyle = { paddingLeft: `${(level + 1) * 16 + 8}px` };

    // Auto-expand folder when it's the target for creation
    useEffect(() => {
        if (isTargetForCreation && item.isFolder) {
            setIsOpen(true);
        }
    }, [isTargetForCreation, item.isFolder]);

    // Focus input when creating or renaming
    useEffect(() => {
        if ((isTargetForCreation || isTargetForRename) && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                if (isTargetForRename) {
                    inputRef.current?.select();
                }
            }, 10);
        }
    }, [isTargetForCreation, isTargetForRename]);

    const handleClick = (e) => {
        if (e.button === 2) {
            onRightMouseButtonClick(item);
            return;
        }
        if (item.isFolder) {
            if (isExpandable) {
                setIsOpen(!isOpen);
            }
        } else {
            onFileSelect(item);
        }
    };

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
            onAction(isCreating ? 'cancel-create' : 'cancel-rename');
        }
    };

    const handleBlur = () => {
        if (isCreating) {
            onAction('cancel-create');
        } else if (isRenaming) {
            if (name.trim() && name !== target.name) {
                onRename(target, name);
            } else {
                onAction('cancel-rename');
            }
        }
    };

    return (
        <>
            {/* Render rename input in place of the item */}
            {isTargetForRename ? (
                <div className="px-2 py-1" style={paddingStyle}>
                    <div className="flex items-center">
                        <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                            {item.isFolder ? (
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
                            placeholder={`Rename ${item.type}...`}
                            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                        />
                    </div>
                </div>
            ) : (
                <div
                    className={`flex items-center py-1 px-2 cursor-pointer transition duration-200 rounded-sm ${isSelected ? 'bg-gray-600 text-white' : 'hover:bg-gray-700'}`}
                    style={paddingStyle}
                    onClick={handleClick}
                    onContextMenu={handleClick}
                    data-node-name={item.name}
                >
                    {isExpandable && (
                        <div onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}>
                            <ChevronIcon isOpen={isOpen} isSelected={isSelected} />
                        </div>
                    )}
                    <FileIcon node={item} isSelected={isSelected} />
                    <span className={`text-sm truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{item.name}</span>
                </div>
            )}

            {/* Render children and creation input if this is an open folder */}
            {item.isFolder && isOpen && (
                <div className="flex flex-col">
                    {/* Render creation input first if this folder is the target */}
                    {isTargetForCreation && (
                        <div className="px-2 py-1" style={inputPaddingStyle}>
                            <div className="flex items-center">
                                <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                    {isCreatingFolder ? (
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
                                    placeholder={isCreatingFolder ? "New folder name..." : "New file name..."}
                                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Render existing children */}
                    {item.children && item.children.map((child, index) => (
                        <FileItem
                            key={child.path || index}
                            item={child}
                            level={level + 1}
                            onFileSelect={onFileSelect}
                            activeFile={activeFile}
                            onAction={onAction}
                            onRightMouseButtonClick={onRightMouseButtonClick}
                            uiActionState={uiActionState}
                            setUiActionName={setUiActionName}
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                            onRename={onRename}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default FileItem;