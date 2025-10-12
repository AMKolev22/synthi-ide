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

const FileTreeView = ({ files, onFileSelect, activeFile, onAction, onToggleOrientation, isRightSide, isCreatingFile, isCreatingFolder, editingFileName, setEditingFileName, onCreateFile, onCreateFolder, newFileParent, isRenaming, renamingItem, newName, setNewName, onRename }) => {
  const [contextTarget, setContextTarget] = useState(null);
  const inputRef = useRef(null);
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
      const name = el.getAttribute('data-node-name');
      setContextTarget(findNodeByName(files, name));
    } else {
      setContextTarget(null);
    }
  };

  // Focus the input when creating a new file or folder, or when renaming
  useEffect(() => {
    if ((isCreatingFile || isCreatingFolder || isRenaming) && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
        if (isRenaming) {
          // Select all text when renaming
          inputRef.current?.select();
        }
      }, 10);
    }
  }, [isCreatingFile, isCreatingFolder, isRenaming]);

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
            {/* Inline file/folder creation input - appears at the end like VS Code */}
            {(isCreatingFile || isCreatingFolder) && (
              <div className="px-2 py-1">
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
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (isCreatingFile) {
                          onCreateFile(editingFileName);
                        } else {
                          onCreateFolder(editingFileName);
                        }
                      } else if (e.key === 'Escape') {
                        setEditingFileName('');
                        onAction('cancel-create');
                      }
                    }}
                    onBlur={() => {
                      if (editingFileName.trim()) {
                        if (isCreatingFile) {
                          onCreateFile(editingFileName);
                        } else {
                          onCreateFolder(editingFileName);
                        }
                      } else {
                        setEditingFileName('');
                        onAction('cancel-create');
                      }
                    }}
                    placeholder={isCreatingFolder ? "New folder name..." : "New file name..."}
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Inline rename input */}
            {isRenaming && renamingItem && (
              <div className="px-2 py-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                    {renamingItem.type === 'folder' ? (
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
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRename(renamingItem, newName);
                      } else if (e.key === 'Escape') {
                        setNewName('');
                        onAction('cancel-rename');
                      }
                    }}
                    onBlur={() => {
                      if (newName.trim() && newName !== renamingItem.name) {
                        onRename(renamingItem, newName);
                      } else {
                        setNewName('');
                        onAction('cancel-rename');
                      }
                    }}
                    placeholder={`Rename ${renamingItem.type}...`}
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                  />
                </div>
              </div>
            )}
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


