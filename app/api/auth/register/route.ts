import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, advisorId, orcid } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "estudiante",
        // If student chose an advisor during registration, link it
        ...(role === 'estudiante' && advisorId ? { 
          advisorId, 
          advisorAssignedManually: false   // Marcado como elegido en el registro
        } : {}),
        // Optional ORCID for academic identity (especially useful for advisors)
        ...(orcid ? { orcid } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    // In development, return the real error for easier debugging
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : "Error creating user";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}