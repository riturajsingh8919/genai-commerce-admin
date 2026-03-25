import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

const JWT_SECRET = process.env.JWT_SECRET || "nexring-admin-secret-2026";

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(res, token) {
  setCookie("admin_token", token, {
    res,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
