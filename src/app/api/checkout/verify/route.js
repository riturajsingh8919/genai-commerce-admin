import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { docClient, DYNAMODB_TABLE_NAME } from "@/lib/aws";
import { PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Use ACCESS_KEY_ID (genaiwebsite credentials) which have broader permissions
// than the websitedev user that has explicit denies
const sesClient = new SESClient({
  region: process.env.EMAIL_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    const { action, email, otp } = await req.json();

    if (action === "send") {
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const fromEmail = process.env.FROM_EMAIL || "contact.us@genaihealth.care";
      const fromName = process.env.FROM_NAME || "Nexcura Support";

      const { brandedEmailHtml } = await import("@/lib/email");

      const sesParams = {
        Source: `${fromName} <${fromEmail}>`,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: {
            Data: "NexRing: Secure Access Code",
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: brandedEmailHtml(
                "Secure Access",
                `
                <div style="text-align: center; padding: 20px 0;">
                  <p style="font-size: 16px; color: #1a1f36; margin-bottom: 24px;">Your one-time access code for NexRing checkout:</p>
                  <div style="background-color: #f8fafc; border: 1px solid #e6ebf1; padding: 32px; border-radius: 12px; display: inline-block;">
                    <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #0027ED; font-family: monospace;">${generatedOtp}</span>
                  </div>
                  <p style="color: #697386; font-size: 14px; margin-top: 32px;">This code expires in <strong>10 minutes</strong> and can only be used once.</p>
                  <p style="color: #697386; font-size: 12px; margin-top: 12px;">If you did not request this code, please ignore this email.</p>
                </div>
                `
              ),
              Charset: "UTF-8",
            },
            Text: {
              Data: `Your NexRing secure access code: ${generatedOtp}\n\nExpires in 10 minutes.\n\n— NexRing Team`,
              Charset: "UTF-8",
            },
          },
        },
      };

      try {
        console.log("OTP Transmission via SES for:", email);
        console.log(
          "Using credentials:",
          process.env.ACCESS_KEY_ID?.slice(0, 8) + "...",
        );

        const sesResult = await sesClient.send(new SendEmailCommand(sesParams));
        console.log("✅ SES Message ID:", sesResult.MessageId);

        // Store OTP in DynamoDB with 10-minute TTL (only on email success)
        const expiration = Math.floor(Date.now() / 1000) + 600;
        await docClient.send(
          new PutCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Item: {
              pk: `VERIFY#${email}`,
              sk: `OTP`,
              otp: generatedOtp,
              expiresAt: expiration,
            },
          }),
        );

        console.log("OTP stored in DynamoDB for:", email);
      } catch (err) {
        console.error("OTP SES/DB Error:", err.message || err);
        return NextResponse.json(
          { error: `Email delivery error: ${err.message}` },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, message: "Code transmitted" });
    }

    if (action === "verify") {
      const data = await docClient.send(
        new GetCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: { pk: `VERIFY#${email}`, sk: `OTP` },
        }),
      );

      if (!data.Item) {
        return NextResponse.json(
          { error: "Access code expired or not found" },
          { status: 400 },
        );
      }

      const now = Math.floor(Date.now() / 1000);
      if (data.Item.expiresAt && data.Item.expiresAt < now) {
        return NextResponse.json(
          { error: "Access code has expired. Please request a new one." },
          { status: 400 },
        );
      }

      if (data.Item.otp !== otp) {
        return NextResponse.json(
          { error: "Incorrect access code" },
          { status: 400 },
        );
      }

      // Delete after successful use (single-use)
      await docClient.send(
        new DeleteCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: { pk: `VERIFY#${email}`, sk: `OTP` },
        }),
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Verification API Error:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 },
    );
  }
}
