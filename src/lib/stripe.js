import Stripe from "stripe";

const stripeKey =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET;

if (!stripeKey && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️ WARNING: Stripe Secret Key is missing from Environment Variables. Payment features will fail.",
  );
}

const stripe = new Stripe(stripeKey || "sk_test_missing_key");

export default stripe;
