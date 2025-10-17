// src/app/Editor.jsx
'use client';
import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
    selectActiveFile, 
    selectCurrentContent, 
    selectIsUnsaved, 
    selectBreadcrumb, 
    saveFileContentThunk, 
    updateContent 
} from '@/redux/workspaceSlice';
import { Folder, FileText, Circle, Save } from 'lucide-react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

const TerminalManagerDyn = dynamic(() => import('../TerminalManager.jsx'), {
    ssr: false
});

const EditorPanel = ({
    onRun,
    onToggleTerminal,
}) => {
    const dispatch = useAppDispatch();
    
    // Global state access (Granular selectors for performance)
    const activeFile = useAppSelector(selectActiveFile);
    const code = useAppSelector(selectCurrentContent);
    const isUnsaved = useAppSelector(selectIsUnsaved);
    const breadcrumb = useAppSelector(selectBreadcrumb);
    const showTerminal = useAppSelector(state => state.ui.showTerminal);
    
    // Local state retention
    const [position, setPosition] = useState({ lineNumber: 1, column: 1 });
    const [editorInstance, setEditorInstance] = useState(null);

    // Handler to update content in Redux
    const handleCodeChange = (newCode) => {
        dispatch(updateContent(newCode));
    };
    
    // Handler to save content via Thunk
    const handleSave = () => {
        if (activeFile && isUnsaved) {
            dispatch(saveFileContentThunk());
        }
    };

    // Add keyboard shortcuts (Ctrl+S uses the centralized save function)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        // The handleSave function is stable as its dependencies (dispatch, activeFile, isUnsaved)
        // are accessed through closures or stable dispatch reference.
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    },); 

    return (
        <ResizablePanel defaultSize={76} minSize={20}>
            <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={70} minSize={20}>
                    <div className="h-full flex flex-col bg-[#1e1e1e]">
                        {/* Tab/Breadcrumb area */}
                        <div className="px-3 py-2 text-sm border-b border-[#2a2a2a] bg-[#252526] flex justify-between items-center gap-1 overflow-x-auto whitespace-nowrap">
                            <div className='flex flex-row items-center gap-2'>
                                {breadcrumb && breadcrumb.length > 0? (
                                    breadcrumb.map((name, idx) => {
                                        const isLast = idx === breadcrumb.length - 1;
                                        const isFile = isLast && activeFile && name === activeFile.name;
                                        return (
                                            <span key={`${name}-${idx}`} className="flex items-center">
                                                {isFile? (
                                                    <FileText className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                ) : (
                                                    <Folder className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                )}
                                                <span className={`text-xs ${isLast? 'text-gray-100' : 'text-gray-400'}`}>
                                                    {name}
                                                </span>
                                                {idx < breadcrumb.length - 1 && <span className="px-1 text-gray-500">›</span>}
                                            </span>
                                        );
                                    })
                                ) : (
                                    <span className="text-xs text-gray-400">No file selected</span>
                                )}
                                {/* Unsaved indicator */}
                                {isUnsaved && (
                                    <Circle className="w-3 h-3 text-orange-400 fill-orange-400" />
                                )}
                                {/* Save button */}
                                {activeFile && (
                                    <button
                                        onClick={handleSave}
                                        className="p-1 hover:bg-[#2f2f2f] rounded transition-colors"
                                        title="Save file (Ctrl+S)"
                                    >
                                        <Save className="w-3.5 h-3.5 text-gray-400 hover:text-gray-200" />
                                    </button>
                                )}
                            </div>
                            <div className='flex flex-row gap-2'>
                                <p className='text-xs text-gray-400'>Ln: {position.lineNumber}</p>
                                <p className='text-xs text-gray-400'>Col: {position.column}</p>
                            </div>
                        </div>
                        {/* Editor area */}
                        <div className="flex-1 overflow-hidden">
                            <ContextMenu>
                                <ContextMenuTrigger asChild>
                                    <div className="h-full">
                                        <Editor
                                            key={activeFile? activeFile.path : 'no-file'} // Use path for a better key
                                            height="100%"
                                            value={code}
                                            language={activeFile? activeFile.language : 'plaintext'}
                                            onChange={handleCodeChange}
                                            theme="vs-dark"
                                            options={{
                                                minimap: { enabled: true },
                                                fontSize: 14,
                                                wordWrap: 'on',
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                lineNumbers: true,
                                                scrollbar: {
                                                    verticalHasArrows: true,
                                                    horizontalHasArrows: true,
                                                }
                                            }}
                                            onMount={editor => {
                                                setEditorInstance(editor);
                                                editor.onDidChangeCursorPosition(e => {
                                                    setPosition({
                                                        lineNumber: e.position.lineNumber,
                                                        column: e.position.column
                                                    });
                                                });
                                            }}
                                        />
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-48">
                                    <ContextMenuItem onClick={() => onRun()}>Run File</ContextMenuItem>
                                    <ContextMenuItem onClick={() => editorInstance?.getAction('editor.action.formatDocument')?.run()}>Format Document</ContextMenuItem>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem onClick={() => editorInstance?.getAction('actions.find')?.run()}>Find…</ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        </div>
                    </div>
                </ResizablePanel>
                {/* Terminal Panel */}
                {showTerminal && (
                    <>
                        <ResizableHandle
                            withHandle
                            className="!pointer-events-auto z-50"
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                        <ResizablePanel defaultSize={30} minSize={15} >
                            <TerminalManagerDyn visible={true} onCloseAll={onToggleTerminal} />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </ResizablePanel>
    );
};
export default EditorPanel;