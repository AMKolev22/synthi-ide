// src/redux/hooks.js
import { useDispatch, useSelector } from 'react-redux';
// Import RootState and AppDispatch types (for TS, but good practice for JS docs)
// import type { RootState, AppDispatch } from './store'; 

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;