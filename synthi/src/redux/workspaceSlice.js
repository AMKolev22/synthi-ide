// src/redux/workspaceSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { api } from '@/services/api'; 
import { cancelUiAction } from './uiSlice'; // Cross-slice dependency
import {
    findFirstFile,
    findFileInTree,
    findFolderInTree,
    getFileLanguage,
    getItemPathInBucket,
} from '@/utils/fileUtils'; 

// --- Initial State and Utilities ---

const initialState = {
    slug: null, 
    rawFiles: [],
    activeFile: null,
    currentContent: '',
    savedContent: '',
    fileContentCache: new Map(), // Non-serializable object handled by middleware config
    isLoading: false,
    status: 'idle',
    error: null,
};

// --- ASYNC THUNKS (Side Effects and Persistence) ---

// 1. Fetch Files (Read)
export const fetchFilesThunk = createAsyncThunk(
    'workspace/fetchFiles',
    async (slug, { dispatch, getState }) => {
        const files = await api.fetchFiles(slug);
        const state = getState().workspace;

        // Determine if auto-selection is needed
        let fileToSelect = state.activeFile;
        if (!state.activeFile && files.length > 0) {
            fileToSelect = findFirstFile(files);
        }

        // Return files and potential file to select for the reducer
        return { files, fileToSelect };
    }
);

// 2. Save Content (Mutation)
export const saveFileContentThunk = createAsyncThunk(
    'workspace/saveContent',
    async (_, { dispatch, getState }) => {
        const state = getState().workspace;
        const { activeFile, currentContent, slug } = state;

        if (!activeFile || currentContent === state.savedContent) {
            return;
        }

        await api.saveFileContent(slug, activeFile.path, currentContent, activeFile.name);
        
        // Ensure tree is revalidated silently after save
        dispatch(fetchFilesThunk(slug)); 

        // Return content to update saved state and cache in the fulfilled reducer
        return currentContent; 
    }
);

// 3. File Selection (Manages cache and fetches content)
export const selectFileThunk = createAsyncThunk(
    'workspace/selectFile',
    async (file, { getState }) => {
        const state = getState().workspace;
        const cacheKey = file.path;
        const cachedContent = state.fileContentCache.get(cacheKey);
        
        if (cachedContent!== undefined) {
            return { file, content: cachedContent, fromCache: true };
        } 
        
        if (file.path) {
            const content = await api.fetchFileContent(state.slug, file.path);
            return { file, content, fromCache: false };
        }

        return { file, content: file.content || '', fromCache: false };
    }
);

// 4. Create Item (Mutation)
export const handleCreateItemThunk = createAsyncThunk(
    'workspace/createItem',
    async (_, { dispatch, getState }) => {
        const { ui, workspace } = getState();
        const { mode, target, name } = ui.uiActionState;
        const slug = workspace.slug;
        
        const isFolder = mode === 'create-folder';
        let finalName = name.trim();
        if (!finalName) throw new Error("Name cannot be empty.");

        // Validation logic (replicated from original hook)
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(finalName)) {
            throw new Error(`The name contains invalid characters.`);
        }

        const parentPath = (target && target.path)? `${target.path}/` : '';
        let fullPath;

        if (!isFolder) {
            if (!finalName.includes('.')) {
                finalName += '.txt';
            }
            fullPath = parentPath + finalName;
            if (findFileInTree(workspace.rawFiles, fullPath)) {
                throw new Error('A file with this name already exists.');
            }
        } else {
            fullPath = parentPath + finalName;
            if (findFolderInTree(workspace.rawFiles, fullPath)) {
                throw new Error('A folder with this name already exists.');
            }
        }

        await api.createItem(slug, fullPath, isFolder);
        
        // Dispatch cleanup and revalidation
        dispatch(cancelUiAction());
        await dispatch(fetchFilesThunk(slug));

        // If file created, select it
        if (!isFolder) {
            const newFile = {
                name: finalName,
                type: 'file',
                language: getFileLanguage(finalName),
                path: fullPath
            };
            dispatch(selectFileThunk(newFile));
        }
    }
);

// 5. Rename Item (Mutation)
export const handleRenameItemThunk = createAsyncThunk(
    'workspace/renameItem',
    async (_, { dispatch, getState }) => {
        const { ui, workspace } = getState();
        const { target: item, name: newName } = ui.uiActionState;
        const slug = workspace.slug;
        
        if (!newName.trim() || newName === item.name) {
            dispatch(cancelUiAction());
            return;
        }

        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(newName)) {
            throw new Error('New name contains invalid characters.');
        }

        const newPath = item.path.split('/').slice(0, -1).concat(newName).join('/') + (item.isFolder ? '/' : '');
        
        await api.renameItem(slug, getItemPathInBucket(item), newPath);

        // Perform complex state update in reducer/sync action
        dispatch(renameItemStateUpdate({ item, newName, newPath }));
        
        dispatch(cancelUiAction());
        await dispatch(fetchFilesThunk(slug));
    }
);


// 6. Delete Item (Mutation)
export const deleteItemThunk = createAsyncThunk(
    'workspace/deleteItem',
    async (item, { dispatch, getState }) => {
        const state = getState().workspace;
        
        const confirmMessage = item.isFolder
          ? `Are you sure you want to delete the folder "${item.name}" and all its contents?`
            : `Are you sure you want to delete the file "${item.name}"?`;
            
        if (!window.confirm(confirmMessage)) {
            return { deleted: false };
        }
        const itemPath = getItemPathInBucket(item);

        await api.deleteItem(state.slug, itemPath);
        
        await dispatch(fetchFilesThunk(state.slug));
        
        return { deleted: true, path: itemPath };
    }
);


