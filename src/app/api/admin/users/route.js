import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db/orders";
import { createUser, deleteUser, getAllAdmins } from "@/lib/db/users";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const country = searchParams.get("country");

    // Handle Dependents toggle
    const showDependents = searchParams.get("dependents") === "true";
    let users;

    if (showDependents) {
      const { getAllDependents } = await import("@/lib/db/orders");
      const fetchedUsers = await getAllDependents();
      
      // Patch legacy dependants missing country if they have a main purchaser we know the country of
      const allRawUsers = await getAllUsers();
      const emailToCountry = {};
      allRawUsers.forEach(u => {
        if (u.email && u.country) emailToCountry[u.email.toLowerCase()] = u.country;
      });

      users = fetchedUsers.map(u => {
        if (!u.country && u.mainPurchaserEmail) {
          return { ...u, country: emailToCountry[u.mainPurchaserEmail.toLowerCase()] || null };
        }
        return u;
      });
    } else {
      users = await getAllUsers();
      // Filter out dependants for the primary users tab
      users = users.filter((u) => !u.isDependant);
    }

    // Filter by role if provided (only for primary users as dependents don't have roles)
    if (role && !showDependents) {
      users = users.filter((user) => user.role === role);
    }

    // Filter by country if provided
    if (country && country !== "ALL") {
      const normalizeCountry = (c) => {
        if (!c) return "US";
        const upper = c.toString().trim().toUpperCase();
        if (upper === "IN" || upper === "INDIA") return "IN";
        if (upper === "US" || upper === "USA" || upper === "UNITED STATES")
          return "US";
        return upper;
      };

      const targetCountry = normalizeCountry(country);
      users = users.filter(
        (user) => normalizeCountry(user.country) === targetCountry,
      );
    }

    // Sort by joinedAt desc
    const sortedUsers = users.sort(
      (a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0),
    );

    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, role = "admin", adminType = "SUPER_ADMIN", adminCountry = null } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (adminType === "COUNTRY_ADMIN" && !adminCountry) {
      return NextResponse.json(
        { error: "Country Admin requires a country assignment" },
        { status: 400 },
      );
    }

    const newUser = await createUser({ name, email, password, role, adminType, adminCountry });
    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Admin User Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { pk } = await req.json();

    if (!pk) {
      return NextResponse.json(
        { error: "User pk is required" },
        { status: 400 },
      );
    }

    // Safety check: don't delete the last admin
    const admins = await getAllAdmins();
    if (admins.length <= 1) {
      return NextResponse.json(
        {
          error:
            "Cannot delete the last admin account. At least one admin must remain.",
        },
        { status: 400 },
      );
    }

    await deleteUser(pk);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin User Deletion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
