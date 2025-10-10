import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'An id query parameter is required to fetch items.' }, { status: 400 });
    }

    try {
        const item = await prisma.workspaceItem.findUnique({
            where: {
                id
            },
            include: {
                children: {
                    select: { id: true, name: true, parentId: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        return NextResponse.json(item, { status: 200 });
    } catch (error) {
        console.error('Error fetching workspace items:', error);
        return NextResponse.json({ error: 'Failed to retrieve workspace items.' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, workspaceId, parentId } = await request.json();

        if (!name || !workspaceId) {
            return NextResponse.json({ error: 'Item name and workspaceId are required.' }, { status: 400 });
        }

        const newItem = await prisma.workspaceItem.create({
            data: {
                name,
                workspace: {
                    connect: { id: workspaceId },
                },
                parent: parentId ? { connect: { id: parentId } } : undefined,
            },
        });

        return NextResponse.json(newItem, { status: 201 });
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
        const { name, parentId } = await request.json();

        if (name === undefined && parentId === undefined) {
            return NextResponse.json({ error: 'At least one field (name or parentId) is required for update.' }, { status: 400 });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (parentId !== undefined) {
            updateData.parentId = parentId;
        }

        const updatedItem = await prisma.workspaceItem.update({
            where: { id },
            data: updateData,
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
        return NextResponse.json({ error: 'Item ID is required in the query parameters for deletion.' }, { status: 400 });
    }

    try {
        await prisma.workspaceItem.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Workspace item deleted successfully.' }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.code === 'P2025') {
            return NextResponse.json({ error: 'Workspace item not found.' }, { status: 404 });
        }
        console.error('Error deleting workspace item:', error);
        return NextResponse.json({ error: 'Failed to delete workspace item.' }, { status: 500 });
    }
}