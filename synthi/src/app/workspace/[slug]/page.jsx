// src/app/EditorPage.jsx
'use client';
import { useState } from 'react';
import { use } from 'react';
import TopNav from '../TopNav.jsx';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import FileTreeView from "./FileTree.jsx";
import EditorPanel from "./Editor.jsx";
import { useWorkspace } from '@/hooks/useWorkspace'; // Import custom hook

export default function EditorPage({ params }) {
    // 1. Consume the slug parameter
    const { slug } = use(params);

    // 2. Consume all necessary state and handlers from the custom hook
    const {
        filesTree,
        activeFile,
        currentContent,
        isUnsaved,
        breadcrumb,
        showTerminal,
        setShowTerminal,
        treeOnRight,
        setTreeOnRight,
        uiActionState,
        handlers,
    } = useWorkspace(slug);

    // Local state for layout management (used to force remount of ResizablePanelGroup)
    const [panelGroupKey, setPanelGroupKey] = useState(0);

    // Toggling the tree orientation updates the local key to force remount
    const toggleTreeOrientation = () => {
        setTreeOnRight(prev =>!prev);
        setPanelGroupKey(prev => prev + 1);
    };

    const EditorPanelComponent = (
        <EditorPanel
            activeFile={activeFile}
            code={currentContent} // Use currentContent from hook
            setCode={handlers.handleCodeChange} // Use code change handler from hook
            breadcrumb={breadcrumb}
            handleFileSelect={handlers.handleFileSelect}
            onRun={handlers.onRun}
            showTerminal={showTerminal}
            setShowTerminal={setShowTerminal}
            isUnsaved={isUnsaved}
            onSave={handlers.onSave}
        />
    );

    const FileTreePanel = (
        <ResizablePanel defaultSize={24} minSize={1} maxSize={35} className={`${treeOnRight? 'border-l' : 'border-r'} border-[#545454] bg-[#252526]`}>
            <FileTreeView
                files={filesTree} // Use memoized tree from hook
                onFileSelect={handlers.handleFileSelect}
                activeFile={activeFile}
                onAction={handlers.handleTreeAction} // Consolidated dispatcher
                onToggleOrientation={toggleTreeOrientation}
                isRightSide={treeOnRight}
                // Pass consolidated UI state and setters
                uiActionState={uiActionState}
                setUiActionName={handlers.setUiActionName}
                // Pass creation/rename handlers which wrap handleTreeAction for direct execution
                onCreateFile={handlers.onCreateFile}
                onCreateFolder={handlers.onCreateFolder}
                onRename={handlers.onRename}
            />
        </ResizablePanel>
    );

    return (
        <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200">
            <TopNav 
                title={activeFile? activeFile.name : 'Synthi Workspace'}
                onRun={handlers.onRun}
                onToggleTerminal={() => setShowTerminal(v =>!v)}
            />
            <ResizablePanelGroup
                direction="horizontal"
                className="flex-1 min-h-0"
                key={panelGroupKey}
            >
                {treeOnRight? (
                    <>
                        {EditorPanelComponent}
                        <ResizableHandle withHandle />
                        {FileTreePanel}
                    </>
                ) : (
                    <>
                        {FileTreePanel}
                        <ResizableHandle withHandle />
                        {EditorPanelComponent}
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
}