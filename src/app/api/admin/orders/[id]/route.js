import { NextResponse } from "next/server";
import {
  updateOrderStatus,
  deleteOrder,
  getOrderById,
  updateShipmentStatus,
} from "@/lib/db/orders";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { status, shipmentIndex, trackingNumber } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    // 0. Check for terminal status
    const currentOrder = await getOrderById(id);
    if (
      currentOrder &&
      ["DELIVERED", "CANCELLED"].includes(currentOrder.status)
    ) {
      return NextResponse.json(
        { error: "Order is in a terminal state and cannot be modified." },
        { status: 403 },
      );
    }

    // 1. Update status in DB
    const updatedOrder = await updateShipmentStatus(
      id,
      shipmentIndex !== undefined ? shipmentIndex : "all",
      status,
      trackingNumber,
    );

    if (!updatedOrder || !updatedOrder.customer) {
      console.error(
        "Order or customer data not found after update for ID:",
        id,
      );
      return NextResponse.json({
        success: true,
        order: updatedOrder,
        warning:
          "Order updated but notification failed: customer data missing.",
      });
    }

    // 2. Notify user via SES
    try {
      const { sendTransactionalEmail, brandedEmailHtml } =
        await import("@/lib/email");
      const { getCurrencySymbol, formatPrice } = await import("@/lib/currency");
      const shortId = updatedOrder.id.split("-")[0].toUpperCase();
      const sym = getCurrencySymbol(updatedOrder.currency || "USD");
      const shipment =
        typeof shipmentIndex === "number" && updatedOrder.shipments
          ? updatedOrder.shipments[shipmentIndex]
          : null;

      // ... existing status logic ...
      let headerTitle = "Order Update";
      let accentColor = "#0027ED";
      let statusMessage =
        shipmentIndex === "all"
          ? `Great news! All items in your order #${shortId} have been updated to ${status.toLowerCase()}.`
          : shipment
            ? `We have an update regarding your shipment to ${shipment.address}. The items listed below are now ${status.toLowerCase()}.`
            : `Your order #${shortId} has been updated to ${status.toLowerCase()}.`;
      let subMessage = "We'll keep you posted as your order moves forward.";

      if (status === "PROCESSING") {
        headerTitle = "Preparation Started";
        accentColor = "#f59e0b"; // Amber
        statusMessage = shipment
          ? `Expert hands are now preparing your shipment for delivery to ${shipment.address}. We're ensuring everything is perfect.`
          : "Great news! We've started preparing your items. Quality checks are underway to ensure your NexRing experience is flawless.";
      } else if (status === "SHIPPED") {
        headerTitle = "On Its Way";
        accentColor = "#3b82f6"; // Blue
        statusMessage = shipment
          ? `Your shipment to ${shipment.address} has been dispatched and is officially on its way to you!`
          : "Exciting news! Your NexRing has been dispatched and is now on its way.";
        subMessage =
          shipment && shipment.trackingNumber
            ? `You can track your package using: <strong>${shipment.trackingNumber}</strong>`
            : "It has been handed over to our premium logistics partner for swift delivery.";
      } else if (status === "DELIVERED") {
        headerTitle = "Journey Complete";
        accentColor = "#10b981"; // Emerald
        statusMessage = shipment
          ? `Success! Your shipment has arrived at ${shipment.address}. We hope you enjoy your new NexRing.`
          : "Your NexRing has arrived! Welcome to a new era of proactive health monitoring.";
        subMessage = "We're excited to have you in the NexRing community.";
      } else if (status === "CANCELLED") {
        headerTitle = "Order Cancelled";
        accentColor = "#ef4444"; // Red
        statusMessage = `Your order #${shortId} has been cancelled as requested or due to processing issues.`;
        subMessage =
          "If you believe this is an error, please reach out to our priority support team.";
      }

      const itemsToDisplay =
        shipment && shipment.itemIndices && shipment.itemIndices.length > 0
          ? updatedOrder.items.filter((_, idx) =>
              shipment.itemIndices.includes(idx),
            )
          : updatedOrder.items;

      const itemsHtml = (itemsToDisplay || [])
        .map(
          (item) => `
        <tr class="item-row" style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${item.title}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; display: flex; gap: 6px;">
              <span style="display: inline-block; padding: 2px 6px; background: #f1f5f9; color: #334155; border-radius: 4px;">${item.color}</span>
              <span style="display: inline-block; padding: 2px 6px; background: #f1f5f9; color: #334155; border-radius: 4px;">Size: ${item.size || "Standard"}</span>
            </div>
          </td>
          <td style="text-align: right; padding: 12px 0; color: #1e293b; font-weight: 600; font-size: 14px;">
            ${item.quantity} x ${sym}${formatPrice(item.price, updatedOrder.currency || "USD")}
          </td>
        </tr>
      `,
        )
        .join("");

      const trackUrl = `${process.env.NEXT_PUBLIC_URL}/order-status?email=${encodeURIComponent(updatedOrder.customer.email)}`;

      await sendTransactionalEmail(
        updatedOrder.customer.email,
        `${headerTitle}: #${shortId}`,
        brandedEmailHtml(
          headerTitle,
          `
          <h2 style="margin-top: 0; font-size: 20px; color: #1a1f36;">Hi ${updatedOrder.customer.name},</h2>
          <p style="font-size: 16px; margin-bottom: 30px; color: #475569;">${statusMessage}</p>
          
          <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Order Inventory</div>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding-top: 20px;">
                   <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Total Order Value</div>
                </td>
                <td style="padding-top: 20px; text-align: right;">
                   <div style="font-weight: 700; color: #0027ED; font-size: 18px;">
                    ${sym}${formatPrice(updatedOrder.total, updatedOrder.currency || "USD")}
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <p style="color: #697386; font-size: 14px;">${subMessage}</p>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${trackUrl}" class="button">Track Your Order</a>
          </div>
          
          <p style="font-size: 14px; color: #697386; margin-top: 40px;">
            Thank you for choosing NexRing.<br>
            <strong>The NexRing Team</strong>
          </p>
          `,
          accentColor,
        ),
        `Order #${shortId} update: ${status}${shipment ? ` (Shipment to ${shipment.address})` : ""}`,
      );

      console.log(`✅ Professional status update email sent for order ${id}`);
    } catch (emailError) {
      console.error(
        "Failed to send professional status update email:",
        emailError.message,
      );
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Admin Order Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Order Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Admin Order Get Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
