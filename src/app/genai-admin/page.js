"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";
import { useAdminPermissions } from "@/contexts/AdminPermissionContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { adminCountry, isSuperAdmin } = useAdminPermissions();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState("revenue"); // 'revenue' | 'sales'
  const [countryFilter, setCountryFilter] = useState(adminCountry || "US");

  // Derive the active filter: COUNTRY_ADMINs are hard-locked to their region.
  // Super Admins/Global Admins use the selected state.
  const activeFilter = (!isSuperAdmin && adminCountry) ? adminCountry : countryFilter;

  const isMounted = useRef(false);

  useEffect(() => {
    // Show loading state on subsequent filter changes, but avoid initial mount sync issue
    if (isMounted.current) {
      setTimeout(() => setLoading(true), 0);
    }
    
    fetch(`/api/admin/dashboard?country=${activeFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });

    isMounted.current = true;
  }, [activeFilter, isSuperAdmin, adminCountry]); 

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#0027ED] animate-spin" />
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const chartData = dashboard?.chartData || [];
  const recentOrders = dashboard?.recentOrders || [];

  // Map country code to currency code for proper symbol resolving
  const getCurrencyCode = (country) => {
    const map = {
      US: "USD",
      IN: "INR",
      GB: "GBP",
      DE: "EUR",
      FR: "EUR",
      AE: "AED",
      CA: "CAD",
      AU: "AUD",
      SG: "SGD",
      JP: "JPY",
    };
    return map[country] || "USD";
  };

  const activeCurrency =
    dashboard?.activeCurrency ||
    (countryFilter === "ALL" ? "USD" : getCurrencyCode(countryFilter));

  const statCards = [
    {
      name: "Total Revenue",
      value: `${getCurrencySymbol(activeCurrency)}${formatPrice(stats.totalRevenue || 0, activeCurrency)}`,
      icon: DollarSign,
      sub: `${getCurrencySymbol(activeCurrency)}${formatPrice(stats.weekRevenue || 0, activeCurrency)} this week`,
    },
    {
      name: "Total Orders",
      value: stats.totalOrders || 0,
      icon: ShoppingCart,
      sub: `${stats.ordersToday || 0} today`,
    },
    {
      name: "Customers",
      value: stats.totalCustomers || 0,
      icon: Users,
      sub: "registered users",
    },
    {
      name: "Orders Today",
      value: stats.ordersToday || 0,
      icon: Package,
      sub: "placed today",
    },
  ];

  const statusColor = (status) => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
      case "DELIVERED":
        return "text-emerald-600 bg-emerald-50";
      case "PROCESSING":
        return "text-[#0027ED] bg-[#0027ED]/5";
      case "SHIPPED":
        return "text-amber-600 bg-amber-50";
      case "CANCELLED":
        return "text-rose-600 bg-rose-50";
      default:
        return "text-[#64748b] bg-[#f1f5f9]";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-[#0027ED]/10 text-[#0027ED] text-[10px] font-light uppercase tracking-widest rounded-md border border-[#0027ED]/20">
              Live Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-[#0f172a] mb-2">
            Welcome Back,{" "}
            <span className="bg-linear-to-r from-[#0027ED] to-[#5646a3] bg-clip-text text-transparent italic pr-4">
              GenAI
            </span>
          </h1>
          <p className="text-[#64748b] font-light flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {currentDate}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6 md:mt-0">
          <div className="relative group">
            <select
              value={activeFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              disabled={!isSuperAdmin && adminCountry}
              className={`appearance-none bg-white border border-[#e2e8f0] text-[#0f172a] hover:border-[#cbd5e1] px-5 py-2.5 pr-12 rounded-2xl text-sm font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0027ED]/20 focus:border-[#0027ED] transition-all min-w-[120px] ${!isSuperAdmin && adminCountry ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <option value="US">USA</option>
              <option value="IN">IN</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center p-1 bg-[#f1f5f9] rounded-lg group-hover:bg-[#e2e8f0] transition-colors">
              <Globe className="w-3.5 h-3.5 text-[#64748b]" />
            </div>
          </div>

          <Link
            href="/nxring"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-2xl text-sm font-medium shadow-lg shadow-[#0027ED]/20 transition-all active:scale-95 w-full sm:w-auto"
          >
            <ExternalLink className="w-4 h-4" /> View Store
          </Link>
        </div>
      </div>

      {/* Stats Grid — live data */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative bg-white border border-[#e2e8f0] rounded-[32px] p-6 overflow-hidden hover:shadow-xl hover:shadow-[#0027ED]/5 transition-all hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-[#f8fafc] rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-[#e2e8f0]">
                <stat.icon className="w-6 h-6 text-[#0027ED]" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-light px-2.5 py-1 rounded-full uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0]">
                <ArrowUpRight className="w-3 h-3" />
                Live
              </div>
            </div>
            <div>
              <p className="text-xs font-light text-[#64748b] uppercase tracking-widest mb-1.5">
                {stat.name}
              </p>
              <h3 className="text-3xl font-light text-[#0f172a] tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[11px] text-[#94a3b8] mt-1">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chart — live data */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 bg-white border border-[#e2e8f0] p-8 rounded-[32px] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-light text-[#0f172a] italic tracking-tight underline decoration-[#0027ED] decoration-4 underline-offset-8">
              Weekly Performance
            </h3>
            <div className="flex bg-[#f1f5f9] border border-[#e2e8f0] p-1.5 rounded-xl">
              {["revenue", "sales"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartMode(tab)}
                  className={`px-4 py-1.5 text-xs font-light rounded-lg transition-all capitalize cursor-pointer ${chartMode === tab ? "bg-white text-[#0027ED] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0027ED" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0027ED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    dx={-10}
                    tickFormatter={(val) =>
                      chartMode === "revenue"
                        ? `${getCurrencySymbol(activeCurrency)}${formatPrice(val, activeCurrency)}`
                        : val
                    }
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#0027ED",
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      boxShadow: "0 10px 30px rgba(0,39,237,0.1)",
                    }}
                    itemStyle={{ color: "#0027ED", fontWeight: 800 }}
                    formatter={(val) => [
                      chartMode === "revenue"
                        ? `${getCurrencySymbol(activeCurrency)}${formatPrice(val, activeCurrency)}`
                        : val,
                      chartMode === "revenue" ? "Revenue" : "Sales",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode}
                    stroke="#0027ED"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#94a3b8] text-sm">
                No data for last 7 days
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Orders — live */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-[#e2e8f0] shadow-sm p-8 rounded-[32px] h-full"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-light text-[#0f172a] italic">
                Live Orders
              </h3>
              <span className="w-2.5 h-2.5 bg-[#0027ED] rounded-full animate-ping" />
            </div>

            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-center text-[#94a3b8] text-sm py-8">
                  No orders yet
                </p>
              ) : (
                recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href="/genai-admin/orders"
                    className="flex gap-4 p-4 hover:bg-[#f8fafc] border border-transparent hover:border-[#e2e8f0] rounded-2xl transition-all group"
                  >
                    <div className="w-12 h-12 bg-[#f1f5f9] rounded-xl border border-[#e2e8f0] flex items-center justify-center shrink-0 group-hover:bg-[#0027ED]/10 transition-colors">
                      <Package className="w-6 h-6 text-[#64748b] group-hover:text-[#0027ED]" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-sm font-light text-[#0f172a] truncate">
                          {order.customer}
                        </p>
                        <p className="text-[10px] font-bold text-[#0027ED]">
                          {order.amount}
                        </p>
                      </div>
                      <p className="text-xs text-[#64748b] truncate mb-2">
                        {order.product}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-light uppercase ${statusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                        <span className="text-[10px] text-[#64748b] font-light italic">
                          {order.time}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/genai-admin/orders"
              className="w-full mt-8 py-4 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#e2e8f0] rounded-2xl text-[10px] font-light text-[#0f172a] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              View All Orders
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
