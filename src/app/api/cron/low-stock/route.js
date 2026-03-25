import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/db/products";
import { sendTransactionalEmail, brandedEmailHtml } from "@/lib/email";
import { getCronState, updateCronState } from "@/lib/db/cron";

export const dynamic = "force-dynamic";

/**
 * Intelligent Stock Alert Cron
 * Frequency: 3-hourly check via external trigger.
 * Logic:
 * - Sends max 2 emails per day (every 12h) if items and stock remain the same.
 * - Bypasses limit and sends immediately if new items are low or stock dropped further.
 */

export async function GET(req) {
  try {
    const products = await getAllProducts();
    const adminEmail = process.env.ADMIN_EMAIL || "rituraj.bhavyat@gmail.com";
    
    // 1. Gather all current low stock items
    const lowStockItems = [];
    products.forEach(p => {
      if (p.granularInventory) {
        Object.entries(p.granularInventory).forEach(([country, variants]) => {
          Object.entries(variants).forEach(([color, sizes]) => {
            Object.entries(sizes).forEach(([size, stock]) => {
              const stockNum = parseInt(stock);
              if (!isNaN(stockNum) && stockNum < 5) {
                lowStockItems.push({
                  id: p.id,
                  name: p.title,
                  variant: `${color} / ${size}`,
                  country: country === "US" ? "USA" : country,
                  stock: stockNum
                });
              }
            });
          });
        });
      }
    });

    // 2. State & Throttling Logic
    const jobName = "LOW_STOCK_ALERT";
    const currentState = await getCronState(jobName);
    
    // Create a fingerprint of CURRENT low stock state
    // We sort items by ID/variant to ensure fingerprint is consistent for the same set
    const currentFingerprint = JSON.stringify(
      lowStockItems
        .map(i => `${i.id}|${i.variant}|${i.country}|${i.stock}`)
        .sort()
    );

    const now = new Date();
    const lastRun = currentState?.lastRun ? new Date(currentState.lastRun) : null;
    const lastFingerprint = currentState?.fingerprint || null;

    // Check if we should skip
    // Skip if (last send < 12h ago) AND (stock state hasn't changed)
    const hoursSinceLast = lastRun ? (now - lastRun) / (1000 * 60 * 60) : 999;
    const isRedundant = hoursSinceLast < 12 && currentFingerprint === lastFingerprint;

    if (isRedundant) {
      console.log(`ℹ️ [CRON] Low Stock Alert skipped. Redundant report within 12h limit.`);
      return NextResponse.json({ 
        success: true, 
        message: "Redundant report skipped (within 12h and identical stock).",
        nextCheckIn: "3 hours"
      });
    }

    // 3. Send Email if not skipped
    if (lowStockItems.length === 0) {
      await updateCronState(jobName, "EMPTY", { count: 0 });
      return NextResponse.json({ message: "No low stock items found. State updated." });
    }

    const itemsHtml = lowStockItems.map(item => `
      <tr class="item-row">
        <td style="padding: 12px 0;">
          <div style="font-weight: 600; font-size: 14px; color: #1a1f36;">${item.name}</div>
          <div style="font-size: 12px; color: #697386;">Variant: ${item.variant}</div>
        </td>
        <td style="padding: 12px 0; text-align: center;">
           <span style="font-size: 12px; font-weight: 600; color: #0027ED;">${item.country}</span>
        </td>
        <td style="padding: 12px 0; text-align: right;">
          <span style="background: #fff1f2; color: #e11d48; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700;">
            ${item.stock} LEFT
          </span>
        </td>
      </tr>
    `).join("");

    const bodyHtml = `
      <p style="margin-bottom: 24px;">Hello Admin,</p>
      <p style="margin-bottom: 24px;">
        ${currentFingerprint !== lastFingerprint 
          ? "<b>New inventory changes detected!</b> The following items require replenishment." 
          : "Daily inventory status report. The following items remain low on stock."}
      </p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #f6f9fc;">
            <th style="padding: 12px 0; text-align: left; font-size: 12px; color: #697386; text-transform: uppercase; letter-spacing: 1px;">Product</th>
            <th style="padding: 12px 0; text-align: center; font-size: 12px; color: #697386; text-transform: uppercase; letter-spacing: 1px;">Region</th>
            <th style="padding: 12px 0; text-align: right; font-size: 12px; color: #697386; text-transform: uppercase; letter-spacing: 1px;">Stock</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="margin-top: 40px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_URL}/genai-admin/products" class="button">Manage Inventory</a>
      </div>
    `;

    const emailHtml = brandedEmailHtml(
       currentFingerprint !== lastFingerprint ? "⚠️ Critical Inventory Update" : "Low Stock Inventory Report", 
       bodyHtml, 
       "#e11d48"
    );

    await sendTransactionalEmail(
      adminEmail,
      currentFingerprint !== lastFingerprint 
        ? `🚨 NEW Low Stock Alert: ${lowStockItems.length} Variants Critical`
        : `⚠️ Daily Low Stock Report: ${lowStockItems.length} Variants Low`,
      emailHtml,
      `Action Required: ${lowStockItems.length} items have low stock levels.`
    );

    // Update state ONLY after successful send
    await updateCronState(jobName, currentFingerprint, { count: lowStockItems.length });

    return NextResponse.json({ 
      success: true, 
      message: `Stock report dispatched to ${adminEmail}`,
      itemCount: lowStockItems.length,
      mode: currentFingerprint !== lastFingerprint ? "OVERRIDE (CHNG)" : "SCHEDULED"
    });

  } catch (error) {
    console.error("Cron Low Stock Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
