/**
 * Determines the file language for Monaco Editor based on the file extension.
 * @param {string} fileName 
 * @returns {string} The language ID.
 */
export const getFileLanguage = (fileName) => {
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


/**
 * Finds a file in the recursive tree and updates its content (used for local caching).
 * @param {Array<Node>} currentFiles - The current file tree structure.
 * @param {Object} targetFile - The file object to update.
 * @param {string} newContent - The new content string.
 * @returns {Array<Node>} A new array with the file content updated immutably.
 */
export const findFileAndUpdate = (currentFiles, targetFile, newContent) => {
    return currentFiles.map(item => {
        if (item.type === 'file' && item.path === targetFile.path) {
            return {...item, content: newContent };
        }
        if (item.type === 'folder' && item.children) {
            return {...item, children: findFileAndUpdate(item.children, targetFile, newContent) };
        }
        return item;
    });
};



/**
 * Finds the first actual file in the tree for initial selection.
 * @param {Array<Node>} nodes - File tree nodes.
 * @returns {Object | null} The first file node found.
 */
export const findFirstFile = (nodes) => {
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

// TO DO: MERGE findFileInTree and findFolderInTree into a single function with a type parameter.

/**
 * Recursively finds a file by name for existence check (Creation validation).
 * @param {Array<Node>} nodes - File tree nodes.
 * @param {string} fileName - Name of the file to find.
 * @returns {Object | null} The file node found.
 */
export const findFileInTree = (nodes, fileName) => {
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


/**
 * Recursively finds a folder by name for existence check (Creation validation).
 * @param {Array<Node>} nodes - File tree nodes.
 * @param {string} folderName - Name of the folder to find.
 * @returns {Object | null} The folder node found.
 */
export const findFolderInTree = (nodes, folderName) => {
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