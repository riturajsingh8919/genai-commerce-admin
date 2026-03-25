import { NextResponse } from "next/server";
import { getOrdersByEmail } from "@/lib/db/orders";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const orders = await getOrdersByEmail(email);

    // Security: Only return necessary public info, exclude activation codes as requested
    const publicOrders = orders.map((order) => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      currency: order.currency || "USD",
      items: order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        currency: item.currency || "USD",
      })),
      shippingAddress: order.shippingAddress,
      shippingAddresses: order.shippingAddresses,
      shipments: order.shipments,
      isGift: order.isGift,
    }));

    return NextResponse.json(publicOrders);
  } catch (error) {
    console.error("Order Track API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
