import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';

const storage = new Storage();

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

function buildFileTree(flatFiles, prefixLength) {
    const root = { name: 'root', isFolder: true, children: [] };

    flatFiles.forEach(file => {
        const relativePath = file.name.substring(prefixLength);
        if (!relativePath) return; 

        const parts = relativePath.split('/');
        
        let currentNode = root;

        for (let i = 0; i < parts.length; i++) {
            const partName = parts[i];
            const isLastPart = (i === parts.length - 1);
            
            if (isLastPart && partName === '') continue;
            
            let child = currentNode.children.find(c => c.name === partName);
            
            const isFolder = !isLastPart || file.name.endsWith('/'); 

            if (!child) {
                child = {
                    name: partName,
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
