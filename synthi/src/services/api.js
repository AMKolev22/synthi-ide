// src/services/api.js

// Utility to handle JSON responses and errors
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            // Ignore if response isn't JSON
        }
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }
    return response;
};

export const api = {
    // READ
    fetchFiles: async (slug) => {
        const response = await fetch(`/api/workspace/${slug}`);
        const data = await handleResponse(response).then(r => r.json());
        // Simulating the tree structure creation here (or it happens in a selector)
        return data.files; 
    },
    fetchFileContent: async (slug, filePath) => {
        const response = await fetch(`/api/workspace/${slug}/item?filePath=${encodeURIComponent(filePath)}`);
        return handleResponse(response).then(r => r.text());
    },

    // MUTATIONS (Write Operations)
    saveFileContent: async (slug, filePath, content, fileName) => {
        const formData = new FormData();
        const blob = new Blob([content], { type: 'text/plain' });
        formData.append('file', blob, fileName);
        formData.append('filePath', filePath);

        const response = await fetch(`/api/workspace/${slug}/item/`, {
            method: 'POST',
            body: formData,
        });
        return handleResponse(response);
    },
    
    createItem: async (slug, fullPath, isFolder) => {
        const formData = new FormData();
        // Extract file name from full path for blob append
        const fileName = fullPath.split('/').pop(); 
        const blob = new Blob([''], { type: 'text/plain' });
        formData.append('file', blob, fileName);
        formData.append('filePath', isFolder? `${fullPath}/` : fullPath);

        const response = await fetch(`/api/workspace/${slug}/item`, {
            method: 'POST',
            body: formData,
        });
        return handleResponse(response);
    },

    renameItem: async (slug, itemPath, newPath) => {
        const response = await fetch(`/api/workspace/${slug}/item`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemPath, newPath }),
        });
        return handleResponse(response);
    },

    deleteItem: async (slug, itemPath) => {
        const response = await fetch(`/api/workspace/${slug}/item`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemPath }),
        });
        return handleResponse(response);
    },
};