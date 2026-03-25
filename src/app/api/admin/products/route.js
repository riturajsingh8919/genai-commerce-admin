import { getAllProducts, createProduct } from "@/lib/db/products";

export async function GET() {
  try {
    const products = await getAllProducts();
    return Response.json(products);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const product = await createProduct(data);
    return Response.json(product);
  } catch (error) {
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
