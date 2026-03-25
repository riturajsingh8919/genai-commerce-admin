import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/db/products";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json(product);
  } catch (error) {
    console.error("GET Product Error:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const product = await updateProduct(id, data);
    return Response.json(product);
  } catch (error) {
    console.error("PUT Product Error:", error);
    return Response.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await deleteProduct(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