// --- SLICE DEFINITION ---

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState,
    reducers: {
        // Synchronous reducers for quick state updates
        updateContent: (state, action) => {
            state.currentContent = action.payload || '';
        },
        // Utility reducer used by thunks for internal cleanup
        renameItemStateUpdate: (state, action) => {
            const { item, newName, newPath } = action.payload;

            // 1. Update Active File if renamed
            if (state.activeFile && state.activeFile.path === item.path) {
                state.activeFile.name = newName;
                state.activeFile.path = newPath;
            }

            // 2. Migrate cache entry (CRITICAL for data integrity)
            const cachedContent = state.fileContentCache.get(item.path);
            if (cachedContent!== undefined) {
                // Ensure state mutation safety by creating a new Map instance for Redux state
                const newMap = new Map(state.fileContentCache);
                newMap.delete(item.path);
                newMap.set(newPath, cachedContent);
                state.fileContentCache = newMap;
            }
        },
        setSlug: (state, action) => {
            state.slug = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Define mutation thunk prefixes for generic matcher logic
        const MUTATION_THUNK_TYPES = [
            'workspace/saveContent',
            'workspace/createItem',
            'workspace/renameItem',
            'workspace/deleteItem',
        ];

        // --- FETCH FILES ---
        builder
          .addCase(fetchFilesThunk.pending, (state) => {
                state.isLoading = true;
                state.status = 'pending';
                state.error = null;
            })
          .addCase(fetchFilesThunk.fulfilled, (state, action) => {
                state.rawFiles = action.payload.files;
                state.isLoading = false;
                state.status = 'succeeded';
                
                // If the thunk recommended auto-selection, perform it here
                if (action.payload.fileToSelect) {
                    state.activeFile = action.payload.fileToSelect;
                    // Note: Content selection happens via a subsequent selectFileThunk dispatch
                }
            })
          .addCase(fetchFilesThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.status = 'failed';
                state.error = action.error.message;
            });

        // --- SELECT FILE ---
        builder
          .addCase(selectFileThunk.fulfilled, (state, action) => {
                const { file, content, fromCache } = action.payload;
                
                // Cache unsaved content of OLD active file before switching
                if (state.activeFile && state.activeFile.path && state.currentContent!== state.savedContent) {
                    state.fileContentCache.set(state.activeFile.path, state.currentContent);
                }

                // Switch to new file
                state.activeFile = file;
                state.currentContent = content;
                state.savedContent = content;
                
                // Update cache if content was newly fetched (and not from cache)
                if (!fromCache) {
                    state.fileContentCache.set(file.path, content);
                }
            });

        // --- SAVE CONTENT ---
        builder
          .addCase(saveFileContentThunk.fulfilled, (state, action) => {
                if (action.payload) {
                    state.savedContent = action.payload;
                    state.fileContentCache.set(state.activeFile.path, action.payload);
                }
            });

        // --- DELETE ITEM ---
        builder
          .addCase(deleteItemThunk.fulfilled, (state, action) => {
                if (action.payload.deleted) {
                    const deletedPath = action.payload.path;
                    
                    // Clear cache
                    const newMap = new Map(state.fileContentCache);
                    newMap.delete(deletedPath);
                    state.fileContentCache = newMap;
                    
                    // Clear editor if active file was deleted
                    if (state.activeFile && state.activeFile.path === deletedPath) {
                        state.activeFile = null;
                        state.currentContent = '';
                        state.savedContent = '';
                    }
                }
            });

        // --- GENERIC MUTATION PENDING/REJECTED HANDLERS (FIXED) ---
        builder
          .addMatcher(
                (action) => MUTATION_THUNK_TYPES.some(type => action.type === `${type}/pending`),
                (state) => {
                    state.status = 'pending';
                }
            )
          .addMatcher(
                (action) => MUTATION_THUNK_TYPES.some(type => action.type === `${type}/rejected`),
                (state, action) => {
                    state.status = 'failed';
                    state.error = action.error.message;
                    window.alert(`Operation Failed: ${action.error.message}`);
                }
            )
          .addMatcher(
                (action) => MUTATION_THUNK_TYPES.some(type => action.type === `${type}/fulfilled`),
                (state) => {
                    state.status = 'succeeded';
                }
            );
    },
});

export const { updateContent, renameItemStateUpdate, setSlug } = workspaceSlice.actions;

// --- MEMOIZED SELECTORS ---

// Selector to build the file tree (expensive operation, memoize)
export const selectFilesTree = createSelector(
    (state) => state.workspace.rawFiles,
    (rawFiles) => {
        return rawFiles; 
    }
);

export const selectActiveFile = (state) => state.workspace.activeFile;
export const selectCurrentContent = (state) => state.workspace.currentContent;
export const selectIsUnsaved = createSelector(
    selectCurrentContent,
    (state) => state.workspace.savedContent,
    (current, saved) => current!== saved
);
export const selectBreadcrumb = createSelector(
    selectActiveFile,
    (activeFile) => activeFile? activeFile.path.split("/").filter(Boolean) : []
);

export default workspaceSlice.reducer;