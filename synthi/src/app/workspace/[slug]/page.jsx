'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import TopNav from '../TopNav.jsx';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import FileTreeView from "./FileTree.jsx"
import EditorPanel from "./Editor.jsx"

const deepCloneFiles = (files) => {
  return JSON.parse(JSON.stringify(files));
};

export default function EditorPage() {
  const [files, setFiles] = useState([]);
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
  const [editingFileName, setEditingFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileParent, setNewFileParent] = useState(null);
  const [fileContentCache, setFileContentCache] = useState(new Map());
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingItem, setRenamingItem] = useState(null);
  const [newName, setNewName] = useState('');
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

  // Function to convert bucket files and folders to tree structure
  const convertBucketFilesToTree = (bucketFiles, bucketFolders = []) => {
    const tree = [];
    const folderMap = new Map();
    const folderHasContent = new Set();

    // First, process all files and create folder structure based on actual file paths
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
            // Mark parent folder as having content
            folderHasContent.add(currentPath);
            
            if (!folderMap.has(currentPath)) {
              const folderNode = {
                name: currentPath.split('/').pop(),
                type: 'folder',
                children: []
              };
              folderMap.set(currentPath, folderNode);
            }
            
            const parentFolder = folderMap.get(currentPath);
            if (parentFolder) {
              parentFolder.children.push(fileNode);
            }
          } else {
            tree.push(fileNode);
          }
        } else {
          // It's a folder in the path
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

    // Then, add empty folders that were created but don't have files yet
    bucketFolders.forEach(folder => {
      const pathParts = folder.name.split('/');
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        const fullPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (isLast) {
          // It's an empty folder
          if (!folderMap.has(fullPath)) {
            const folderNode = {
              name: part,
              type: 'folder',
              children: [],
              isEmpty: true
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
        } else {
          // It's a parent folder
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

    // Clean up empty folders that don't have content
    const cleanTree = (nodes) => {
      return nodes.filter(node => {
        if (node.type === 'folder') {
          if (node.children && node.children.length > 0) {
            node.children = cleanTree(node.children);
            // Only keep folder if it has children or is explicitly created empty
            return node.children.length > 0 || node.isEmpty;
          }
          // Keep folder if it's explicitly created empty
          return node.isEmpty;
        }
        return true;
      });
    };

    const cleanedTree = cleanTree(tree);
    console.log('Tree structure:', cleanedTree);
    return cleanedTree;
  };

  // Function to fetch all files from bucket
  const fetchBucketFiles = async (silent = false) => {
    if (!silent) setLoadingFiles(true);
    try {
      const response = await fetch('/api/bucket');
      if (response.ok) {
        const data = await response.json();
        const treeFiles = convertBucketFilesToTree(data.files, data.folders || []);
        
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
      // Save current file content to cache before switching
      const updatedFiles = findFileAndUpdate(files, activeFile, code);
      setFiles(updatedFiles);
      
      // Update cache with current content
      const cacheKey = activeFile.bucketPath || activeFile.name;
      setFileContentCache(prev => new Map(prev.set(cacheKey, code)));
    }

    setActiveFile(file);
    
    // Check cache first for instant loading
    const cacheKey = file.bucketPath || file.name;
    const cachedContent = fileContentCache.get(cacheKey);
    
    if (cachedContent !== undefined) {
      // Use cached content for instant switching
      setCode(cachedContent);
      setSavedCode(cachedContent);
      setIsUnsaved(false);
    } else {
      // Load from API only if not cached
      if (file.bucketPath) {
        try {
          const response = await fetch(`/api/file?fileId=${encodeURIComponent(file.bucketPath)}`);
          if (response.ok) {
            const content = await response.text();
            setCode(content);
            setSavedCode(content);
            // Cache the content
            setFileContentCache(prev => new Map(prev.set(cacheKey, content)));
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
        // Cache local file content too
        setFileContentCache(prev => new Map(prev.set(cacheKey, file.content || '')));
      }
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
        
        // Update cache with saved content
        const cacheKey = activeFile.bucketPath || activeFile.name;
        setFileContentCache(prev => new Map(prev.set(cacheKey, code)));
        
        console.log('File saved successfully');
        fetchBucketFiles(true);
        
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

  // Removed automatic polling - files are only fetched on demand

  // Helper function to find the first actual file in the tree
  const findFirstFile = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'file') {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!activeFile && files.length > 0) {
      const firstFile = findFirstFile(files);
      if (firstFile) {
        setActiveFile(firstFile);
        setCode(firstFile.content || '');
        const pathArr = findPathToTarget(files, firstFile) || [];
        setBreadcrumb(pathArr);
      }
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

  const handleCreateNewFile = async (fileName) => {
    if (!fileName.trim()) {
      setIsCreatingFile(false);
      setEditingFileName('');
      setNewFileParent(null);
      return;
    }
    
    // Validate file name for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      alert('File name contains invalid characters. Please use only letters, numbers, and basic punctuation.');
      return;
    }
    
    // Add .txt extension if no extension is provided
    let finalFileName = fileName.trim();
    if (!finalFileName.includes('.')) {
      finalFileName += '.txt';
    }
    
    // Determine the full path for the new file
    const fullPath = newFileParent ? `${newFileParent}/${finalFileName}` : finalFileName;
    
    // Check if file already exists
    const existingFile = findFileInTree(files, finalFileName);
    if (existingFile) {
      alert('A file with this name already exists. Please choose a different name.');
      return;
    }
    
    try {
      // Create the file in the bucket
      const formData = new FormData();
      const blob = new Blob([''], { type: 'text/plain' });
      formData.append('file', blob, finalFileName);
      formData.append('fileId', fullPath);

      const response = await fetch('/api/file', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Optimize: Only refresh if needed, don't wait for it
        fetchBucketFiles(true);
        
        // Create a temporary file object for immediate selection
        const tempFile = {
          name: finalFileName,
          type: 'file',
          language: getFileLanguage(finalFileName),
          content: '',
          bucketPath: fullPath
        };
        
        // Select the new file immediately
        handleFileSelect(tempFile);
        
        // Reset state
        setIsCreatingFile(false);
        setEditingFileName('');
        setNewFileParent(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to create file: ${errorData.error || 'Unknown error'}`);
        setIsCreatingFile(false);
        setEditingFileName('');
        setNewFileParent(null);
      }
    } catch (error) {
      console.error('Error creating new file:', error);
      alert('Error creating file. Please try again.');
      setIsCreatingFile(false);
      setEditingFileName('');
      setNewFileParent(null);
    }
  };

  const handleCreateNewFolder = async (folderName) => {
    if (!folderName.trim()) {
      setIsCreatingFolder(false);
      setEditingFileName('');
      setNewFileParent(null);
      return;
    }
    
    // Validate folder name for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(folderName)) {
      alert('Folder name contains invalid characters. Please use only letters, numbers, and basic punctuation.');
      return;
    }
    
    const finalFolderName = folderName.trim();
    
    // Check if folder already exists
    const existingFolder = findFolderInTree(files, finalFolderName);
    if (existingFolder) {
      alert('A folder with this name already exists. Please choose a different name.');
      return;
    }
    
    try {
      const response = await fetch('/api/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: finalFolderName,
          parentPath: newFileParent
        }),
      });

      if (response.ok) {
        // Optimize: Don't wait for refresh, do it in background
        fetchBucketFiles(true);
        
        // Reset state immediately
        setIsCreatingFolder(false);
        setEditingFileName('');
        setNewFileParent(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to create folder: ${errorData.error || 'Unknown error'}`);
        setIsCreatingFolder(false);
        setEditingFileName('');
        setNewFileParent(null);
      }
    } catch (error) {
      console.error('Error creating new folder:', error);
      alert('Error creating folder. Please try again.');
      setIsCreatingFolder(false);
      setEditingFileName('');
      setNewFileParent(null);
    }
  };

  const findFileInTree = (nodes, fileName) => {
    for (const node of nodes) {
      if (node.type === 'file' && node.name === fileName) {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = findFileInTree(node.children, fileName);
        if (found) return found;
      }
    }
    return null;
  };

  const findFolderInTree = (nodes, folderName) => {
    for (const node of nodes) {
      if (node.type === 'folder' && node.name === folderName) {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = findFolderInTree(node.children, folderName);
        if (found) return found;
      }
    }
    return null;
  };

  const handleRename = async (item, newName) => {
    if (!newName.trim()) {
      setIsRenaming(false);
      setRenamingItem(null);
      setNewName('');
      return;
    }

    // Validate new name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newName)) {
      alert('Name contains invalid characters. Please use only letters, numbers, and basic punctuation.');
      return;
    }

    try {
      const response = await fetch('/api/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPath: item.bucketPath || item.name,
          newName: newName.trim(),
          isFolder: item.type === 'folder'
        }),
      });

      if (response.ok) {
        // Refresh the file tree
        fetchBucketFiles(true);
        
        // Reset state
        setIsRenaming(false);
        setRenamingItem(null);
        setNewName('');
      } else {
        const errorData = await response.json();
        alert(`Failed to rename: ${errorData.error || 'Unknown error'}`);
        setIsRenaming(false);
        setRenamingItem(null);
        setNewName('');
      }
    } catch (error) {
      console.error('Error renaming:', error);
      alert('Error renaming. Please try again.');
      setIsRenaming(false);
      setRenamingItem(null);
      setNewName('');
    }
  };

  const handleDelete = async (item) => {
    const confirmMessage = item.type === 'folder' 
      ? `Are you sure you want to delete the folder "${item.name}" and all its contents? This action cannot be undone.`
      : `Are you sure you want to delete the file "${item.name}"? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: item.bucketPath || item.name,
          isFolder: item.type === 'folder'
        }),
      });

      if (response.ok) {
        // If we're deleting the currently active file, clear it
        if (activeFile && activeFile.name === item.name) {
          setActiveFile(null);
          setCode('');
          setSavedCode('');
          setIsUnsaved(false);
        }
        
        // Refresh the file tree
        fetchBucketFiles(true);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting. Please try again.');
    }
  };

  const handleTreeAction = useCallback((action, target) => {
    console.log('Tree action:', action, target);
    
    if (action === 'new-file' || action === 'new-file-root') {
      setNewFileParent(action === 'new-file' ? target : null);
      setIsCreatingFile(true);
      setIsCreatingFolder(false);
      setEditingFileName('');
    } else if (action === 'new-folder' || action === 'new-folder-root') {
      setNewFileParent(action === 'new-folder' ? target : null);
      setIsCreatingFolder(true);
      setIsCreatingFile(false);
      setEditingFileName('');
    } else if (action === 'rename') {
      setIsRenaming(true);
      setRenamingItem(target);
      setNewName(target.name);
    } else if (action === 'delete') {
      handleDelete(target);
    } else if (action === 'cancel-create') {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setEditingFileName('');
      setNewFileParent(null);
    } else if (action === 'cancel-rename') {
      setIsRenaming(false);
      setRenamingItem(null);
      setNewName('');
    }
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
        isCreatingFile={isCreatingFile}
        isCreatingFolder={isCreatingFolder}
        editingFileName={editingFileName}
        setEditingFileName={setEditingFileName}
        onCreateFile={handleCreateNewFile}
        onCreateFolder={handleCreateNewFolder}
        newFileParent={newFileParent}
        isRenaming={isRenaming}
        renamingItem={renamingItem}
        newName={newName}
        setNewName={setNewName}
        onRename={handleRename}
      />
    </ResizablePanel>
  );

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200">
      <TopNav title={title} onRun={onRun} onToggleTerminal={() => setShowTerminal(v => !v)} />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 min-h-0"
        key={panelGroupKey}
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