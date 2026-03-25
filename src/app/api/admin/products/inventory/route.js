import {
  getAllInventory,
  upsertInventoryItem,
  bulkUpsertInventoryItems,
  deleteInventoryItem,
} from "@/lib/db/products";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return Response.json({ error: "productId required" }, { status: 400 });
    }

    const items = await getAllInventory(productId);
    return Response.json(items);
  } catch (error) {
    console.error("GET Inventory Error:", error);
    return Response.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk insert - handle array grouped by country first
      // Assuming the UI batches by country (which it currently does because it creates a country-scoped payload)
      if (body.length > 0) {
        const country = body[0].country;
        const productId = body[0].productId;
        await bulkUpsertInventoryItems(productId, country, body);
      }
      return Response.json({ success: true, count: body.length });
    }

    // Single insert fallback
    const { productId, country, color, size, stock } = body;
    if (!productId || !country || !color || !size || stock == null) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await upsertInventoryItem(
      productId,
      country,
      color,
      size,
      stock,
    );
    return Response.json(result);
  } catch (error) {
    console.error("POST Inventory Error:", error);
    return Response.json(
      { error: "Failed to save inventory" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { productId, country, color, size } = await request.json();
    let result;
    // Cross-region color inventory deletion
    if (productId && color && !country && !size) {
       const { deleteInventoryForColor } = await import("@/lib/db/products");
       result = await deleteInventoryForColor(productId, color);
    } else if (!productId || !country || !color || !size) {
      return Response.json({ error: "All fields required" }, { status: 400 });
    } else {
      result = await deleteInventoryItem(productId, country, color, size);
    }

    // Auto "Out of Stock" logic if total global inventory hits 0
    const remainingInventory = await getAllInventory(productId);
    const totalStock = remainingInventory.reduce((acc, item) => acc + (item.stock || 0), 0);
    
    if (totalStock <= 0) {
      const { patchProductStatus } = await import("@/lib/db/products");
      await patchProductStatus(productId, "Out of Stock");
    }

    return Response.json(result);
  } catch (error) {
    console.error("DELETE Inventory Error:", error);
    return Response.json(
      { error: "Failed to delete inventory" },
      { status: 500 },
    );
  }
}
