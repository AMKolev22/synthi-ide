import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

export async function POST(req) {
    if (!BUCKET_NAME) {
        return NextResponse.json({ error: 'Bucket name not configured' }, { status: 500 });
    }

    try {
        const { folderName, parentPath } = await req.json();
        
        if (!folderName) {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        // Create folder path - folders in GCS are represented by files ending with '/'
        const folderPath = parentPath ? `${parentPath}/${folderName}/` : `${folderName}/`;
        
        const bucket = storage.bucket(BUCKET_NAME);
        const folderFile = bucket.file(folderPath);

        // Create a minimal placeholder file to represent the folder
        // Use a special marker that won't interfere with file operations
        await folderFile.save('__FOLDER_MARKER__', {
            metadata: {
                contentType: 'application/x-directory',
                cacheControl: 'no-cache',
                metadata: {
                    isFolder: 'true',
                    name: folderName,
                    createdBy: 'synthi-ide',
                    isMarker: 'true'
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Folder created successfully',
            folderPath: folderPath
        }, { status: 200 });

    } catch (error) {
        console.error('Error creating folder:', error);
        return NextResponse.json({ 
            error: 'Failed to create folder' 
        }, { status: 500 });
    }
}
