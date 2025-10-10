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
        const { path, isFolder } = await req.json();
        
        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        const bucket = storage.bucket(BUCKET_NAME);
        
        if (isFolder) {
            // Delete folder and all its contents
            const [files] = await bucket.getFiles({
                prefix: path.endsWith('/') ? path : `${path}/`
            });
            
            // Delete all files in the folder
            if (files.length > 0) {
                await Promise.all(files.map(file => file.delete()));
            }
            
            // Also delete the folder marker file if it exists
            const folderFile = bucket.file(path.endsWith('/') ? path : `${path}/`);
            const [folderExists] = await folderFile.exists();
            if (folderExists) {
                await folderFile.delete();
            }
        } else {
            // Delete single file
            const file = bucket.file(path);
            const [exists] = await file.exists();
            if (!exists) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }
            await file.delete();
        }

        return NextResponse.json({ 
            success: true, 
            message: isFolder ? 'Folder and all contents deleted successfully' : 'File deleted successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ 
            error: 'Failed to delete file or folder' 
        }, { status: 500 });
    }
}
