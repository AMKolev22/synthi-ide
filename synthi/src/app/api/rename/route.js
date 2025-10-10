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
        const { oldPath, newName, isFolder } = await req.json();
        
        if (!oldPath || !newName) {
            return NextResponse.json({ error: 'Old path and new name are required' }, { status: 400 });
        }

        // Validate new name for invalid characters
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(newName)) {
            return NextResponse.json({ error: 'Name contains invalid characters' }, { status: 400 });
        }

        const bucket = storage.bucket(BUCKET_NAME);
        
        // Determine new path
        const pathParts = oldPath.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');
        
        // Check if new name already exists
        const newFile = bucket.file(newPath);
        const [exists] = await newFile.exists();
        if (exists) {
            return NextResponse.json({ error: 'A file or folder with this name already exists' }, { status: 400 });
        }

        // Get the old file
        const oldFile = bucket.file(oldPath);
        const [oldExists] = await oldFile.exists();
        if (!oldExists) {
            return NextResponse.json({ error: 'File or folder not found' }, { status: 404 });
        }

        // Copy to new location
        await oldFile.copy(newFile);
        
        // Delete old file
        await oldFile.delete();

        return NextResponse.json({ 
            success: true, 
            message: 'Renamed successfully',
            newPath: newPath
        }, { status: 200 });

    } catch (error) {
        console.error('Error renaming:', error);
        return NextResponse.json({ 
            error: 'Failed to rename file or folder' 
        }, { status: 500 });
    }
}
