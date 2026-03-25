import { NextResponse } from "next/server";
import { getAllOrders, getAllUsers } from "@/lib/db/orders";
import { getAllProducts } from "@/lib/db/products";
import { COUNTRY_CURRENCY_MAP, CURRENCY_MAP } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const countryFilter = searchParams.get("country") || "US";

    const [allOrders, users, products] = await Promise.all([
      getAllOrders(),
      getAllUsers(),
      getAllProducts(),
    ]);

    // 1. Extract dynamically available countries from DB (Products + Existing Orders)
    const availableCountriesSet = new Set(["US"]); // Always keep US as baseline fallback
    products.forEach((p) => {
      if (p.stockByCountry) {
        Object.keys(p.stockByCountry).forEach((c) =>
          availableCountriesSet.add(c),
        );
      }
    });
    // Also include countries from existing orders to ensure they remain filterable
    allOrders.forEach(o => {
      if (o.country) availableCountriesSet.add(o.country);
    });
    const availableCountries = Array.from(availableCountriesSet);

    // 2. Filter orders by selected country
    const targetCurrency = COUNTRY_CURRENCY_MAP[countryFilter] || "USD";
    const orders = allOrders.filter((o) => {
      if (o.country) return o.country === countryFilter;
      // Fallback for transition period: use currency mapping
      return (o.currency || "USD") === targetCurrency;
    });

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate stats from real data
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (parseFloat(o.total) || 0),
      0,
    );
    const totalOrders = orders.length;

    // Filter customers by the selected country (based on their order history)
    const regionalCustomerEmails = new Set();
    orders.forEach(o => {
      if (o.customer?.email) regionalCustomerEmails.add(o.customer.email.toLowerCase());
    });
    const totalCustomers = regionalCustomerEmails.size;

    // Orders today
    const ordersToday = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    ).length;

    // Revenue this week
    const weekOrders = orders.filter((o) => new Date(o.createdAt) >= weekAgo);
    const weekRevenue = weekOrders.reduce(
      (sum, o) => sum + (parseFloat(o.total) || 0),
      0,
    );

    // Status breakdown
    const statusCounts = {};
    orders.forEach((o) => {
      const s = o.status || "UNKNOWN";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Daily revenue for chart (last 7 days)
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayOrders = orders.filter((o) => {
        const created = new Date(o.createdAt);
        return created >= dayStart && created < dayEnd;
      });

      dailyData.push({
        name: dayName,
        sales: dayOrders.length,
        revenue: dayOrders.reduce(
          (sum, o) => sum + (parseFloat(o.total) || 0),
          0,
        ),
      });
    }

    // Recent orders (last 10, sorted by newest)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((o) => {
        const currency = o.currency || "USD";
        const symbol =
          CURRENCY_MAP[currency] || (currency === "INR" ? "₹" : "$");
        return {
          id: o.id,
          shortId: `#${o.id.split("-")[0].toUpperCase()}`,
          customer: o.customer?.name || "Unknown",
          email: o.customer?.email || "",
          product:
            o.items?.map((i) => `${i.title} - ${i.color}`).join(", ") ||
            "NexRing",
          amount: `${symbol}${parseFloat(o.total || 0).toLocaleString(
            currency === "INR" ? "en-IN" : "en-US",
            {
              minimumFractionDigits: currency === "INR" ? 0 : 2,
              maximumFractionDigits: 2,
            },
          )}`,
          status: o.status || "PAID",
          time: timeAgo(new Date(o.createdAt)),
          createdAt: o.createdAt,
        };
      });

    // 3. Low Stock Detection (Global/Deep)
    const lowStockAlerts = [];
    products.forEach(p => {
      // Use granularInventory for deep inspection of variants
      if (p.granularInventory) {
        Object.entries(p.granularInventory).forEach(([country, variants]) => {
          Object.entries(variants).forEach(([color, sizes]) => {
            Object.entries(sizes).forEach(([size, stock]) => {
              const stockNum = parseInt(stock);
              if (!isNaN(stockNum) && stockNum < 5) {
                lowStockAlerts.push({
                  id: `${p.id}-${country}-${color}-${size}`,
                  productName: p.title,
                  variant: `${color} / ${size}`,
                  country: country === "US" ? "USA" : country,
                  stock: stockNum
                });
              }
            });
          });
        });
      }
    });

    // 4. Notifications — Global (all orders) with region-aware currency
    const notifications = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map((o) => {
        const currency = o.currency || "USD";
        const symbol = CURRENCY_MAP[currency] || (currency === "INR" ? "₹" : "$");
        const formattedAmount = parseFloat(o.total || 0).toLocaleString(
          currency === "INR" ? "en-IN" : "en-US",
          {
            minimumFractionDigits: currency === "INR" ? 0 : 2,
            maximumFractionDigits: 2,
          }
        );

        return {
          id: o.id,
          type: "order",
          title: `New order from ${o.customer?.name || "customer"}`,
          description: `${symbol}${formattedAmount} — ${o.items?.length || 0} item(s)`,
          time: timeAgo(new Date(o.createdAt)),
          createdAt: o.createdAt,
          read: false,
          status: o.status,
          country: o.country || "US"
        };
      });

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        ordersToday,
        weekRevenue,
      },
      statusCounts,
      chartData: dailyData,
      recentOrders,
      notifications,
      lowStockAlerts,
      availableCountries,
      activeCountry: countryFilter,
      activeCurrency: targetCurrency,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
