'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import TopNav from '../TopNav.jsx';
import dynamic from 'next/dynamic';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import FileTreeView from "./FileTree.jsx"
import { INITIAL_FILES_DATA } from './initial.js';
import EditorPanel from "./Editor.jsx"

const deepCloneFiles = (files) => {
  return JSON.parse(JSON.stringify(files));
};

export default function EditorPage() {
  const [files, setFiles] = useState(deepCloneFiles(INITIAL_FILES_DATA));
  const [editorInstance, setEditorInstance] = useState(null);
  const [position, setPosition] = useState({ lineNumber: 0, column: 0 });
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('Synthi Workspace');
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [treeOnRight, setTreeOnRight] = useState(false);
  const [panelGroupKey, setPanelGroupKey] = useState(0);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [savedCode, setSavedCode] = useState('');
  const [bucketFiles, setBucketFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [lastFileCount, setLastFileCount] = useState(0);
  const TerminalManagerDyn = useMemo(
    () => dynamic(() => import('../TerminalManager.jsx'), { ssr: false }),
    []
  );

  // Function to determine file language based on extension
  const getFileLanguage = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'txt': 'plaintext',
      'sql': 'sql',
      'sh': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return languageMap[extension] || 'plaintext';
  };

  // Function to convert bucket files to tree structure
  const convertBucketFilesToTree = (bucketFiles) => {
    const tree = [];
    const folderMap = new Map();

    bucketFiles.forEach(file => {
      const pathParts = file.name.split('/');
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        const fullPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (isLast) {
          // It's a file
          const language = getFileLanguage(part);
          const fileNode = {
            name: part,
            type: 'file',
            language: language,
            content: '', // Will be loaded when file is selected
            bucketPath: file.name
          };
          
          if (currentPath) {
            const parentFolder = folderMap.get(currentPath);
            if (parentFolder) {
              parentFolder.children.push(fileNode);
            }
          } else {
            tree.push(fileNode);
          }
        } else {
          // It's a folder
          if (!folderMap.has(fullPath)) {
            const folderNode = {
              name: part,
              type: 'folder',
              children: []
            };
            folderMap.set(fullPath, folderNode);
            
            if (currentPath) {
              const parentFolder = folderMap.get(currentPath);
              if (parentFolder) {
                parentFolder.children.push(folderNode);
              }
            } else {
              tree.push(folderNode);
            }
          }
        }
        
        currentPath = fullPath;
      });
    });

    return tree;
  };

  // Function to fetch all files from bucket
  const fetchBucketFiles = async (silent = false) => {
    if (!silent) setLoadingFiles(true);
    try {
      const response = await fetch('/api/bucket');
      if (response.ok) {
        const data = await response.json();
        const treeFiles = convertBucketFilesToTree(data.files);
        
        // Check if file count has changed
        const currentFileCount = data.files.length;
        if (currentFileCount !== lastFileCount) {
          setLastFileCount(currentFileCount);
          console.log(`File count changed: ${lastFileCount} -> ${currentFileCount}`);
        }
        
        setBucketFiles(treeFiles);
        setFiles(treeFiles);
        setLastUpdateTime(Date.now());
      } else {
        console.error('Failed to fetch bucket files');
      }
    } catch (error) {
      console.error('Error fetching bucket files:', error);
    } finally {
      if (!silent) setLoadingFiles(false);
    }
  };

  const findPathToTarget = useCallback((nodes, target, path = []) => {
    for (const node of nodes) {
      const currentPath = [...path, node];
      if (node.type === 'file' && node.name === target.name && node.language === target.language) {
        return currentPath;
      }
      if (node.type === 'folder' && node.children) {
        const result = findPathToTarget(node.children, target, currentPath);
        if (result) return result;
      }
    }
    return null;
  }, []);

  const handleFileSelect = async (file) => {
    if (activeFile) {
      const updatedFiles = findFileAndUpdate(files, activeFile, code);
      setFiles(updatedFiles);
    }

    setActiveFile(file);
    
    // If it's a bucket file, load its content from the API
    if (file.bucketPath) {
      try {
        const response = await fetch(`/api/file?fileId=${encodeURIComponent(file.bucketPath)}`);
        if (response.ok) {
          const content = await response.text();
          setCode(content);
          setSavedCode(content);
          // Update the file content in the tree
          const updatedFiles = findFileAndUpdate(files, file, content);
          setFiles(updatedFiles);
        } else {
          setCode('');
          setSavedCode('');
        }
      } catch (error) {
        console.error('Error loading file content:', error);
        setCode('');
        setSavedCode('');
      }
    } else {
      // It's a local file
      setCode(file.content || '');
      setSavedCode(file.content || '');
    }
    
    setIsUnsaved(false);
    setTitle(file.name);
    const pathArr = findPathToTarget(files, file) || [];
    setBreadcrumb(pathArr);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode || '');
    setIsUnsaved(newCode !== savedCode);
  };

  const handleSave = async () => {
    if (!activeFile) return;

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      const blob = new Blob([code], { type: 'text/plain' });
      formData.append('file', blob, activeFile.name);
      
      // Use bucketPath if it's a bucket file, otherwise use the file name
      const fileId = activeFile.bucketPath || activeFile.name;
      formData.append('fileId', fileId);

      const response = await fetch('/api/file', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Update the local file content
        const updatedFiles = findFileAndUpdate(files, activeFile, code);
        setFiles(updatedFiles);
        setSavedCode(code);
        setIsUnsaved(false);
        console.log('File saved successfully');
        
        // Automatically refresh the file tree to pick up any new files or changes
        setTimeout(() => {
          fetchBucketFiles(true); // Silent refresh
        }, 500);
      } else {
        console.error('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  // Fetch bucket files on component mount
  useEffect(() => {
    fetchBucketFiles();
  }, []);

  // Set up automatic polling for file changes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBucketFiles(true); // Silent refresh
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeFile && files.length > 0) {
      const defaultFile = files[0]?.children?.[0]?.children?.[0] || files[0];
      setActiveFile(defaultFile);
      setCode(defaultFile?.content || '');
      const pathArr = defaultFile ? (Array.isArray(files) ? [files[0], files[0]?.children?.[0], defaultFile].filter(Boolean) : []) : [];
      setBreadcrumb(pathArr);
    }
  }, [files, activeFile]);

  const findFileAndUpdate = (currentFiles, targetFile, newContent) => {
    return currentFiles.map(item => {
      if (item.type === 'file' && item.name === targetFile.name && item.language === targetFile.language) {
        return { ...item, content: newContent };
      }
      if (item.type === 'folder' && item.children) {
        return { ...item, children: findFileAndUpdate(item.children, targetFile, newContent) };
      }
      return item;
    });
  };

  const onRun = () => {
    console.log(files);
  }

  const handleTreeAction = useCallback((action, target) => {
    console.log('Tree action:', action, target);
  }, []);

  const toggleTreeOrientation = () => {
    setTreeOnRight(prev => !prev);
    setPanelGroupKey(prev => prev + 1); // Force remount
  };

  const EditorPanelComponent = (
    <EditorPanel
      activeFile={activeFile}
      code={code}
      setCode={handleCodeChange}
      position={position}
      setPosition={setPosition}
      breadcrumb={breadcrumb}
      handleFileSelect={handleFileSelect}
      onRun={onRun}
      showTerminal={showTerminal}
      setShowTerminal={setShowTerminal}
      isUnsaved={isUnsaved}
      onSave={handleSave}
    />
  );

  const FileTreePanel = (
    <ResizablePanel defaultSize={24} minSize={1} maxSize={35} className={`${treeOnRight ? 'border-l' : 'border-r'} border-[#545454] bg-[#252526]`}>
      <FileTreeView 
        files={files}
        onFileSelect={handleFileSelect}
        activeFile={activeFile}
        onAction={handleTreeAction}
        onToggleOrientation={toggleTreeOrientation}
        isRightSide={treeOnRight}
      />
    </ResizablePanel>
  );

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200">
      <TopNav title={title} onRun={onRun} onToggleTerminal={() => setShowTerminal(v => !v)} />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 min-h-0"
        key={panelGroupKey} // <-- Add this line
      >
        {treeOnRight ? (
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