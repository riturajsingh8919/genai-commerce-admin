import { NextResponse } from "next/server";
import { sendTransactionalEmail, brandedEmailHtml } from "@/lib/email";

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 3;

  const userRequests = rateLimitMap.get(identifier) || [];
  const recentRequests = userRequests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

export async function POST(request) {
  try {
    const formData = await request.json();

    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 },
      );
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || "contact.us@genaihealth.care";

    // 1. Send notification to admin
    try {
      await sendTransactionalEmail(
        adminEmail,
        `New Lead: ${formData.subject || "Website Inquiry"} — ${formData.name}`,
        brandedEmailHtml(
          "New Contact Form Submission",
          `
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;width:120px;vertical-align:top;"><strong>Name</strong></td>
              <td style="padding:12px 0;border-bottom:1px solid #eee;">${escapeHtml(formData.name)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;vertical-align:top;"><strong>Email</strong></td>
              <td style="padding:12px 0;border-bottom:1px solid #eee;"><a href="mailto:${escapeHtml(formData.email)}" style="color:#0027ED;">${escapeHtml(formData.email)}</a></td>
            </tr>
            ${
              formData.subject
                ? `<tr>
              <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;vertical-align:top;"><strong>Subject</strong></td>
              <td style="padding:12px 0;border-bottom:1px solid #eee;">${escapeHtml(formData.subject)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:12px 0;color:#666;vertical-align:top;"><strong>Message</strong></td>
              <td style="padding:12px 0;">${escapeHtml(formData.message).replace(/\n/g, "<br>")}</td>
            </tr>
          </table>
          <p style="margin-top:20px;color:#999;font-size:12px;">Submitted from NexRing website contact form</p>
          `,
        ),
        `New lead from ${formData.name} (${formData.email}): ${formData.message}`,
      );
      console.log("✅ Admin notification sent for lead:", formData.email);
    } catch (err) {
      console.error("Admin email error:", err.message);
      // Don't block — still try user thank-you
    }

    // 2. Send thank-you to user
    try {
      await sendTransactionalEmail(
        formData.email,
        "Thank You for Contacting NexRing",
        brandedEmailHtml(
          "Thank You",
          `
          <h2 style="color:#000d24;margin-top:0;">Hello ${escapeHtml(formData.name)},</h2>
          <p>Thank you for reaching out to us. We have received your message and our team will get back to you within 24 hours.</p>
          <div style="background:white;border-left:4px solid #ccc;padding:16px;border-radius:5px;margin:20px 0;color:#555;">
            <p style="margin:0;font-style:italic;">"${escapeHtml(formData.message).substring(0, 200)}${formData.message.length > 200 ? "..." : ""}"</p>
          </div>
          <p>In the meantime, feel free to explore our latest innovations:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL}" style="display:inline-block;padding:14px 32px;background:#000d24;color:#fff;text-decoration:none;border-radius:30px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Explore NexRing</a>
          </div>
          <p style="color:#999;font-size:13px;">Best Regards,<br><strong>NexRing Team by Nexcura</strong></p>
          `,
        ),
        `Thank you for contacting us, ${formData.name}. We'll get back to you within 24 hours.`,
      );
      console.log("✅ Thank-you email sent to:", formData.email);
    } catch (err) {
      console.error("User thank-you email error:", err.message);
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent. We'll be in touch soon!",
    });
  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
