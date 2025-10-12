"use client"
import { Folder, FolderOpen, FileCode2, FileJson, FileType, FileText } from 'lucide-react';

export const ChevronIcon = ({ isOpen, isSelected }) => (
  <svg
    className={`w-3 h-3 mr-1 transition-transform duration-200 ${isSelected ? 'text-white' : 'text-gray-400'} ${isOpen ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const FileIcon = ({ node, isSelected }) => {
  if (node.isFolder) {
    return node.__open ? (
      <FolderOpen className={`w-4 h-4 mr-2 ${isSelected ? 'text-gray-100' : 'text-gray-300'}`} />
    ) : (
      <Folder className={`w-4 h-4 mr-2 ${isSelected ? 'text-gray-100' : 'text-gray-300'}`} />
    );
  }
  const name = node.name.toLowerCase();
  if (name.endsWith('.json')) return <FileJson className={`w-4 h-4 mr-2 ${isSelected ? 'text-green-300' : 'text-green-400'}`} />;
  if (name.endsWith('.md')) return <FileText className={`w-4 h-4 mr-2 ${isSelected ? 'text-blue-300' : 'text-blue-400'}`} />;
  if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode2 className={`w-4 h-4 mr-2 ${isSelected ? 'text-yellow-200' : 'text-yellow-300'}`} />;
  if (name.endsWith('.cpp') || name.endsWith('.h') || name.endsWith('.hpp')) return <FileType className={`w-4 h-4 mr-2 ${isSelected ? 'text-cyan-200' : 'text-cyan-300'}`} />;
  return <FileText className={`w-4 h-4 mr-2 ${isSelected ? 'text-gray-200' : 'text-gray-400'}`} />;
};