'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, FolderOpen, Code, Terminal, GitBranch, UploadCloud, Sun, Moon } from 'lucide-react';

const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children, defaultTheme = 'system', storageKey = 'vite-ui-theme', }) => {
  const [theme, setTheme] = useState(() => {
    let storedTheme;
    if (typeof window !== 'undefined') {
      storedTheme = localStorage.getItem(storageKey);
    }
    return storedTheme || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme);
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      ) : (
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};


const LocalFolderSelector = ({ onSelectFiles, onBack }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'bg-accent/30');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-accent/30');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-accent/30');
    if (onSelectFiles) {
      onSelectFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (onSelectFiles) {
      onSelectFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="mb-4" onClick={onBack}>
        &larr; Back to Recent Projects
      </Button>
      <h2 className="text-3xl font-extrabold mb-1">Open Local Folder</h2>
      <p className="text-muted-foreground">Select files or drag-and-drop a folder to begin.</p>
      
      <Card 
        className="border-2 border-dashed h-64 flex flex-col items-center justify-center transition-colors hover:border-muted-foreground/50"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <UploadCloud className="w-12 h-12 text-primary mb-4" />
          <p className="text-lg font-semibold mb-2">Drag and drop files or folders here</p>
          <p className="text-sm text-muted-foreground mb-4">or</p>
          
          <input
            type="file"
            id="file-upload"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            multiple
          />
          
          <Button onClick={() => document.getElementById('file-upload').click()}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        </CardContent>
      </Card>
      
      <p className="text-sm text-center text-muted-foreground">
        *Drag-and-drop folder support is browser-dependent.
      </p>
    </div>
  );
};


const mockRecentProjects = [
  { id: '1', name: 'Taskify-Frontend', path: 'C:/Users/dev/repos/taskify-frontend/this/is/a/very/long/path/that/needs/to/wrap/correctly/in/the/start/window', lastOpened: '3 hours ago' },
  { id: '2', name: 'API-Gateway-v2', path: 'D:/Projects/API-Gateway-v2/src/services/api-gateway-management', lastOpened: 'Yesterday' },
  { id: '3', name: 'shadcn-dashboard-starter', path: 'C:/Users/dev/repos/shadcn-dashboard-starter', lastOpened: '3 days ago' },
  { id: '4', name: 'Authentication-Service', path: 'D:/Projects/Authentication-Service/v3/auth-core-service', lastOpened: '1 week ago' },
  { id: '5', name: 'React-Portfolio-2024', path: 'C:/Users/dev/personal/react-portfolio-2024/client/public/assets', lastOpened: '2 weeks ago' },
  { id: '6', name: 'Legacy-Billing-System', path: 'D:/OldProjects/Legacy-Billing-System/database/migrations/archive', lastOpened: '1 month ago' },
  { id: '7', name: 'Microservice-Logger', path: 'C:/Users/dev/repos/microservice-logger/deployment/k8s/prod', lastOpened: '3 months ago' },
];

const RecentProjectItem = ({ name, path, lastOpened }) => (
  <Card 
    className="mb-2 cursor-pointer hover:bg-accent transition-colors"
    onClick={() => alert(`Opening project: ${name}`)}
  >
    <CardContent className="p-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1 min-w-0 pr-4"> 
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-xs text-muted-foreground whitespace-normal break-words" title={path}>{path}</p>
        </div>
        <p className="text-xs text-muted-foreground flex-shrink-0">{lastOpened}</p>
      </div>
    </CardContent>
  </Card>
);

const ActionButton = ({ Icon, title, description, onClick }) => (
  <Button 
    variant="ghost" 
    className="h-auto w-full p-4 justify-start space-x-4 mb-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
    onClick={onClick}
  >
    <Icon className="h-6 w-6 text-primary" />
    <div className="flex flex-col items-start text-left">
      <span className="font-semibold text-base">{title}</span>
      <span className="text-sm text-muted-foreground max-w-full text-wrap">{description}</span> 
    </div>
  </Button>
);

export const StartWindowContent = () => {
  const [view, setView] = useState('recents');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = mockRecentProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const RecentsView = () => (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold mb-1">Get started</h2>
        <p className="text-muted-foreground">Select a recent project to continue, or choose an action on the left.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recent projects"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h3 className="text-lg font-semibold mb-3">Recent Projects</h3>
      <ScrollArea className="h-[calc(100vh-250px)] pr-4"> 
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <RecentProjectItem key={project.id} {...project} />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-10">
            No recent projects found matching "{searchTerm}".
          </p>
        )}
      </ScrollArea>
    </>
  );

  const handleFilesSelected = (files) => {
    alert(`Received ${files.length} items. Ready to open!`);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden"> 
      
      <div className="w-[300px] border-r bg-card/50 dark:bg-card/30 p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Synthi</h1>
            </div>
            <ThemeToggle /> 
          </div>
          
          <Separator />

          <div className="space-y-1">
            <ActionButton
              Icon={GitBranch}
              title="Clone a repository"
              description="Check out code from Git, GitHub, or Azure DevOps"
              onClick={() => alert('Clone repository action')}
            />
            <ActionButton
              Icon={FolderOpen}
              title="Open a local folder"
              description="Open any local folder to start coding"
              onClick={() => setView('folder-selector')}
            />
            <ActionButton
              Icon={FolderOpen}
              title="Open a project or solution"
              description="Open a .sln, .csproj, or other project file"
              onClick={() => alert('Open project/solution action')}
            />
          </div>
        </div>

        <div className="mt-auto">
          <Separator className="mb-4" />
          <ActionButton
            Icon={Terminal}
            title="Create a new project"
            description="Start fresh with a project template"
            onClick={() => alert('Create new project action')}
          />
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto"> 
        {view === 'recents' ? (
          <RecentsView />
        ) : (
          <LocalFolderSelector 
            onSelectFiles={handleFilesSelected}
            onBack={() => setView('recents')}
          />
        )}
      </div>
    </div>
  );
};


export const VSStartWindow = () => (
    <ThemeProvider>
        <StartWindowContent />
    </ThemeProvider>
);

export default VSStartWindow;