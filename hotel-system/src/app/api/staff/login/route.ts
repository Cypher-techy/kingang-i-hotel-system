import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { ensureSeedData } from "@/lib/seed";

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex");

export async function POST(request: Request) {
  try {
    await ensureSeedData();

    const body = await request.json() as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();

    if (!email || !body.password) {
      return NextResponse.json(
        { error: "Enter your email and password." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, email))
      .limit(1);

    if (
      !user ||
      !user.isActive ||
      user.passwordHash !== hashPassword(body.password)
    ) {
      return NextResponse.json(
        { error: "Those staff credentials are not valid." },
        { status: 401 }
      );
    }

    await db
      .update(userProfiles)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, user.id));

    const response = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
        email: user.email,
      },
    });

    response.cookies.set(
      COOKIE_NAME,
      createSessionToken(user.id),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
      }
    );

    return response;
  } catch (error) {
    console.error("staff_login_failed", error);

    return NextResponse.json(
      {
        error: "Staff login failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}