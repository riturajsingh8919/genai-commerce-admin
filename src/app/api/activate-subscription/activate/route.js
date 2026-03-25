import { NextResponse } from "next/server";
import { activateSubscriptionCodes } from "@/lib/db/orders";

export async function POST(req) {
  try {
    const { email, codes, orderId, mainEmail, planType, paymentMethodId } =
      await req.json();

    if (
      !email ||
      !codes ||
      !orderId ||
      !mainEmail ||
      !planType ||
      !paymentMethodId
    ) {
      return NextResponse.json(
        { error: "Missing required activation data" },
        { status: 400 },
      );
    }

    const activationData = {
      email,
      mainEmail,
      planType,
      billingDetails: {
        paymentMethodId,
        lastUpdated: new Date().toISOString(),
      },
    };

    const result = await activateSubscriptionCodes(
      orderId,
      codes,
      activationData,
    );

    if (result.success) {
      // 📧 Send Notifications
      try {
        const { sendTransactionalEmail, brandedEmailHtml } =
          await import("@/lib/email");
        const adminEmail = process.env.ADMIN_EMAIL;

        const { getOrderById } = await import("@/lib/db/orders");
        const order = await getOrderById(orderId);
        
        // Helper to find specific item and address for a code based on its position
        const getActivatedRingDetails = (code) => {
          if (!order?.activationCodes || !order?.items) return { details: "NexRing", address: "N/A" };
          
          const codeIdx = order.activationCodes.findIndex(c => c.code === code);
          if (codeIdx === -1) return { details: "NexRing", address: order.shippingAddress || "N/A" };
          
          // Map code index to item index
          let itemIdx = 0;
          let cumulative = 0;
          for (let i = 0; i < order.items.length; i++) {
            cumulative += order.items[i].quantity;
            if (codeIdx < cumulative) {
              itemIdx = i;
              break;
            }
          }
          
          const item = order.items[itemIdx];
          const details = `${item.title} (${item.color}, Size: ${item.size})`;
          
          // Find correct address from shipments if multi-address order
          let address = order.shippingAddress || "N/A";
          if (order.shipments) {
            const shipment = order.shipments.find(s => s.itemIndices?.includes(itemIdx));
            if (shipment) address = shipment.address;
          }
          
          return { details, address };
        };

        // If multiple codes are activated at once, join their details
        const activationSpecifics = codes.map(code => getActivatedRingDetails(code));
        const ringDetails = [...new Set(activationSpecifics.map(s => s.details))].join(", ");
        const shippingAddr = [...new Set(activationSpecifics.map(s => s.address))].join(" | ");

        // 1. Send confirmation to the activator
        const activatorSubject = "Your NexRing Subscription is Now Active!";
        const activatorHtml = brandedEmailHtml(
          "Subscription Activated",
          `
          <p>Hello,</p>
          <p>Your <strong>${planType}</strong> membership for your NexRing has been successfully activated.</p>
          
          <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Plan Type</p>
              <p style="margin: 4px 0 0; font-weight: 600; color: #0f172a;">${planType} Membership</p>
            </div>
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Ring Details</p>
              <p style="margin: 4px 0 0; font-weight: 600; color: #0f172a;">${ringDetails}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Activation Address</p>
              <p style="margin: 4px 0 0; font-weight: 600; color: #0f172a;">${shippingAddr}</p>
            </div>
          </div>

          <div style="background: #e0e7ff; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #c7d2fe;">
            <p style="margin: 0; color: #3730a3; font-weight: 600;">Next Steps:</p>
            <p style="margin: 8px 0 0; color: #4338ca; font-size: 14px; line-height: 1.5;">
              To begin your health transformation, please <strong>log in to the NexRing Mobile App</strong>. From there, you can monitor your biometric data, manage your subscription, and access personalized insights designed for your wellbeing.
            </p>
          </div>

          <p style="color: #64748b; font-size: 14px;">Your data is now syncing and will be available in the app shortly.</p>
          `,
        );
        await sendTransactionalEmail(email, activatorSubject, activatorHtml);

        // 2. Security Warning to original purchaser (if different)
        if (email.toLowerCase() !== mainEmail.toLowerCase()) {
          const securitySubject =
            "Security Alert: Subscription Activated for your NexRing";
          const securityHtml = brandedEmailHtml(
            "Security Notification",
            `
            <div style="color: #991b1b; background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: 600;">
              ⚠️ Security Warning
            </div>
            <p>A subscription was recently activated for a NexRing associated with your order by:</p>
            <p style="font-weight: 600; padding: 10px; background: #f1f5f9; border-radius: 6px;">${email}</p>
            <p>If this was you or an authorized family member, no further action is required.</p>
            <p style="color: #dc2626; font-weight: 500;">If you did NOT authorize this activation, please contact Nexcura support or your admin immediately to secure your account.</p>
            `,
            "#dc2626",
          );
          await sendTransactionalEmail(
            mainEmail,
            securitySubject,
            securityHtml,
          );
        }

        // 3. Admin Notification
        const adminSubject = `Activation Alert: ${email}`;
        const adminHtml = brandedEmailHtml(
          "Admin Notification",
          `
          <p>A new subscription activation has been completed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; color: #64748b;">Purchaser Email:</td>
              <td style="padding: 12px 0; font-weight: 600;">${mainEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; color: #64748b;">Activator Email:</td>
              <td style="padding: 12px 0; font-weight: 600;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; color: #64748b;">Plan Level:</td>
              <td style="padding: 12px 0; font-weight: 600;">${planType} Membership</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0; color: #64748b;">Ring Details:</td>
              <td style="padding: 12px 0; font-weight: 600;">${ringDetails}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #64748b;">Activation Address:</td>
              <td style="padding: 12px 0; font-weight: 600;">${shippingAddr}</td>
            </tr>
          </table>
          `,
        );
        await sendTransactionalEmail(adminEmail, adminSubject, adminHtml);
      } catch (emailError) {
        console.error("Failed to send activation emails:", emailError);
        // We don't fail the response if emails fail, as activation in DB succeeded
      }

      return NextResponse.json({
        success: true,
        message: "Subscription activated successfully",
      });
    } else {
      return NextResponse.json({ error: "Activation failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Activation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
