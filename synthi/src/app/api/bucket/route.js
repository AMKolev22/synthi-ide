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

export async function GET(req) {
    if (!BUCKET_NAME) {
        return NextResponse.json({ error: 'Bucket name not configured' }, { status: 500 });
    }

    try {
        const bucket = storage.bucket(BUCKET_NAME);
        
        // Get all files from the bucket
        const [files] = await bucket.getFiles();
        
        // Return just the file names and basic metadata
        const fileList = files.map(file => ({
            name: file.name,
            size: file.metadata.size,
            contentType: file.metadata.contentType,
            timeCreated: file.metadata.timeCreated,
            updated: file.metadata.updated
        }));

        return NextResponse.json({ 
            success: true, 
            files: fileList 
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching bucket files:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch files from bucket' 
        }, { status: 500 });
    }
}
