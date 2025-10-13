// src/hooks/useWorkspace.js
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    findFileAndUpdate,
    findFirstFile,
    findFileInTree,
    findFolderInTree,
    getFileLanguage
} from '@/utils/fileUtils';

// Consolidated state for transient UI actions (create/rename)
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
    const [rawBucketFiles, setRawBucketFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(null);
    const [currentContent, setCurrentContent] = useState('');
    const [savedContent, setSavedContent] = useState('');
    const [fileContentCache, setFileContentCache] = useState(new Map());

    // 2. Loading & Status State
    const [isLoading, setIsLoading] = useState(false);
    const [lastFileCount, setLastFileCount] = useState(0);

    // 3. UI/Layout State (The Missing Definitions)
    const [showTerminal, setShowTerminal] = useState(false);
    const [treeOnRight, setTreeOnRight] = useState(false);
    const [uiActionState, setUiActionState] = useState(initialUiActionState);

    
    // Derived State
    const isUnsaved = currentContent !== savedContent;
    const breadcrumb = activeFile ? activeFile.path.split("/") : ["No File Selected"];

    // --- Memoization: Expensive computation ---
    // Calculate the hierarchical tree only when the raw data changes 
    const filesTree = useMemo(() => {
        // We use the raw list of files from the API here
        return rawBucketFiles
    },);

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
                
                // Track count change to potentially trigger UI update if needed
                if (currentFileCount!== lastFileCount) {
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
            // 1. Save current file content to cache before switching context
            const cacheKey = activeFile.path;
            setFileContentCache(prev => new Map(prev.set(cacheKey, currentContent)));
        }

        setActiveFile(file);

        // 2. Check cache first for instant loading
        const cacheKey = file.path;
        const cachedContent = fileContentCache.get(cacheKey);

        if (cachedContent!== undefined) {
            setCurrentContent(cachedContent);
            setSavedContent(cachedContent);
        } else {
            // 3. Load from API if not cached
            if (file.path) {
                try {
                    const response = await fetch(`/api/workspace/${slug}/item?filePath=${encodeURIComponent(file.path)}`);
                    if (response.ok) {
                        const content = await response.text();
                        setCurrentContent(content);
                        setSavedContent(content);
                        // Cache the content for future switches
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
        if (!activeFile ||!isUnsaved) return;

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

                // Update cache with saved content
                const cacheKey = activeFile.path;
                setFileContentCache(prev => new Map(prev.set(cacheKey, currentContent)));

                // Refresh the file list silently (background update)
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
        const type = isFolder? 'folder' : 'file';
        if (!name.trim()) return;

        // Validate name for invalid characters
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
            alert(`The ${type} name contains invalid characters.`);
            return;
        }

        let finalName = name.trim();
        let fullPath;

        if (!isFolder) {
            // Add.txt extension if none is provided for files
            if (!finalName.includes('.')) {
                finalName += '.txt';
            }
            fullPath = parent? `${parent.path}/${finalName}` : finalName;

            // Check if file already exists
            if (findFileInTree(filesTree, finalName)) {
                 alert('A file with this name already exists.');
                 return;
            }
        } else {
            fullPath = parent? `${parent.path}/${finalName}` : finalName;

            // Check if folder already exists
            if (findFolderInTree(filesTree, finalName)) {
                alert('A folder with this name already exists.');
                return;
            }
        }

        try {
            const formData = new FormData();
            // Use empty content for files and folders
            const blob = new Blob([''], { type: 'text/plain' });
            formData.append('file', blob, finalName);
            // Folder path needs a trailing slash for some APIs
            formData.append('filePath', isFolder? `${fullPath}/` : fullPath); 
            
            const response = await fetch(`/api/workspace/${slug}/item`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                fetchFiles(true); // Refresh silently

                // If it's a file, set it as active immediately
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
            // Reset UI state regardless of success/failure
            setUiActionState(initialUiActionState);
        }
    },);


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
                    // Construct the new path by replacing the last segment
                    newPath: item.path.split('/').slice(0, -1).concat(newName).join('/') + (item.type === 'folder'? '/' : '')
                }),
            });

            if (response.ok) {
                // If the active file was renamed, update its path/name locally
                if (activeFile && activeFile.path === item.path) {
                    const newPath = item.path.split('/').slice(0, -1).concat(newName).join('/');
                    setActiveFile(prev => ({...prev, name: newName, path: newPath }));
                }
                fetchFiles(true); // Refresh silently
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
        const type = item.type;
        const confirmMessage = item.type === 'folder'
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
                // If we're deleting the currently active file, clear the editor
                if (activeFile && activeFile.path === item.path) {
                    setActiveFile(null);
                    setCurrentContent('');
                    setSavedContent('');
                }
                // Also remove from cache
                setFileContentCache(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(item.path);
                    return newMap;
                });

                fetchFiles(true); // Refresh silently
            } else {
                const errorData = await response.json();
                alert(`Failed to delete ${type}: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error deleting. Please try again.');
        }
    }, [slug, fetchFiles, activeFile]);

    /**
     * Consolidated dispatcher for all tree actions (New File, New Folder, Rename, Delete, Cancel).
     */
    const handleTreeAction = useCallback((action, target, name = null) => {
        if (action === 'new-file' || action === 'new-file-root') {
            setUiActionState({
                mode: 'create-file',
                target: action === 'new-file'? target : null,
                name: '',
            });
        } else if (action === 'new-folder' || action === 'new-folder-root') {
            setUiActionState({
                mode: 'create-folder',
                target: action === 'new-folder'? target : null,
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
    },);


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
                // Use the selection handler to load content/cache correctly
                handleFileSelect(firstFile);
            }
        }
    },);
    
    // Handler to update content from editor (local state change)
    const handleCodeChange = useCallback((newCode) => {
        setCurrentContent(newCode || '');
    },);
    
    // Handler for running code (placeholder)
    const onRun = useCallback(() => {
        console.log("Running code...");
    },);

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

        // Handlers
        handlers: {
            handleFileSelect,
            handleCodeChange,
            onSave: handleSave,
            onRun,
            handleTreeAction,
            // Exposed creation/rename handlers for FileTree.jsx
            onCreateFile: (name, parent) => handleTreeAction('confirm-create-file', parent, name),
            onCreateFolder: (name, parent) => handleTreeAction('confirm-create-folder', parent, name),
            onRename: (item, name) => handleTreeAction('confirm-rename', item, name),
            // Utility for setting the name in the inline input
            setUiActionName: (name) => setUiActionState(prev => ({...prev, name })),
        },
    };
};