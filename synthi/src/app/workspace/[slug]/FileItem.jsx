// src/app/FileItem.jsx
"use client"
import { useState } from 'react';
import { ChevronIcon, FileIcon } from './Icons';
// Note: We retain activeFile prop for comparison during recursion/rendering
const FileItem = ({ item, level = 0, onFileSelect, activeFile, onAction, onRightMouseButtonClick }) => {
    // Retain local state for folder expansion
    const [isOpen, setIsOpen] = useState(false);

    // Check if the item is currently the active file/folder (using path for uniqueness)
    const isSelected = activeFile && activeFile.path === item.path;

    const isExpandable = item.isFolder && item.children && item.children.length > 0;
    const paddingStyle = { paddingLeft: `${level * 16 + 8}px` };
    
    const handleClick = (e) => {
        if (e.button === 2) { // Right-click
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
                <FileIcon node={item} isSelected={isSelected} />
                <span className={`text-sm truncate ${isSelected? 'text-white' : 'text-gray-200'}`}>{item.name}</span>
            </div>
            {isExpandable && isOpen && (
                <div className="flex flex-col">
                    {item.children.map((child, index) => (
                        <FileItem
                            key={child.path || index}
                            item={child}
                            level={level + 1}
                            onFileSelect={onFileSelect}
                            activeFile={activeFile}
                            onAction={onAction}
                            onRightMouseButtonClick={onRightMouseButtonClick}
                        />
                    ))}
                </div>
            )}
        </>
    );
};
export default FileItem;