import { NextResponse } from "next/server";
import { sendTransactionalEmail, brandedEmailHtml } from "@/lib/email";

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Anti-Spam Protection (Spec: NO API / NO KEY)
    
    // Honeypot check
    if (body.companyWebsite) {
      console.warn("Spam detected: Honeypot field filled.");
      return NextResponse.json({ error: "Suspicious submission detected." }, { status: 400 });
    }

    // Velocity check (3 seconds minimum)
    const timeTaken = Date.now() - (body.formStartTime || 0);
    if (timeTaken < 3000) {
      console.warn("Spam detected: Velocity check failed (too fast).", timeTaken);
      return NextResponse.json({ error: "Please take a moment to review the form before submitting." }, { status: 400 });
    }

    // Math check (3 + 4 = 7)
    if (parseInt(body.humanCheck) !== 7) {
      return NextResponse.json({ error: "Human verification failed. What is 3 + 4?" }, { status: 400 });
    }

    // 2. Required Field Validation
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "organizationName",
      "organizationType",
      "jobTitle",
      "country",
      "ringQuantity",
      "timeline",
      "goals",
      "referralSource",
      "solutionArea"
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      organizationName,
      organizationType,
      jobTitle,
      country,
      ringQuantity,
      timeline,
      goals,
      referralSource,
      solutionArea
    } = body;

    // 3. Send Email to Admin
    const adminEmail = process.env.ADMIN_EMAIL || "contact.us@genaihealth.care";
    const adminSubject = `New Organization Inquiry: ${organizationName} (${solutionArea})`;
    
    const adminHtml = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 600px;">
        <h2 style="color: #0027ED;">New Organization Partnership Inquiry</h2>
        <p>A new inquiry has been received via the Employee Benefits page.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background: #f8fafc;">
            <td style="padding: 10px; font-weight: 600; width: 40%;">Solution Area</td>
            <td style="padding: 10px;">${solutionArea}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: 600;">Contact Name</td>
            <td style="padding: 10px;">${firstName} ${lastName}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 10px; font-weight: 600;">Email</td>
            <td style="padding: 10px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: 600;">Phone</td>
            <td style="padding: 10px;">${phone || "Not provided"}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 10px; font-weight: 600;">Organization</td>
            <td style="padding: 10px;">${organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: 600;">Org Type</td>
            <td style="padding: 10px;">${organizationType}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 10px; font-weight: 600;">Job Title</td>
            <td style="padding: 10px;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: 600;">Country</td>
            <td style="padding: 10px;">${country}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 10px; font-weight: 600;">Ring Quantity</td>
            <td style="padding: 10px;">${ringQuantity}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: 600;">Timeline</td>
            <td style="padding: 10px;">${timeline}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 10px; font-weight: 600;">Referral Source</td>
            <td style="padding: 10px;">${referralSource}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 10px; border-left: 4px solid #0027ED;">
          <div style="font-weight: 700; font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">Inquiry Goals</div>
          <div style="font-size: 15px; line-height: 1.6;">${goals}</div>
        </div>
      </div>
    `;

    await sendTransactionalEmail(
      adminEmail,
      adminSubject,
      brandedEmailHtml("Organization Inquiry", adminHtml),
      `New inquiry from ${firstName} ${lastName} at ${organizationName}. Goals: ${goals}`
    );

    // 4. Send Confirmation Email to User
    const userSubject = "We've received your NxRing inquiry";
    const userHtml = `
      <div style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #0027ED;">Hi ${firstName},</h2>
        <p>Thank you for reaching out to NxRing. We've successfully received your inquiry for <strong>${organizationName}</strong> regarding our <strong>${solutionArea}</strong> solutions.</p>
        <p>Our partnership team is currently reviewing your goals and will be in touch shortly to discuss how we can help your organization leverage biometric intelligence.</p>
        <p>In the meantime, feel free to explore our latest research on corporate wellness and health technology.</p>
        <p style="margin-top: 40px; font-weight: 600; color: #64748b;">The NxRing Team</p>
      </div>
    `;

    await sendTransactionalEmail(
      email,
      userSubject,
      brandedEmailHtml("Thank You", userHtml),
      `Hi ${firstName}, we've received your NxRing inquiry for ${organizationName} and will be in touch shortly.`
    );

    return NextResponse.json({ success: true, message: "Inquiry received" });
  } catch (error) {
    console.error("Organization Inquiry API Error:", error);
    return NextResponse.json({ error: "Failed to process your request. Please try again later." }, { status: 500 });
  }
}
