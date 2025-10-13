'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    findFileAndUpdate,
    findFirstFile,
    findFileInTree,
    findFolderInTree,
    getFileLanguage
} from '@/utils/fileUtils';

const initialUiActionState = {
    mode: 'none', // 'create-file', 'create-folder', 'rename'
    target: null, // target item for rename/parent for create
    name: '', // current name in the input
};

/**
 * Custom hook to manage the entire state, data fetching, and persistence logic 
 * for the workspace route.
 * @param {string} slug - The workspace identifier from the URL parameter.
 * @returns {Object} An object containing all necessary state and handlers.
 */
export const useWorkspace = (slug) => {
    // 1. Core Data State
    const [rawBucketFiles, setRawBucketFiles] = useState([]); // Raw file list from API
    const [activeFile, setActiveFile] = useState(null);
    const [currentContent, setCurrentContent] = useState('');
    const [savedContent, setSavedContent] = useState(''); // Added missing state
    const [fileContentCache, setFileContentCache] = useState(new Map());

    // 2. Loading & Status State
    const [isLoading, setIsLoading] = useState(false);
    const [lastFileCount, setLastFileCount] = useState(0);

    // 3. UI/Layout State (Added missing state)
    const [showTerminal, setShowTerminal] = useState(false);
    const [treeOnRight, setTreeOnRight] = useState(false);
    const [uiActionState, setUiActionState] = useState(initialUiActionState);

    // Derived State
    const isUnsaved = currentContent !== savedContent;
    const breadcrumb = activeFile ? activeFile.path.split("/") : ["No File Selected"];

    // --- Memoization: Expensive computation ---
    // Calculate the hierarchical tree only when the raw data changes 
    const filesTree = useMemo(() => {
        return rawBucketFiles
    }, [rawBucketFiles]); // Added dependency

    // --- Persistence Handlers (useCallback for stability) ---

    /**
     * Fetches all files from the bucket API.
     * @param {boolean} silent - If true, does not show the global loading spinner.
     */
    const fetchFiles = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetch(`/api/workspace/${slug}`);
            if (response.ok) {
                const data = await response.json();
                const currentFileCount = data.files.length;
                
                if (currentFileCount !== lastFileCount) {
                    setLastFileCount(currentFileCount);
                }

                setRawBucketFiles(data.files);
            } else {
                console.error('Failed to fetch bucket files');
            }
        } catch (error) {
            console.error('Error fetching bucket files:', error);
        } finally {
            setIsLoading(false);
        }
    }, [slug, lastFileCount]);

    /**
     * Handles file selection, managing content caching and fetching.
     * @param {Object} file - The file node object.
     */
    const handleFileSelect = useCallback(async (file) => {
        if (activeFile) {
            const cacheKey = activeFile.path;
            setFileContentCache(prev => new Map(prev.set(cacheKey, currentContent)));
        }

        setActiveFile(file);

        const cacheKey = file.path;
        const cachedContent = fileContentCache.get(cacheKey);

        if (cachedContent !== undefined) {
            setCurrentContent(cachedContent);
            setSavedContent(cachedContent);
        } else {
            if (file.path) {
                try {
                    const response = await fetch(`/api/workspace/${slug}/item?filePath=${encodeURIComponent(file.path)}`);
                    if (response.ok) {
                        const content = await response.text();
                        setCurrentContent(content);
                        setSavedContent(content);
                        setFileContentCache(prev => new Map(prev.set(cacheKey, content)));
                    } else {
                        setCurrentContent('');
                        setSavedContent('');
                    }
                } catch (error) {
                    console.error('Error loading file content:', error);
                    setCurrentContent('');
                    setSavedContent('');
                }
            } else {
                // Handle case for files without path/bucket (e.g., placeholder files)
                setCurrentContent(file.content || '');
                setSavedContent(file.content || '');
                setFileContentCache(prev => new Map(prev.set(cacheKey, file.content || '')));
            }
        }
    }, [activeFile, currentContent, fileContentCache, slug]);

    /**
     * Handles the user saving the active file's content.
     */
    const handleSave = useCallback(async () => {
        if (!activeFile || !isUnsaved) return;

        try {
            const formData = new FormData();
            const blob = new Blob([currentContent], { type: 'text/plain' });
            formData.append('file', blob, activeFile.name);
            formData.append('filePath', activeFile.path);

            const response = await fetch(`/api/workspace/${slug}/item/`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setSavedContent(currentContent);

                const cacheKey = activeFile.path;
                setFileContentCache(prev => new Map(prev.set(cacheKey, currentContent)));

                fetchFiles(true);

            } else {
                console.error('Failed to save file');
                alert('Failed to save file. Please check permissions.');
            }
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file. Please try again.');
        }
    }, [activeFile, currentContent, isUnsaved, slug, fetchFiles]);

    /**
     * Handles file/folder creation logic.
     * @param {string} name - The name of the item to create.
     * @param {Object | null} parent - The parent folder node or null for root.
     * @param {boolean} isFolder - True if creating a folder.
     */
    const handleCreateItem = useCallback(async (name, parent, isFolder) => {
        const type = isFolder ? 'folder' : 'file';
        if (!name.trim()) return;

        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
            alert(`The ${type} name contains invalid characters.`);
            return;
        }

        let finalName = name.trim();
        
        // Define parent path explicitly
        const parentPath = (parent && parent.path) ? `${parent.path}/` : '';
        let fullPath;

        if (!isFolder) {
            if (!finalName.includes('.')) {
                finalName += '.txt';
            }
            
            fullPath = parentPath + finalName;

            // Check if file already exists using the fullPath
            if (findFileInTree(filesTree, fullPath)) {
                 alert('A file with this name already exists at this location.');
                 return;
            }
        } else {
            fullPath = parentPath + finalName;

            // Check if folder already exists using the fullPath
            if (findFolderInTree(filesTree, fullPath)) {
                alert('A folder with this name already exists at this location.');
                return;
            }
        }

        try {
            const formData = new FormData();
            const blob = new Blob([''], { type: 'text/plain' });
            formData.append('file', blob, finalName);
            formData.append('filePath', isFolder ? `${fullPath}/` : fullPath); 
            
            const response = await fetch(`/api/workspace/${slug}/item`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                fetchFiles(true);

                if (!isFolder) {
                    const tempFile = {
                        name: finalName,
                        type: 'file',
                        language: getFileLanguage(finalName),
                        path: fullPath
                    };
                    handleFileSelect(tempFile);
                }
            } else {
                const errorData = await response.json();
                alert(`Failed to create ${type}: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`Error creating new ${type}:`, error);
            alert(`Error creating ${type}. Please try again.`);
        } finally {
            setUiActionState(initialUiActionState);
        }
    }, [filesTree, slug, fetchFiles, handleFileSelect]); // Added dependencies

    /**
     * Handles the item renaming logic.
     * @param {Object} item - The file or folder to rename.
     * @param {string} newName - The new name.
     */
    const handleRename = useCallback(async (item, newName) => {
        if (!newName.trim() || newName === item.name) return;

        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(newName)) {
            alert('New name contains invalid characters.');
            return;
        }

        try {
            const response = await fetch(`/api/workspace/${slug}/item`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: item.path,
                    newPath: item.path.split('/').slice(0, -1).concat(newName).join('/') + (item.type === 'folder' ? '/' : '')
                }),
            });

            if (response.ok) {
                if (activeFile && activeFile.path === item.path) {
                    const newPath = item.path.split('/').slice(0, -1).concat(newName).join('/');
                    setActiveFile(prev => ({...prev, name: newName, path: newPath }));
                }
                fetchFiles(true);
            } else {
                const errorData = await response.json();
                alert(`Failed to rename: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error renaming:', error);
            alert('Error renaming. Please try again.');
        } finally {
            setUiActionState(initialUiActionState);
        }
    }, [slug, fetchFiles, activeFile]);

    /**
     * Handles item deletion logic.
     * @param {Object} item - The file or folder to delete.
     */
    const handleDelete = useCallback(async (item) => {
        const confirmMessage = item.isFolder
           ? `Are you sure you want to delete the folder "${item.name}" and all its contents? This action cannot be undone.`
            : `Are you sure you want to delete the file "${item.name}"? This action cannot be undone.`;

        if (!confirm(confirmMessage)) return;

        try {
            const response = await fetch(`/api/workspace/${slug}/item`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: item.path }),
            });

            if (response.ok) {
                if (activeFile && activeFile.path === item.path) {
                    setActiveFile(null);
                    setCurrentContent('');
                    setSavedContent('');
                }
                setFileContentCache(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(item.path);
                    return newMap;
                });

                fetchFiles(true);
            } else {
                const errorData = await response.json();
                alert(`Failed to delete ${type}: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error deleting. Please try again.');
        }
    }, [slug, fetchFiles, activeFile, setSavedContent]); // Added setSavedContent dependency

    /**
     * Consolidated dispatcher for all tree actions (New File, New Folder, Rename, Delete, Cancel).
     */
    const handleTreeAction = useCallback((action, target, name = null) => {
        console.log(`Action: ${action}, Target: ${target ? target.name : 'null'}, Name: ${name}`);
        if (action === 'new-file' || action === 'new-file-root') {
            setUiActionState({
                mode: 'create-file',
                target: action === 'new-file' ? target : null,
                name: '',
            });
        } else if (action === 'new-folder' || action === 'new-folder-root') {
            setUiActionState({
                mode: 'create-folder',
                target: action === 'new-folder' ? target : null,
                name: '',
            });
        } else if (action === 'rename') {
            setUiActionState({
                mode: 'rename',
                target: target,
                name: target.name,
            });
        } else if (action === 'delete') {
            handleDelete(target);
        } else if (action === 'cancel-create' || action === 'cancel-rename') {
            setUiActionState(initialUiActionState);
        } else if (action === 'confirm-create-file' && name) {
            handleCreateItem(name, target, false);
        } else if (action === 'confirm-create-folder' && name) {
            handleCreateItem(name, target, true);
        } else if (action === 'confirm-rename' && name) {
            handleRename(target, name);
        }
    }, [handleDelete, handleCreateItem, handleRename]); // Added dependencies

    // --- Side Effects (useEffect) ---

    // Effect 1: Initial Data Load
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Effect 2: Auto-select the first file when the filesTree is loaded/changed
    useEffect(() => {
        if (!activeFile && filesTree.length > 0) {
            const firstFile = findFirstFile(filesTree);
            if (firstFile) {
                handleFileSelect(firstFile);
            }
        }
    }, [filesTree, activeFile, handleFileSelect]); // Added dependencies
    
    // Handler to update content from editor (local state change)
    const handleCodeChange = useCallback((newCode) => {
        setCurrentContent(newCode || '');
    }, []);
    
    // Handler for running code (placeholder)
    const onRun = useCallback(() => {
        console.log("Running code...");
    }, []);

    return {
        // Data & Derived State
        filesTree,
        activeFile,
        currentContent,
        isUnsaved,
        isLoading,
        breadcrumb,

        // UI State
        showTerminal,
        setShowTerminal,
        treeOnRight,
        setTreeOnRight,
        uiActionState,
        setUiActionState, // Expose setUiActionState for more direct control

        // Handlers
        handlers: {
            handleFileSelect,
            handleCodeChange,
            onSave: handleSave,
            onRun,
            handleTreeAction,
            onCreateFile: (name, parent) => handleTreeAction('confirm-create-file', parent, name),
            onCreateFolder: (name, parent) => handleTreeAction('confirm-create-folder', parent, name),
            onRename: (item, name) => handleTreeAction('confirm-rename', item, name),
            setUiActionName: (name) => setUiActionState(prev => ({...prev, name })),
        },
    };
};