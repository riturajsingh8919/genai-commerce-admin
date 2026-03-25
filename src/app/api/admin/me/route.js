import { cookies } from "next/headers";
import { verifyToken, hashPassword } from "@/lib/auth";
import { getUserByEmail, updateUser } from "@/lib/db/users";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Don't return password
    const { password, ...safeUser } = user;
    return Response.json(safeUser);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await request.json();
    const user = await getUserByEmail(decoded.email);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updateData = { ...user };

    if (data.newPassword !== undefined) {
      if (!data.newPassword || data.newPassword.length < 8) {
        return Response.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 }
        );
      }
      updateData.password = await hashPassword(data.newPassword);
    }

    if (data.name) {
      updateData.name = data.name;
    }

    await updateUser(user.email, updateData);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
