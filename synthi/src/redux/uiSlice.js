// src/redux/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialUiActionState = {
    mode: 'none', // 'create-file', 'create-folder', 'rename'
    target: null, // target item for rename/parent for create
    name: '', // current name in the input
};

const initialState = {
    showTerminal: false,
    treeOnRight: false,
    autoSaveEnabled: false,
    uiActionState: initialUiActionState,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Layout Reducers
        toggleTerminal: (state) => {
            state.showTerminal = !state.showTerminal;
        },
        setTreeOrientation: (state) => {
            state.treeOnRight = !state.treeOnRight;
        },
        toggleAutoSave: (state) => {
            state.autoSaveEnabled = !state.autoSaveEnabled;
        },
        
        // UI Action State Machine Reducers
        startCreate: (state, action) => {
            const { type, target } = action.payload; // type: 'file' or 'folder'
            state.uiActionState = {
                mode: `create-${type}`,
                target: target,
                name: '',
            };
        },
        startRename: (state, action) => {
            const target = action.payload;
            state.uiActionState = {
                mode: 'rename',
                target: target,
                name: target.name,
            };
        },
        setUiActionName: (state, action) => {
            state.uiActionState.name = action.payload;
        },
        cancelUiAction: (state) => {
            state.uiActionState = initialUiActionState;
        },
    },
});

export const {
    toggleTerminal,
    setTreeOrientation,
    toggleAutoSave,
    startCreate,
    startRename,
    setUiActionName,
    cancelUiAction,
} = uiSlice.actions;

// Selectors
export const selectShowTerminal = (state) => state.ui.showTerminal;
export const selectTreeOnRight = (state) => state.ui.treeOnRight;
export const selectAutoSaveEnabled = (state) => state.ui.autoSaveEnabled;
export const selectUiActionState = (state) => state.ui.uiActionState;

export default uiSlice.reducer;