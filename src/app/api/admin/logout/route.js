import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
