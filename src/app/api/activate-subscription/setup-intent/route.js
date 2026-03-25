import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Create a SetupIntent to collect card details for future payments
    // This allows us to verify the card without an immediate charge
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      metadata: {
        email,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("SetupIntent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
