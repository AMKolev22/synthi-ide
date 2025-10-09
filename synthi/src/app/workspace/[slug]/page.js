'use client';
import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const deepCloneFiles = (files) => {
  return JSON.parse(JSON.stringify(files));
};

// const INITIAL_FILES_DATA = [
//   { name: 'src', type: 'folder', children: [
//     { name: 'components', type: 'folder', children: [
//       { name: 'Header.js', type: 'file', language: 'javascript', content: "function Header() {\n  return <h1>Site Header</h1>;\n}" },
//       { name: 'Footer.js', type: 'file', language: 'javascript', content: "const Footer = () => <footer>© 2025</footer>;\nexport default Footer;" },
//     ]},
//     { name: 'pages', type: 'folder', children: [
//       { name: 'index.js', type: 'file', language: 'javascript', content: "console.log('Welcome to the Synthi project.');" },
//       { name: 'about.js', type: 'file', language: 'javascript', content: "/* About page is currently empty */" },
//     ]},
//     { name: 'styles.css', type: 'file', language: 'css', content: "body { background-color: #1e1e1e; color: #fff; }" },
//     { name: 'auth.js', type: 'file', language: 'javascript', content: "/* Auth logic goes here */" },
//   ]},
//   { name: 'public', type: 'folder', children: [
//     { name: 'favicon.ico', type: 'file', language: 'plaintext', content: "Binary content..." },
//     { name: 'logo.png', type: 'file', language: 'plaintext', content: "Binary content..." },
//   ]},
//   { name: 'package.json', type: 'file', language: 'json', content: '{\n  "name": "Synthi",\n  "version": "1.0.0"\n}' },
//   { name: 'README.md', type: 'file', language: 'markdown', content: '# Synthi\n\nCloud AI IDE' },
// ];

const INITIAL_FILES_DATA = [
  { name: 'src', type: 'folder', children: [
    { name: 'main.cpp', type: 'file', language: 'cpp', content: 
      "#include \"core/Logger.h\"\n\n" +
      "int main() {\n" +
      "    Logger::log(\"Application started.\");\n" +
      "    // Main application logic here\n" +
      "    Logger::log(\"Application finished successfully.\");\n" +
      "    return 0;\n" +
      "}" 
    },
    { name: 'utility.cpp', type: 'file', language: 'cpp', content: 
      "#include \"../include/utility.h\"\n\n" +
      "int add(int a, int b) {\n" +
      "    return a + b;\n" +
      "}" 
    },
  ]},
  { name: 'include', type: 'folder', children: [
    { name: 'utility.h', type: 'file', language: 'cpp', content: 
      "#pragma once\n\n" +
      "int add(int a, int b);\n" 
    },
    { name: 'core', type: 'folder', children: [
      { name: 'Logger.h', type: 'file', language: 'cpp', content: 
        "#pragma once\n#include <iostream>\n\n" +
        "class Logger {\n" +
        "public:\n" +
        "    static void log(const std::string& message) {\n" +
        "        std::cout << \"[LOG] \" << message << std::endl;\n" +
        "    }\n" +
        "};\n" 
      }
    ]}
  ]},
  { name: 'build', type: 'folder', children: [
    { name: '.gitkeep', type: 'file', language: 'plaintext', content: "Placeholder for build output" }
  ]},
  { name: 'CMakeLists.txt', type: 'file', language: 'cmake', content: 
    "cmake_minimum_required(VERSION 3.10)\n" +
    "project(SimpleCppProject)\n\n" +
    "set(CMAKE_CXX_STANDARD 17)\n\n" +
    "include_directories(include)\n\n" +
    "add_executable(app src/main.cpp src/utility.cpp)\n" 
  },
  { name: 'README.md', type: 'file', language: 'markdown', content: 
    "# Simple C++ Project\n\n" +
    "A basic C++ project structure using CMake.\n" 
  }
];

