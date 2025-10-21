// src/app/FileItem.jsx
"use client"
import { useState, useRef, useEffect } from 'react';
import { ChevronIcon } from './Icons';
import { getFileIcon, FolderIcon } from '@/utils/fileIcons';
import { setUiActionName } from '@/redux/uiSlice';

const FileItem = ({ 
    item, 
    level = 0, 
    onFileSelect, 
    activeFile, 
    onAction, 
    onRightMouseButtonClick,
    uiActionState,
    dispatch,
    handleKeyDown,
    handleBlur
}) => {
    // Helper function to check if this folder contains the active file
    const containsActiveFile = (folder, activeFilePath) => {
        if (!folder.isFolder || !folder.children || !activeFilePath) return false;
        
        for (const child of folder.children) {
            if (child.path === activeFilePath) return true;
            if (child.isFolder && containsActiveFile(child, activeFilePath)) return true;
        }
        return false;
    };
    
    // Determine initial state based on whether this folder contains the active file
    const shouldAutoExpand = item.isFolder && activeFile && containsActiveFile(item, activeFile.path);
    
    // Retain local state for folder expansion
    const [isOpen, setIsOpen] = useState(shouldAutoExpand);
    
    // Local Ref for contextual input focusing
    const localInputRef = useRef(null); 

    // Destructure UI state and derive contextual flags
    const { mode, target, name } = uiActionState;
    const isCreating = mode.startsWith('create');
    const isRenaming = mode === 'rename';
    const isTargetForRename = isRenaming && target && item.path === target.path;
    // Check if this folder is the parent target for a new item creation
    const isParentForCreation = isCreating && item.isFolder && target && item.path === target.path;
    const isCreatingFolder = mode === 'create-folder';

    // Auto-expand folders that contain the active file
    useEffect(() => {
        if (item.isFolder && activeFile && containsActiveFile(item, activeFile.path)) {
            setIsOpen(true);
        }
    }, [activeFile]);
    
    // Focus management for the decentralized input
    useEffect(() => {
        if ((isTargetForRename || isParentForCreation) && localInputRef.current) {
            // Apply small timeout to allow React to fully mount and paint the input
            setTimeout(() => {
                localInputRef.current?.focus();
                if (isTargetForRename) {
                    localInputRef.current?.select();
                }
            }, 10);
        }
    }, [isTargetForRename, isParentForCreation]);

    // Check if the item is currently the active file/folder
    const isSelected = activeFile && activeFile.path === item.path;
    const isExpandable = item.isFolder && (item.children && item.children.length > 0 || isParentForCreation);
    const paddingStyle = { paddingLeft: `${level * 16 + 8}px` };

    const handleClick = (e) => {
        if (e.button === 2) { // Right-click
            onRightMouseButtonClick(item);
            return;
        }
        // Prevent action propagation if this item is currently rendering the input for renaming
        if (isTargetForRename) return;
        
        if (item.isFolder) {
            if (isExpandable) {
                setIsOpen(!isOpen);
            }
        } else {
            onFileSelect(item);
        }
    };

    // 1. Conditional Rendering: If renaming, REPLACE the standard display
    if (isTargetForRename) {
        return (
            <div 
                className={`flex items-center py-1 px-2 transition duration-200`}
                style={paddingStyle}
            >
                <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                    {item.isFolder ? (
                        <FolderIcon />
                    ) : (
                        getFileIcon(item.name)
                    )}
                </div>
                <input
                    ref={localInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => dispatch(setUiActionName(e.target.value))}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={`Rename ${item.isFolder? 'folder' : 'file'}...`}
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                />
            </div>
        );
    }

    // 2. Standard Display Rendering
    return (
        <>
            <div
                className={`flex items-center py-1 px-2 cursor-pointer transition duration-200 rounded-sm ${isSelected? 'bg-gray-600 text-white' : 'hover:bg-gray-700'}`}
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
                <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                    {item.isFolder ? (
                        <FolderIcon />
                    ) : (
                        getFileIcon(item.name)
                    )}
                </div>
                <span className={`text-sm truncate ${isSelected? 'text-white' : 'text-gray-200'}`}>{item.name}</span>
            </div>
            
            {/* 3. Conditional Insertion: If folder is open and is the target for creation */}
            {isExpandable && isOpen && (
                <div className="flex flex-col">
                    {isParentForCreation && (
                        <div className="py-1 px-2" style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}>
                            <div className="flex items-center">
                                <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                    {isCreatingFolder ? (
                                        <FolderIcon />
                                    ) : (
                                        getFileIcon(name || 'newfile')
                                    )}
                                </div>
                                <input
                                    ref={localInputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => dispatch(setUiActionName(e.target.value))}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleBlur}
                                    placeholder={isCreatingFolder? "New folder name..." : "New file name..."}
                                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                />
                            </div>
                        </div>
                    )}
                    
                    {item.children.map((child, index) => (
                        <FileItem
                            key={child.path || index}
                            item={child}
                            level={level + 1}
                            onFileSelect={onFileSelect}
                            activeFile={activeFile}
                            onAction={onAction}
                            onRightMouseButtonClick={onRightMouseButtonClick}
                            // Propagate all necessary state and handlers
                            uiActionState={uiActionState}
                            dispatch={dispatch}
                            handleKeyDown={handleKeyDown}
                            handleBlur={handleBlur}
                        />
                    ))}
                </div>
            )}
        </>
    );
};
export default FileItem;