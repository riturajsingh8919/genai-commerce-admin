import { NextResponse } from "next/server";
import { createOrder } from "@/lib/db/orders";
import { decrementStock } from "@/lib/db/products";
import stripe from "@/lib/stripe";

export async function POST(req) {
  try {
    const {
      paymentIntentId,
      formData,
      items,
      total,
      isGift,
      shippingAddresses,
      appliedCoupon,
    } = await req.json();

    if (!paymentIntentId || !formData || !items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 400 },
      );
    }

    // Build primary address string for backward compat
    const primaryAddress =
      shippingAddresses?.[0] ||
      `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip}`;

    // 2. Create order in DynamoDB
    const orderCurrency = items[0]?.currency || "USD";
    const detectedCountry = items[0]?.detectedCountry || "US";
    
    const order = await createOrder({
      paymentIntentId,
      customer: formData,
      country: detectedCountry,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        color: item.selectedColor.name,
        size: item.selectedSize,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency || "USD",
      })),
      total: Math.round(total * 100) / 100,
      currency: orderCurrency,
      shippingAddress: primaryAddress,
      shippingAddresses: shippingAddresses || [primaryAddress],
      isGift: isGift || false,
      appliedCoupon: appliedCoupon
        ? {
            ...appliedCoupon,
            amount: Math.round((appliedCoupon.amount || 0) * 100) / 100
          }
        : null,
      phone: formData.phone || "",
    });

    // 3. Decrement stock for each item (non-blocking — payment already succeeded)
    for (const item of items) {
      try {
        // If the item has size info, decrement stock
        if (item.selectedColor?.name) {
          await decrementStock(
            item.id,
            detectedCountry,
            item.selectedColor.name,
            item.selectedSize,
            item.quantity
          );
        }
      } catch (stockErr) {
        console.warn(`Stock decrement warning for ${item.title}:`, stockErr.message);
        // Don't fail the order — payment already succeeded
      }
    }

    // 3. Send order confirmation email via SES
    try {
      const { sendTransactionalEmail, brandedEmailHtml } = await import("@/lib/email");
      const { getCurrencySymbol, formatPrice } = await import("@/lib/currency");
      const shortId = order.id.split("-")[0].toUpperCase();
      const sym = getCurrencySymbol(order.currency);

      const codesHtml = (order.activationCodes || []).map((c, i) => `
        <div style="background-color: #ffffff; border: 1px dashed #0027ED; padding: 12px; border-radius: 8px; margin-bottom: 8px; text-align: center;">
          <div style="font-size: 11px; color: #697386; text-transform: uppercase; margin-bottom: 4px;">Activation Code ${i + 1}</div>
          <div style="font-family: monospace; font-size: 20px; font-weight: 700; color: #0027ED; letter-spacing: 1px;">${c.code}</div>
        </div>
      `).join('');

      const itemsHtml = (order.items || []).map(item => `
        <tr class="item-row" style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 16px 0;">
            <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 2px;">${item.title}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500;">
              <span style="display: inline-block; padding: 2px 6px; background-color: #f1f5f9; border-radius: 4px; margin-right: 4px;">${item.color}</span>
              <span style="display: inline-block; padding: 2px 6px; background-color: #f1f5f9; border-radius: 4px;">Size: ${item.size}</span>
            </div>
          </td>
          <td style="text-align: right; padding: 16px 0; color: #1e293b; font-weight: 600; font-size: 14px;">
            ${item.quantity} x ${sym}${formatPrice(item.price, order.currency)}
          </td>
        </tr>
      `).join('');

      const addressesHtml = (order.shippingAddresses || []).map((a, i) => {
        const item = order.items && order.items[i] ? order.items[i] : null;
        const label = item ? `${item.color} (Size ${item.size})` : `Shipment ${i + 1}`;
        return `
          <div style="margin-bottom: 12px; padding: 10px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #0027ED;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 4px;">Destination for ${label}</div>
            <div style="font-size: 13px; color: #1e293b; line-height: 1.4;">${a}</div>
          </div>
        `;
      }).join('');

      await sendTransactionalEmail(
        formData.email,
        `Order Confirmed: #${shortId}`,
        brandedEmailHtml(
          "Order Confirmation",
          `
          <h2 style="margin-top: 0; font-size: 22px; color: #0f172a; font-weight: 700;">Thank you, ${formData.name}!</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 30px;">We've received your order and are preparing your NexRing journey. Your unique health intelligence protocol is being established.</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Manifest Summary</div>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding-top: 24px;">
                   <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Total Investment</div>
                </td>
                <td style="padding-top: 24px; text-align: right;">
                  <div style="font-weight: 700; color: #0027ED; font-size: 20px;">
                    ${sym}${formatPrice(order.total, order.currency)}
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 16px;">Biometric Protocol Status</div>
            <p style="font-size: 14px; color: #475569; margin-bottom: 15px; line-height: 1.5;">Your NexRing comes with professional health tracking features. Activate these within our secure mobile app using the following credentials:</p>
            ${codesHtml}
          </div>

          <div style="margin-bottom: 30px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 16px;">Logistics Network</div>
            ${addressesHtml}
          </div>

          ${order.isGift ? `
          <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 16px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <span style="font-size: 18px; margin-right: 8px;">🎁</span>
            <span style="font-weight: 600; color: #6d28d9; font-size: 14px;">This shipment is designated as a gift</span>
          </div>
          ` : ""}

          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_URL}/order-status?email=${encodeURIComponent(formData.email)}" class="button" style="background-color: #0027ED; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 600; text-decoration: none; display: inline-block;">Track Deployment Status</a>
          </div>
          
          <p style="font-size: 14px; color: #94a3b8; margin-top: 50px; text-align: center;">
            Experience Advanced Vitality.<br>
            <strong>The Nexcura Team</strong>
          </p>
          `,
          "#0027ED"
        ),
        `Order Confirmed #${shortId} — ${sym}${formatPrice(order.total, order.currency)}`
      );

      console.log("✅ Order confirmation email sent to:", formData.email);

      // 4. Also notify Admin of the new order
      const adminEmail = process.env.ADMIN_EMAIL || "contact.us@genaihealth.care";
      const adminSubject = `New Order Received: #${shortId} (${sym}${formatPrice(order.total, order.currency)})`;
      
      const adminOrderHtml = `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #0027ED;">New Order Notification</h2>
          <p>A new purchase has been confirmed on the NxRing Store.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">Order Details</div>
            <table style="width: 100%;">
              <tr><td style="color: #64748b;">Order ID:</td><td><strong>#${shortId}</strong></td></tr>
              <tr><td style="color: #64748b;">Customer:</td><td>${formData.name} (${formData.email})</td></tr>
              <tr><td style="color: #64748b;">Amount:</td><td><strong>${sym}${formatPrice(order.total, order.currency)}</strong></td></tr>
              <tr><td style="color: #64748b;">Items:</td><td>${order.items.length} units</td></tr>
              <tr><td style="color: #64748b;">Country:</td><td>${detectedCountry}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_URL}/genai-admin/orders" style="display: inline-block; padding: 12px 24px; background: #0027ED; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Admin Dashboard</a>
          </div>
        </div>
      `;

      await sendTransactionalEmail(
        adminEmail,
        adminSubject,
        brandedEmailHtml("New Sale", adminOrderHtml),
        `New order #${shortId} from ${formData.name} for ${sym}${formatPrice(order.total, order.currency)}.`
      );
    } catch (emailError) {
      console.error("Order email error (non-blocking):", emailError.message);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      activationCodes: order.activationCodes.map(c => c.code),
    });
  } catch (error) {
    console.error("Order API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
