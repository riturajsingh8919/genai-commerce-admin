import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Shared SES client using the ACCESS_KEY_ID credentials
// (genaiwebsite IAM user — has ses:SendEmail + lambda:InvokeFunction)
export const sesEmailClient = new SESClient({
  region: process.env.EMAIL_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || "contact.us@genaihealth.care";
const FROM_NAME = process.env.FROM_NAME || "Nexcura Support";

/**
 * Send a transactional email via SES.
 * @param {string} to - Recipient address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} textBody - Plain text fallback
 */
export async function sendTransactionalEmail(to, subject, htmlBody, textBody) {
  try {
    const params = {
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: { ToAddresses: typeof to === "string" ? to.split(",").map(e => e.trim()) : to },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
          Text: { Data: textBody || subject, Charset: "UTF-8" },
        },
      },
    };

    console.log(`📧 Attempting to send SES email to: ${to}`);
    const result = await sesEmailClient.send(new SendEmailCommand(params));
    console.log("✅ SES Email sent. MessageId:", result.MessageId);
    return result;
  } catch (error) {
    console.error("❌ SES Email failed:", error);
    throw error;
  }
}

/** Reusable branded email wrapper */
export function brandedEmailHtml(title, bodyHtml, accentColor = "#0027ED") {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          .email-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f6f9fc;
            padding: 40px 20px;
          }
          .email-card {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .email-header {
            background-color: ${accentColor};
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .email-header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .email-body {
            padding: 40px;
            color: #1a1f36;
            line-height: 1.6;
          }
          .email-footer {
            padding: 30px;
            text-align: center;
            color: #697386;
            font-size: 13px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #0027ED;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          hr {
            border: none;
            border-top: 1px solid #e6ebf1;
            margin: 30px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .item-row td {
            padding: 12px 0;
            border-bottom: 1px solid #f6f9fc;
          }
          .item-row:last-child td {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-card">
            <div class="email-header">
              <h1>NexRing</h1>
              <p>${title}</p>
            </div>
            <div class="email-body">
              ${bodyHtml}
            </div>
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} Nexcura Health. All rights reserved.</p>
            <p>If you have any questions, reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_URL}/contact" style="color: #0027ED; text-decoration: none;">Help Center</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
