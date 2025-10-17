// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './workspaceSlice';
import uiReducer from './uiSlice';

import { enableMapSet } from 'immer';

enableMapSet();


export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    ui: uiReducer,
  },
  // We need to disable the serializable check for the Map used in fileContentCache
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['workspace/selectFile/fulfilled', 'workspace/selectFile/pending'],
        ignoredPaths: ['workspace.fileContentCache'],
      },
    }),
});
