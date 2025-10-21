"use client"
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
    selectFilesTree, 
    selectActiveFile, 
    handleCreateItemThunk, 
    handleRenameItemThunk, 
    deleteItemThunk, 
    selectFileThunk 
} from '@/redux/workspaceSlice';
import {
    selectUiActionState,
    setUiActionName,
    cancelUiAction,
    startCreate,
    startRename,
    selectTreeOnRight
} from '@/redux/uiSlice';
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
    onToggleOrientation,
}) => {
    const dispatch = useAppDispatch();

    // State pulled from Redux
    const files = useAppSelector(selectFilesTree);
    const activeFile = useAppSelector(selectActiveFile);
    const uiActionState = useAppSelector(selectUiActionState);
    const isRightSide = useAppSelector(selectTreeOnRight);
    
    // inputRef retained ONLY for root-level creation (target: null)
    const inputRef = useRef(null); 
    const [contextTarget, setContextTarget] = useState(null);
    const { mode, target, name } = uiActionState;
    const isCreating = mode.startsWith('create');
    const isRenaming = mode === 'rename';
    const isCreatingFile = mode === 'create-file';
    const isCreatingFolder = mode === 'create-folder';
    
    // Helper for context menu (Inefficient but retained)
    const findNodeByName = (nodes, name) => {
        const stack = [...nodes];
        while (stack.length) {
            const n = stack.shift();
            if (n.name === name) return n;
            if (n.isFolder && n.children) stack.push(...n.children);
        }
        return null;
    };

    // Focus hook modified: only handles root creation focus if target is null
    useEffect(() => {
        if (isCreating && !target && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 10);
        }
    }, [isCreating, target]);

    // Dispatcher for context menu items
    const handleTreeAction = (action, item = null) => {
        if (action === 'new-file' || action === 'new-folder') {
            dispatch(startCreate({ type: action === 'new-file' ? 'file' : 'folder', target: item }));
        } else if (action === 'new-file-root' || action === 'new-folder-root') {
            dispatch(startCreate({ type: action === 'new-file-root' ? 'file' : 'folder', target: null }));
        } else if (action === 'rename') {
            dispatch(startRename(item));
        } else if (action === 'delete') {
            dispatch(deleteItemThunk(item));
        }
    };
    
    // Action handlers passed down to FileItem
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (isCreating) {
                dispatch(handleCreateItemThunk());
            } else if (isRenaming) {
                dispatch(handleRenameItemThunk());
            }
        } else if (e.key === 'Escape') {
            dispatch(cancelUiAction());
        }
    };
    
    const handleBlur = () => {
        if (isCreating) {
            // For creation, blur acts as cancellation
            dispatch(cancelUiAction());
        } else if (isRenaming) {
            // For renaming, execute thunk or cancel
            if (name.trim() && target && name !== target.name) {
                dispatch(handleRenameItemThunk());
            } else {
                dispatch(cancelUiAction());
            }
        }
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

    // Handler for FileItem clicks
    const onFileSelectHandler = (item) => {
        dispatch(selectFileThunk(item));
    };

    return (
    <ContextMenu
      onOpenAutoFocus={onOpenMenu}
      onOpenChange={(open) => {
        if (!open) setContextTarget(null);
      }}
    >
      <ContextMenuTrigger asChild>
        <div
          className="w-full h-full bg-[#232323] text-gray-100 flex flex-col overflow-y-auto border-r border-[#343434]"
          onClick={() => {
            setContextTarget(null);
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-[#343434] sticky top-0 bg-[#202020] z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-gray-400">
                Project
              </span>
            </div>
            <button
              onClick={onToggleOrientation}
              className="p-1.5 rounded border border-[#3a3a3a] bg-[#262626] hover:bg-[#2f2f2f] transition"
              title={isRightSide ? "Move to left" : "Move to right"}
            >
              {isRightSide ? (
                <PanelLeftClose className="w-4 h-4 text-gray-300" />
              ) : (
                <PanelRightClose className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>

          {/* File list */}
          <div className="flex-grow">
            {files.map((item, index) => (
              <FileItem
                key={item.path || index}
                item={item}
                onFileSelect={onFileSelectHandler}
                activeFile={activeFile}
                onAction={handleTreeAction}
                onRightMouseButtonClick={(item) => {
                  setContextTarget(item);
                }}
                uiActionState={uiActionState}
                dispatch={dispatch}
                handleKeyDown={handleKeyDown}
                handleBlur={handleBlur}
              />
            ))}

            {/* Root creation input */}
            {isCreating && !target && (
              <div className="px-3 py-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                    {isCreatingFolder ? (
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) =>
                      dispatch(setUiActionName(e.target.value))
                    }
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={
                      isCreatingFolder
                        ? "New folder name..."
                        : "New file name..."
                    }
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Context Menu */}
      <ContextMenuContent className="w-48 bg-[#1f1f1f] border border-[#333] text-gray-200 shadow-lg">
        {contextTarget ? (
          contextTarget.isFolder ? (
            <>
              <ContextMenuItem
                onClick={() => handleTreeAction("new-file", contextTarget)}
              >
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleTreeAction("new-folder", contextTarget)}
              >
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleTreeAction("rename", contextTarget)}
              >
                Rename
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleTreeAction("delete", contextTarget)}
              >
                Delete
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem
                onClick={() => onFileSelectHandler(contextTarget)}
              >
                Open
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleTreeAction("rename", contextTarget)}
              >
                Rename
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleTreeAction("delete", contextTarget)}
              >
                Delete
              </ContextMenuItem>
            </>
          )
        ) : (
          <>
            <ContextMenuItem
              onClick={() => handleTreeAction("new-file-root")}
            >
              New File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleTreeAction("new-folder-root")}
            >
              New Folder
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
export default FileTreeView;