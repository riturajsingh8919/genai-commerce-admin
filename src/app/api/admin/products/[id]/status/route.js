import { patchProductStatus } from "@/lib/db/products";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return Response.json({ error: "Status is required" }, { status: 400 });
    }

    const updated = await patchProductStatus(id, status);
    return Response.json(updated);
  } catch (error) {
    console.error("PATCH Status Error:", error);
    return Response.json({ error: "Failed to update status" }, { status: 500 });
  }
}
