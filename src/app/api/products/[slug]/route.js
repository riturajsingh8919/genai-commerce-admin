import { getProductBySlug, getCountryPricing } from "@/lib/db/products";
import { headers } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const countryParam = url.searchParams.get("country");
    const headersList = await headers();
    
    // 1. Check URL override first (local testing)
    let detectedCountry = countryParam ? countryParam.toUpperCase() : null;

    // 2. Check headers (works on Vercel, CloudFront with custom headers, or local reverse proxies)
    if (!detectedCountry) {
      detectedCountry = headersList.get("x-vercel-ip-country") || headersList.get("cf-ipcountry");
    }

    // 3. Check IP address using reliable free geolocation services
    if (!detectedCountry) {
      try {
        const ip = headersList.get("x-forwarded-for")?.split(',')[0] || 
                   headersList.get("x-real-ip") || 
                   "";
        
        if (ip && ip !== "::1" && ip !== "127.0.0.1") {
          // Try api.country.is first
          try {
            const res = await fetch(`https://api.country.is/${ip}`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              const data = await res.json();
              if (data.country && data.country.length === 2) {
                detectedCountry = data.country.toUpperCase();
              }
            }
          } catch (e) { /* silent fallback */ }

          // Fallback to ip2c.org
          if (!detectedCountry) {
            try {
              const res = await fetch(`https://ip2c.org/${ip}`, { signal: AbortSignal.timeout(3000) });
              if (res.ok) {
                const text = await res.text();
                const parts = text.split(";");
                if (parts[0] === "1" && parts[1] && parts[1].length === 2) {
                  detectedCountry = parts[1].toUpperCase();
                }
              }
            } catch (e) { /* silent fallback */ }
          }
        }
      } catch (e) {
        console.error("IP Geoloc lookup failed:", e);
      }
    }

    // 4. Default to US if everything fails
    // Get combined country pricing and inventory (fallback to US if not found)
    let countryData = await getCountryPricing(product.id, detectedCountry);
    if (!countryData && detectedCountry !== "US") {
      countryData = await getCountryPricing(product.id, "US");
    }

    let variants = [];
    if (countryData && countryData.inventory) {
      for (const [color, sizes] of Object.entries(countryData.inventory)) {
        for (const [size, stock] of Object.entries(sizes)) {
          variants.push({ color, size, stock });
        }
      }
    }

    // Merge pricing into the product response
    const response = {
      ...product,
      detectedCountry,
    };

    if (countryData) {
      response.currency = countryData.currency;
      response.price = countryData.price;
      response.mrp = countryData.mrp;
      response.taxRate = countryData.taxRate;
      response.shippingFee = countryData.shippingFee;
      response.membershipPrice = countryData.membershipPrice;
      response.coupons = countryData.coupons || [];
      response.discountPercent = countryData.discountPercent;
      response.startDate = countryData.startDate;
      response.endDate = countryData.endDate;
    } else {
      // Robust Fallback: If no countryData found (even after US fallback attempt at line 51)
      response.currency = "USD";
      response.price = product.price;
      response.mrp = product.mrp;
      response.taxRate = 12; // Default tax
      response.shippingFee = 15; // Default shipping
      response.membershipPrice = "5.99";
      response.coupons = [];
    }

    if (variants.length > 0) {
      response.variants = variants;
    }

    return Response.json(response);
  } catch (error) {
    console.error("Public API Product Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
