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

export const config = {
    api: {
        bodyParser: false, 
    },
};

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    
    if (!BUCKET_NAME) {
        return NextResponse.json({ error: 'Bucket name not configured' }, { status: 500 });
    }

    try {
        const bucket = storage.bucket(BUCKET_NAME);
        const file = bucket.file(fileId);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json({ error: `File with ID ${fileId} not found.` }, { status: 404 });
        }

        // Check if this is a folder marker file
        const [metadata] = await file.getMetadata();
        if (metadata.metadata && metadata.metadata.isFolder === 'true') {
            return NextResponse.json({ error: 'Cannot read folder content' }, { status: 400 });
        }

        // Download file content as text
        const [content] = await file.download();
        const textContent = content.toString('utf8');
        
        return new NextResponse(textContent, { 
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('Error reading file:', error);
        return NextResponse.json({ error: `Failed to read file ${fileId}.` }, { status: 500 });
    }
}

export async function POST(req) {
    if (!BUCKET_NAME) {
        return NextResponse.json({ error: 'GCS Bucket name not configured.' }, { status: 500 });
    }

    try {
        const data = await req.formData();
        const file = data.get('file');
        const fileId = data.get('fileId');
        
        if (!fileId) {
            return NextResponse.json({ error: 'fileId is required in the request body.' }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        const originalFileName = file.name;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const bucket = storage.bucket(BUCKET_NAME);
        const blob = bucket.file(fileId);

        await new Promise((resolve, reject) => {
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: file.type,
                    metadata: {
                        originalName: originalFileName,
                    }
                }
            });

            blobStream.on('error', (err) => {
                console.error("GCS Upload Error:", err);
                reject(new Error('GCS upload failed.'));
            });

            blobStream.on('finish', () => {
                resolve();
            });

            blobStream.end(buffer);
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'Internal server error during upload.' }, { status: 500 });
    }
}