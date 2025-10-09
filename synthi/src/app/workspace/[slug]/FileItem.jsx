"use client"
import { useState } from 'react';
import { ChevronIcon, FileIcon } from './Icons';

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

export default FileItem;