const ChevronIcon = ({ isOpen, isSelected }) => (
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

const FileIcon = ({ type, isSelected }) => {
  if (type === 'folder') return null;
  
  const iconMap = {
    javascript: <svg className={`w-4 h-4 mr-2 ${isSelected ? 'text-white' : 'text-yellow-300'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.25 15.25c-.25 0-.5-.12-.75-.37l-1.5-1.5-.75.75-.75-.75-1.5 1.5c-.25.25-.5.37-.75.37s-.5-.12-.75-.37c-.5-.5-.5-1.25 0-1.75l1.5-1.5-1.5-1.5c-.5-.5-.5-1.25 0-1.75.5-.5 1.25-.5 1.75 0l1.5 1.5 1.5-1.5c.5-.5 1.25-.5 1.75 0s.5 1.25 0 1.75L15.5 14l1.5 1.5c.5.5.5 1.25 0 1.75-.25.25-.5.37-.75.37z"/></svg>,
    css: <svg className={`w-4 h-4 mr-2 ${isSelected ? 'text-white' : 'text-blue-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16H8.5c-.55 0-1-.45-1-1v-2h2c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1h-2V7h3c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H7.5c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h2v1c0 .55-.45 1-1 1h-2v2h3c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1z"/></svg>,
    json: <svg className={`w-4 h-4 mr-2 ${isSelected ? 'text-white' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H8V8h3V4h2v4h3v4h-3v4z"/></svg>,
    markdown: <svg className={`w-4 h-4 mr-2 ${isSelected ? 'text-white' : 'text-blue-300'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M16 18H8V6h8v12zm0-2h-2v-2h2v2zm0-4h-2V8h2v4zM22 6v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2z"/></svg>,
    default: <svg className={`w-4 h-4 mr-2 ${isSelected ? 'text-white' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
  };

  return iconMap[type] || iconMap.default;
};

const FileItem = ({ item, level = 0, onFileSelect, activeFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingStyle = { paddingLeft: `${level * 16 + 16}px` };

  const isSelected = activeFile && activeFile.name === item.name && activeFile.language === item.language;

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(item);
    }
  };

  return (
    <>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer transition duration-200 rounded-sm ${isSelected ? 'bg-gray-600 text-white' : 'hover:bg-gray-700'}`}
        style={paddingStyle}
        onClick={handleClick}
      >
        {item.type === 'folder' && <ChevronIcon isOpen={isOpen} isSelected={isSelected} />}
        <FileIcon type={item.type === 'folder' ? 'folder' : item.language} isSelected={isSelected} />
        <span className={`text-sm truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{item.name}</span>
      </div>
      {item.type === 'folder' && isOpen && item.children && (
        <div className="flex flex-col">
          {item.children.map((child, index) => (
            <FileItem
              key={index}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </>
  );
};

const FileTreeView = ({ files, onFileSelect, activeFile }) => (
  <div className="w-full h-full bg-gray-800 text-white flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
    <div className="px-3 py-2 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
      <div className="flex items-center">
        <span className="text-sm text-gray-200">Project</span>
      </div>
    </div>
    <div className="flex-grow">
      {files.map((item, index) => (
        <FileItem key={index} item={item} onFileSelect={onFileSelect} activeFile={activeFile} />
      ))}
    </div>
  </div>
);

export default function EditorPage() {
  const [files, setFiles] = useState(deepCloneFiles(INITIAL_FILES_DATA));
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('');

  const handleFileSelect = (file) => {
    if (activeFile) {
      const updatedFiles = findFileAndUpdate(files, activeFile, code);
      setFiles(updatedFiles);
    }

    setActiveFile(file);
    setCode(file.content || '');
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode || '');
  };

  useEffect(() => {
    if (!activeFile && files.length > 0) {
      const defaultFile = files[0]?.children?.[0]?.children?.[0] || files[0];
      setActiveFile(defaultFile);
      setCode(defaultFile?.content || '');
    }
  }, [files]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 dark">
      
      <div className="flex flex-1 overflow-hidden">
        
        <div className="w-72 flex-shrink-0 border-r border-gray-700 h-full overflow-hidden">
          <FileTreeView files={files} onFileSelect={handleFileSelect} activeFile={activeFile} />
        </div>
        
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 h-full">
          
          <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 shadow-sm">
              <div className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border-t-2 border-blue-500">
                  {activeFile ? activeFile.name : 'No file selected'}
              </div>
              
              
              <div className="mr-3">
                  
                  <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-white border-gray-600 hover:bg-gray-700"
                      onClick={onRun}
                  >
                      Run
                  </Button>
              </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              key={activeFile ? activeFile.name : 'no-file'}
              height="100%"
              value={code}
              language={activeFile ? activeFile.language : 'plaintext'}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}