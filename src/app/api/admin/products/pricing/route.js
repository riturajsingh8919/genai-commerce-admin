import {
  getAllCountryPricing,
  upsertCountryPricing,
  deleteCountryPricing,
} from "@/lib/db/products";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return Response.json({ error: "productId required" }, { status: 400 });
    }

    const items = await getAllCountryPricing(productId);
    return Response.json(items);
  } catch (error) {
    console.error("GET Pricing Error:", error);
    return Response.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      productId,
      country,
      currency,
      price,
      mrp,
      taxRate,
      shippingFee,
      membershipPrice,
      coupons,
      discountPercent,
      startDate,
      endDate,
    } = await request.json();
    if (!productId || !country || !currency || price == null) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await upsertCountryPricing(
      productId,
      country,
      currency,
      price,
      mrp || 0,
      taxRate ?? 12,
      shippingFee ?? 15,
      membershipPrice || null,
      coupons || [],
      discountPercent || null,
      startDate || null,
      endDate || null,
    );
    return Response.json(result);
  } catch (error) {
    console.error("POST Pricing Error:", error);
    return Response.json({ error: "Failed to save pricing" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { productId, country } = await request.json();
    if (!productId || !country) {
      return Response.json(
        { error: "productId and country required" },
        { status: 400 },
      );
    }

    const result = await deleteCountryPricing(productId, country);
    return Response.json(result);
  } catch (error) {
    console.error("DELETE Pricing Error:", error);
    return Response.json(
      { error: "Failed to delete pricing" },
      { status: 500 },
    );
  }
}
