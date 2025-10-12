import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Storage } from '@google-cloud/storage';


const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

const prisma = new PrismaClient();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'An id query parameter is required to fetch workspace.' }, { status: 400 });
    }

    try {
        const workspace = await prisma.workspace.findUnique({
            where: {
                id
            }
        });

        return NextResponse.json(workspace, { status: 200 });
    } catch (error) {
        console.error('Error fetching workspace items:', error);
        return NextResponse.json({ error: 'Failed to retrieve workspace items.' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Workspace name is required.' }, { status: 400 });
        }

        const newWorkspace = await prisma.workspace.create({
            data: { name },
        });

        const rootFolderPath = `workspaces/${newWorkspace.id}/`;
        const bucket = storage.bucket(BUCKET_NAME);
        
        await bucket.file(rootFolderPath).save('', {
            contentType: 'application/x-directory',
            resumable: false,
            metadata: {
                cacheControl: 'no-cache',
                metadata: {
                    isFolder: 'true',
                    name: newWorkspace.name,
                    createdBy: 'synthi-ide',
                    isMarker: 'true'
                }
            }
        });

        return NextResponse.json(newWorkspace, { status: 201 });
    } catch (error) {
        console.error('Error creating workspace item:', error);
        return NextResponse.json({ error: 'Failed to create workspace item.' }, { status: 500 });
    }
}

export async function PUT(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Item ID is required in the query parameters for updating.' }, { status: 400 });
    }

    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'At least one field (name or parentId) is required for update.' }, { status: 400 });
        }

        const updatedItem = await prisma.workspace.update({
            where: { id },
            data: { name },
        });

        return NextResponse.json(updatedItem, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.code === 'P2025') {
            return NextResponse.json({ error: 'Workspace item not found.' }, { status: 404 });
        }
        console.error('Error updating workspace item:', error);
        return NextResponse.json({ error: 'Failed to update workspace item.' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Workspace ID is required in the query parameters for deletion.' }, { status: 400 });
    }

    try {
        const storagePathPrefix = `workspaces/${id}/`;
        
        await storage.bucket(BUCKET_NAME).deleteFiles({
            prefix: storagePathPrefix,
            force: true, 
        });

        await prisma.workspace.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Workspace deleted successfully.' }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.code === 'P2025') {
            return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
        }
        console.error('Error deleting workspace:', error);
        return NextResponse.json({ error: 'Failed to delete workspace.' }, { status: 500 });
    }
}