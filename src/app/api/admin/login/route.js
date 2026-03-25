import { comparePassword, generateToken } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db/users";
import { setCookie } from "cookies-next";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(email);

    if (!user || user.role !== "admin") {
      return Response.json(
        { error: "Invalid credentials or unauthorized" },
        { status: 401 },
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken(user);

    // Set cookie manually in the response Headers for better compatibility with Next.js App Router
    const response = Response.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Using next/headers cookies is the modern way in App Router
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
