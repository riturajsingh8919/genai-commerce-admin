import { NextResponse } from "next/server";
import { getAllOrders } from "@/lib/db/orders";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const countryFilter = searchParams.get("country");
    
    let orders = await getAllOrders();
    
    // Sort by createdAt desc
    orders = orders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    if (countryFilter && countryFilter !== "ALL") {
      const { COUNTRY_CURRENCY_MAP } = await import("@/lib/currency");
      const targetCurrency = COUNTRY_CURRENCY_MAP[countryFilter] || "USD";
      orders = orders.filter(o => {
        if (o.country) return o.country === countryFilter;
        return (o.currency || "USD") === targetCurrency;
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Admin Orders API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
