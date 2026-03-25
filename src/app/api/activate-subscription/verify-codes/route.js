import { NextResponse } from "next/server";
import { verifyActivationCodes } from "@/lib/db/orders";

export async function POST(req) {
  try {
    const { codes } = await req.json();

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: "Invalid codes provided" },
        { status: 400 }
      );
    }

    const verification = await verifyActivationCodes(codes);

    if (!verification.success) {
      return NextResponse.json(
        { 
          error: "One or more codes are invalid", 
          results: verification.results 
        },
        { status: 400 }
      );
    }

    // Check if any codes are already active
    const alreadyActive = verification.results.find(r => r.status === "Active");
    if (alreadyActive) {
      return NextResponse.json(
        { error: `Code ${alreadyActive.code} is already activated` },
        { status: 400 }
      );
    }

    // Ensure all codes belong to the same order if multiple codes are provided
    const orderIds = new Set(verification.results.map(r => r.orderId));
    if (orderIds.size > 1) {
      return NextResponse.json(
        { error: "Codes must belong to the same order" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      results: verification.results,
      orderId: verification.results[0].orderId,
      purchaserEmail: verification.results[0].purchaserEmail,
      createdAt: verification.results[0].createdAt
    });
  } catch (error) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
