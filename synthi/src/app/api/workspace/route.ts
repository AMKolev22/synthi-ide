import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export async function POST(request: NextRequest) {
    try {
        const { name, userId } = await request.json();

        if (!name || !userId) {
            return NextResponse.json({ error: 'Workspace name and initial user ID are required.' }, { status: 400 });
        }

        const newWorkspace = await prisma.workspace.create({
            data: {
                name: name,
                users: {
                    connect: { id: userId },
                },
            },
            include: {
                users: { select: { id: true, email: true } },
            },
        });

        return NextResponse.json(newWorkspace, { status: 201 });
    } catch (error) {
        console.error('Error creating workspace:', error);
        return NextResponse.json({ error: 'Failed to create workspace.' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    let whereClause = {};

    if (!userId && !id) {
        return NextResponse.json({ error: 'Please provide at least 1 query parameter(userId, or id)' }, { status: 401 });
    }

    whereClause = id ? { id: id } : {
        users: {
            some: {
                id: userId,
            },
        },
    };

    try {
        const workspaces = await prisma.workspace.findMany({
            where: whereClause,
            include: {
                users: { select: { id: true, email: true } },
                items: id ? { select: { id: true, name: true, parentId: true } } : false,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        if (id){
            workspaces.forEach((workspace) => {
                // find root elements
                workspace.items = workspace.items.filter(item => item.parentId === null);
            });
        }
        

        return NextResponse.json(workspaces, { status: 200 });
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        return NextResponse.json({ error: 'Failed to retrieve workspaces.' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID is required in the query parameters for updating.' }, { status: 400 });
    }

    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'New workspace name is required in the body.' }, { status: 400 });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: name },
            include: { users: { select: { id: true, email: true } } }
        });

        return NextResponse.json(updatedWorkspace, { status: 200 });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
             return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
        }
        console.error('Error updating workspace:', error);
        return NextResponse.json({ error: 'Failed to update workspace.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID is required in the query parameters for deletion.' }, { status: 400 });
    }

    try {
        await prisma.workspace.delete({
            where: { id: workspaceId },
        });

        return NextResponse.json({ message: `Workspace ${workspaceId} deleted successfully.` }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
             return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
        }
        console.error('Error deleting workspace:', error);
        return NextResponse.json({ error: 'Failed to delete workspace.' }, { status: 500 });
    }
}
