import Stripe from "stripe";

// Use STRIPE_SECRET_KEY for production, fallback to STRIPE_TEST_SECRET for dev
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET);

export default stripe;
