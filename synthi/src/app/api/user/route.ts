import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
        return NextResponse.json({ error: 'A userId or email query parameter is required to fetch user data.' }, { status: 400 });
    }

    const identifier = userId
        ? { id: userId as string }
        : email
            ? { email: email as string }
            : null;

    if (!identifier) {
        return NextResponse.json({ error: 'Invalid query parameters provided.' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: identifier,
            include: {
                workspaces: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to retrieve user data.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { email } = (await request.json());

        if (!email) {
            return NextResponse.json({ error: 'Email is required for user creation.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
        }

        const newUser = await prisma.user.create({
            data: {
                email: email,
            },
            select: { id: true, email: true, createdAt: true },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
    }
}

/*export async function PUT(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required in the query parameters for updating.' }, { status: 400 });
    }

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required for user update.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { email: email },
            select: { id: true, email: true, updatedAt: true }
        });

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
    }
}*/

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required in the query parameters for deletion.' }, { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
    }
}
