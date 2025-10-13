// src/app/FileItem.jsx
"use client"
import { useState } from 'react';
import { ChevronIcon, FileIcon } from './Icons';

const FileItem = ({ item, level = 0, onFileSelect, activeFile, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Check if the item is currently the active file/folder (using path for uniqueness)
    const isSelected = activeFile && activeFile.path === item.path;
    
    // The key bug fix: a folder is expandable if it has 1 or more children.
    const isExpandable = item.isFolder && item.children && item.children.length > 0;

    const paddingStyle = { paddingLeft: `${level * 16 + 8}px` };

    const handleClick = () => {
        if (item.isFolder) {
            // Only toggle open if it's expandable
            if (isExpandable) {
                setIsOpen(!isOpen);
                // Note: using item.__open is a side-effect on props and should be avoided 
                // in favor of local state (isOpen), but preserved for consistency with 
                // the original component's likely intent if external components relied on it.
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
                data-node-name={item.name}
            >
                {isExpandable && (
                    <div onClick={(e) => {
                        // Stop propagation so clicking the chevron doesn't also select the folder node itself
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
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default FileItem;