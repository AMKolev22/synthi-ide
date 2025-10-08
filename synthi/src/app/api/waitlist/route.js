import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Try to find existing waitlist
    let waitlist = await prisma.waitlist.findFirst();

    if (waitlist) {
      // Check if email already exists
      if (waitlist.emails.includes(email)) {
        return NextResponse.json(
          { message: "Email already on waitlist" },
          { status: 200 }
        );
      }

      // Add email to existing waitlist
      waitlist = await prisma.waitlist.update({
        where: { id: waitlist.id },
        data: {
          emails: {
            push: email
          }
        }
      });
    } else {
      // Create new waitlist with first email
      waitlist = await prisma.waitlist.create({
        data: {
          emails: [email]
        }
      });
    }

    return NextResponse.json(
      { message: "Successfully added to waitlist", data: waitlist },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}


export async function GET(req) {
    try {
      const waitlist = await prisma.waitlist.findFirst();
  
      if (!waitlist) {
        return NextResponse.json(
          { message: "No waitlist found", emails: [] },
          { status: 200 }
        );
      }
  
      return NextResponse.json(
        { 
          message: "Waitlist retrieved successfully",
          count: waitlist.emails.length,
          emails: waitlist.emails 
        },
        { status: 200 }
      );
  
    } catch (error) {
      console.error("Waitlist error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve waitlist" },
        { status: 500 }
      );
    }
  }