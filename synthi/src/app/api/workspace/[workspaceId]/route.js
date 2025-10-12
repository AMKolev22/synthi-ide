import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

function buildFileTree(flatFiles, prefixLength) {
    const root = { name: 'root', isFolder: true, children: [], path: '' };

    flatFiles.forEach(file => {
        // The path relative to the workspace root (e.g., 'folder/file.txt' or 'folder/')
        const relativePath = file.name.substring(prefixLength);
        if (!relativePath) return; 

        // Filter(Boolean) handles trailing slashes by removing the final empty segment
        const parts = relativePath.split('/').filter(Boolean);
        
        let currentNode = root;
        let cumulativePath = '';

        for (let i = 0; i < parts.length; i++) {
            const partName = parts[i];
            const isLastPart = (i === parts.length - 1);
            
            // Determine if the current part represents a folder (true if it's not the last part, or if the original file path ends with a slash)
            const isFolder = !isLastPart || file.name.endsWith('/'); 
            
            // Build the cumulative path for the current part
            // Example: "folder" -> "folder/file"
            cumulativePath = cumulativePath ? `${cumulativePath}/${partName}` : partName;

            // Look up existing child using the segment name (partName)
            let child = currentNode.children.find(c => c.name === partName);
            
            if (!child) {
                // Create new node with segment name (no slash added to name property)
                child = {
                    name: partName, // Corrected: Name is just the segment (e.g., "testFolder")
                    path: cumulativePath,
                    isFolder: isFolder,
                    children: isFolder ? [] : undefined,
                };
                
                if (!isFolder && isLastPart) {
                    child.size = file.metadata.size;
                    child.contentType = file.metadata.contentType;
                    child.updated = file.metadata.updated;
                }
                currentNode.children.push(child);
            }
            
            // Traverse to the next node if it's a folder
            if (isFolder) {
                 currentNode = child;
            }
        }
    });

    return root.children;
}


export async function GET(request, { params }) {
    const { workspaceId } = params;

    if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID is required.' }, { status: 400 });
    }

    const storagePathPrefix = `workspaces/${workspaceId}/`;

    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles({
            prefix: storagePathPrefix,
            autoPaginate: true, 
        });

        const prefixLength = storagePathPrefix.length;
        const fileTree = buildFileTree(files, prefixLength);

        return NextResponse.json({ files: fileTree }, { status: 200 });

    } catch (error) {
        console.error('GCS Listing Error:', error);
        return NextResponse.json({ error: 'Internal server error during content listing.' }, { status: 500 });
    }
}
