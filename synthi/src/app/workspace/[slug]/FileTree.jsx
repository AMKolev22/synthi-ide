"use client"
import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import FileItem from './FileItem';

const FileTreeView = ({ files, onFileSelect, activeFile, onAction, onToggleOrientation, isRightSide }) => {
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

export default FileTreeView;


