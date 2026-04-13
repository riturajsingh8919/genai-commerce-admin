"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Download,
  Package,
  Loader2,
  X,
  Trash2,
  Check,
  ChevronDown,
  Gift,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";
import { useAdminPermissions } from "@/contexts/AdminPermissionContext";

const STATUS_OPTIONS = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const { isSuperAdmin, isReadOnly, adminCountry } = useAdminPermissions();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const initialCountry = (!isSuperAdmin && adminCountry) ? adminCountry : "US";
  const [countryFilter, setCountryFilter] = useState(initialCountry);
  const [availableCountries, setAvailableCountries] = useState(["US", "IN"]);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'delete'
  const [editData, setEditData] = useState({
    status: "",
    shipmentIndex: "all",
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/orders?country=${countryFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch orders error:", err);
        setLoading(false);
      });
  }, [countryFilter]);

  useEffect(() => {
    fetchOrders();
    // Fetch available countries from dashboard API (since it already aggregates them)
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.availableCountries)
          setAvailableCountries(["US", "IN"]);
      })
      .catch((err) => console.error("Error fetching countries:", err));

    // Auto-refresh orders every 15 seconds for real-time
    const interval = setInterval(() => {
      // Silent refresh without loading spinner
      fetch(`/api/admin/orders?country=${countryFilter}`)
        .then((res) => res.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error("Silent refresh error:", err));
    }, 15000);
    return () => clearInterval(interval);
  }, [countryFilter, fetchOrders]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          shipmentIndex: editData.shipmentIndex,
        }),
      });
      if (res.ok) {
        fetchOrders();
        setModalType(null);
        setEditData({ status: "", shipmentIndex: "all" });
      }
    } catch (err) {
      console.error("Update status error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOrders();
        setModalType(null);
      }
    } catch (err) {
      console.error("Delete order error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Email",
      "Items",
      "Total",
      "Status",
      "Date",
      "Address",
    ];
    const csvData = filteredOrders.map((order) => [
      order.id,
      order.customer?.name,
      order.customer?.email,
      order.items?.map((i) => `${i.quantity}x ${i.title}`).join("; "),
      order.total,
      order.status,
      new Date(order.createdAt).toLocaleString(),
      order.shippingAddress?.replace(/,/g, " "),
    ]);

    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `nexring_orders_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "SHIPPED":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "PROCESSING":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "CANCELLED":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusIconColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500";
      case "SHIPPED":
        return "bg-blue-500";
      case "PROCESSING":
        return "bg-amber-500 animate-pulse";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-[#0027ED] animate-spin" />
        <p className="text-[#64748b] font-medium tracking-widest text-[10px] uppercase">
          Loading Data Base...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-[#0f172a] mb-2 tracking-tight">
            Orders
          </h1>
          <p className="text-[#64748b] text-base">
            Detailed overview of your customer transactions and ring shipments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-2xl text-[13px] font-medium hover:bg-[#f8fafc] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Volume",
            val: orders.length.toString(),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: countryFilter === "ALL" ? "Total Rings Sold" : "Total Sales",
            val:
              countryFilter === "ALL"
                ? orders
                    .reduce(
                      (acc, curr) =>
                        acc +
                        (curr.items?.reduce(
                          (iAcc, i) => iAcc + (i.quantity || 0),
                          0,
                        ) || 0),
                      0,
                    )
                    .toString()
                : `${getCurrencySymbol(orders[0]?.currency || "USD")}${formatPrice(
                    orders.reduce((acc, curr) => acc + (curr.total || 0), 0),
                    orders[0]?.currency || "USD",
                  )}`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Successfully Delivered",
            val: orders
              .filter((o) => o.status === "DELIVERED")
              .length.toString(),
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-[#e2e8f0] p-7 rounded-[32px] flex items-center gap-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div
              className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] text-[#64748b] font-medium mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-[#0f172a] tracking-tight">
                {stat.val}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#e2e8f0] rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-8 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="relative w-full md:w-[450px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8] group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4 pl-14 pr-6 text-[15px] text-[#0f172a] focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl px-5 py-3 text-sm text-[#0f172a] min-w-[140px]">
              <Globe className="w-4 h-4 mr-3 text-[#94a3b8]" />
              <select
                disabled={!isSuperAdmin && !!adminCountry}
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`bg-transparent focus:outline-none appearance-none cursor-pointer pr-8 w-full font-medium ${!isSuperAdmin && adminCountry ? "opacity-50 cursor-not-allowed" : ""}`}
              >

                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c === "US" ? "USA" : c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 -ml-6 pointer-events-none text-[#94a3b8]" />
            </div>

            <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl px-5 py-3 text-sm text-[#0f172a] min-w-[180px]">
              <Filter className="w-4 h-4 mr-3 text-[#94a3b8]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none appearance-none cursor-pointer pr-8 w-full font-medium"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 -ml-6 pointer-events-none text-[#94a3b8]" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Cards */}
      <div className="space-y-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e2e8f0] rounded-[32px] overflow-hidden hover:shadow-xl hover:border-blue-600/20 transition-all duration-300 group"
            >
              {/* Card Header: Main Info & Status */}
              <div className="px-8 py-6 border-b border-[#f1f5f9] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">
                      Order Date
                    </p>
                    <p className="text-sm font-semibold text-[#0f172a]">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-[#e2e8f0] hidden md:block" />
                  <div>
                    <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">
                      Order ID
                    </p>
                    <p className="text-sm font-mono font-medium text-blue-600">
                      #{order.id?.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {order.isGift && (
                    <span className="px-4 py-1.5 bg-purple-100 text-purple-700 text-[11px] font-bold rounded-full flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" /> GIFT ORDER
                    </span>
                  )}

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalType("view");
                      }}
                      className="p-2.5 bg-white border border-[#e2e8f0] text-slate-600 hover:text-blue-600 hover:border-blue-600 rounded-xl transition-all shadow-sm cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </button>
                    {!isReadOnly && isSuperAdmin && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setModalType("delete");
                      }}
                      className="p-2.5 bg-white border border-[#e2e8f0] text-slate-600 hover:text-red-600 hover:border-red-600 rounded-xl transition-all shadow-sm cursor-pointer"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body: Split into sections */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 1. Customer & Items */}
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Customer Profile
                    </h4>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-[#0f172a]">
                        {order.customer?.name}
                      </p>
                      <p className="text-sm text-[#64748b] font-medium">
                        {order.customer?.email}
                      </p>
                      {(order.phone || order.customer?.phone) && (
                        <p className="text-sm text-[#64748b] mt-2 flex items-center gap-2">
                          <span className="text-base">📞</span>{" "}
                          {order.phone || order.customer?.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Ordered Items
                    </h4>
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100"
                        >
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-blue-600">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0f172a]">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#64748b] font-medium uppercase">
                              {item.color}{" "}
                              {item.size ? `| Size: ${item.size}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Logistics & Shipments */}
                <div className="lg:col-span-5 border-x border-slate-100 px-6">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Logistics & Shipments
                  </h4>
                  <div className="space-y-4">
                    {(
                      order.shipments || [
                        {
                          address:
                            order.shippingAddress ||
                            order.shippingAddresses?.[0],
                          status: order.status,
                        },
                      ]
                    ).map((s, idx) => {
                      const shipmentItems =
                        s.itemIndices?.length > 0
                          ? s.itemIndices.map((idxi) => {
                              const expandedItems = [];
                              order.items?.forEach((item) => {
                                for (let k = 0; k < item.quantity; k++)
                                  expandedItems.push(item);
                              });
                              return expandedItems[idxi];
                            })
                          : order.items || [];

                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusIconColor(s.status)}`}
                              />
                              <span className="text-[11px] font-black text-[#0f172a] uppercase tracking-wider">
                                {s.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                             {!isReadOnly && !["DELIVERED", "CANCELLED"].includes(
                                s.status,
                              ) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setEditData({
                                      status: s.status,
                                      shipmentIndex: idx,
                                    });
                                    setModalType("edit");
                                  }}
                                  className="px-3 py-1 bg-white border border-slate-200 text-[#64748b] hover:text-blue-600 hover:border-blue-600 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                >
                                  Update
                                </button>
                              )}
                              <span className="text-[9px] font-bold text-slate-400">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                          <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                            {s.address}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {shipmentItems.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-slate-100"
                              >
                                <div
                                  className="w-2 h-2 rounded-full shadow-sm"
                                  style={{
                                    backgroundColor: item.color?.toLowerCase(),
                                  }}
                                />
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                                  {item.color}{" "}
                                  {item.size ? `| Size: ${item.size}` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Payment & Activation */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Total Amount
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">
                        {getCurrencySymbol(order.currency)}
                        {formatPrice(order.total, order.currency)}
                      </span>
                    </div>
                    {order.appliedCoupon && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400">
                          Coupon: {order.appliedCoupon.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          -{order.appliedCoupon.discount}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Activation Codes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {order.activationCodes ? (
                        order.activationCodes.map((c, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 border rounded-xl flex items-center gap-2 text-xs font-medium ${c.status === "Active" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${c.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`}
                            />
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-[10px] tracking-tight">
                                {typeof c === "string" ? c : c.code}
                              </span>
                              {c.status === "Active" && c.activatedBy && (
                                <span className="text-[9px] opacity-70 font-medium whitespace-nowrap">
                                  {c.activatedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No codes generated yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-[32px] p-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#64748b]/50" />
              </div>
              <p className="text-[#64748b] text-sm">
                No operational records found matching your query
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-100 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isActionLoading && setModalType(null)}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-[#f1f5f9] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0f172a]">
                    {modalType === "view"
                      ? "Order Details"
                      : modalType === "edit"
                        ? "Update Order Status"
                        : "Delete Order"}
                  </h3>
                  <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">
                    Order Ref: #{selectedOrder.id.split("-")[0].toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-2 hover:bg-[#f8fafc] rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#64748b]" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                {modalType === "view" && selectedOrder && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Customer & Address Group */}
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Customer Profile
                          </h4>
                          <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                            <p className="text-xl font-black text-[#0f172a]">
                              {selectedOrder.customer.name}
                            </p>
                            <p className="text-sm text-[#64748b] font-medium mt-1">
                              {selectedOrder.customer.email}
                            </p>
                            {(selectedOrder.phone ||
                              selectedOrder.customer?.phone) && (
                              <div className="mt-4 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl w-fit border border-slate-100">
                                <span className="text-lg">📞</span>
                                <span className="text-sm font-bold text-[#0f172a]">
                                  {selectedOrder.phone ||
                                    selectedOrder.customer.phone}
                                </span>
                              </div>
                            )}
                            {selectedOrder.isGift && (
                              <div className="mt-4 px-4 py-2.5 bg-purple-50 text-purple-700 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 border border-purple-100">
                                <Gift className="w-4 h-4" /> Personalized Gift
                                Order
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Logistics Hub
                          </h4>
                          <div className="space-y-4">
                            {(
                              selectedOrder.shipments || [
                                {
                                  address:
                                    selectedOrder.shippingAddress ||
                                    selectedOrder.shippingAddresses?.[0],
                                  status: selectedOrder.status,
                                },
                              ]
                            ).map((s, idx) => {
                              const shipmentItems =
                                s.itemIndices?.length > 0
                                  ? s.itemIndices.map((idxi) => {
                                      const expandedItems = [];
                                      selectedOrder.items?.forEach((item) => {
                                        for (let k = 0; k < item.quantity; k++)
                                          expandedItems.push(item);
                                      });
                                      return expandedItems[idxi];
                                    })
                                  : selectedOrder.items || [];

                              return (
                                <div
                                  key={idx}
                                  className="bg-slate-50 border border-slate-100 p-5 rounded-[32px] hover:border-blue-200 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${getStatusIconColor(s.status)}`}
                                      />
                                      <span className="text-sm font-black text-[#0f172a]">
                                        {s.status}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">
                                      Dest. #{idx + 1}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                                    {s.address}
                                  </p>
                                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/50">
                                    {shipmentItems.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-slate-100"
                                      >
                                        <div
                                          className="w-2.5 h-2.5 rounded-full border border-slate-200"
                                          style={{
                                            backgroundColor:
                                              item.color?.toLowerCase(),
                                          }}
                                        />
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                                          {item.color}{" "}
                                          {item.size
                                            ? `| Size: ${item.size}`
                                            : ""}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {s.trackingNumber && (
                                    <div className="mt-4 p-3 bg-blue-600 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-600/20">
                                      <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">
                                        Tracking
                                      </span>
                                      <span className="text-xs font-mono font-black text-white">
                                        {s.trackingNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Payment & Activation codes */}
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Financial & Vault
                          </h4>
                          <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full" />

                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-3">
                                Total Investment
                              </p>
                              <div className="text-5xl font-black tracking-tight flex items-baseline gap-1">
                                <span className="text-2xl text-slate-500">
                                  {getCurrencySymbol(selectedOrder.currency)}
                                </span>
                                {formatPrice(
                                  selectedOrder.total,
                                  selectedOrder.currency,
                                )}
                              </div>
                              {selectedOrder.appliedCoupon && (
                                <div className="mt-4 flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-400/10 px-3 py-1.5 rounded-full w-fit border border-emerald-400/20">
                                  <span>
                                    Coupon: {selectedOrder.appliedCoupon.code}
                                  </span>
                                  <span className="opacity-50">
                                    (-{selectedOrder.appliedCoupon.discount})
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">
                                Activation Keys
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {(selectedOrder.activationCodes || []).map(
                                  (c, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 hover:bg-white/10 transition-colors"
                                    >
                                      <span className="font-mono text-xs tracking-[3px] text-blue-400 font-black">
                                        {typeof c === "string" ? c : c.code}
                                      </span>
                                      <span
                                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${c.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}
                                      >
                                        {c.status}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-3">
                                Transaction Blueprint
                              </p>
                              <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                                <code className="text-[10px] text-slate-400 font-mono">
                                  {selectedOrder.paymentIntentId ||
                                    "Direct Record"}
                                </code>
                                <div className="p-1.5 bg-white/5 rounded-lg">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                      <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                        Order Summary
                      </h4>
                      <div className="bg-white border border-[#e2e8f0] rounded-[32px] overflow-hidden">
                        {(selectedOrder.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-6 border-b border-[#f1f5f9] last:border-0 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="text-base font-bold text-[#0f172a]">
                                  {item.title}
                                </p>
                                <p className="text-xs text-[#64748b] font-semibold uppercase">
                                  {item.color}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-[#0f172a]">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-[11px] text-[#94a3b8] italic">
                                Unit price included
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {modalType === "edit" && (
                  <div className="space-y-8 max-w-2xl mx-auto">
                    {/* Target Context Card */}
                    {selectedOrder?.shipments?.[editData.shipmentIndex] ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 relative overflow-hidden transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Truck className="w-16 h-16 text-slate-900" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20">
                              Target Shipment #
                              {Number(editData.shipmentIndex) + 1}
                            </span>
                            <div className="h-4 w-px bg-slate-200" />
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              Destination Secured
                            </span>
                          </div>

                          <p className="text-lg font-bold text-[#0f172a] leading-tight mb-4 max-w-md">
                            {
                              selectedOrder.shipments[editData.shipmentIndex]
                                .address
                            }
                          </p>

                          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/50">
                            {(() => {
                              const s =
                                selectedOrder.shipments[editData.shipmentIndex];
                              const shipmentItems =
                                s?.itemIndices?.length > 0
                                  ? s.itemIndices.map((idxi) => {
                                      const expandedItems = [];
                                      selectedOrder.items?.forEach((item) => {
                                        for (let k = 0; k < item.quantity; k++)
                                          expandedItems.push(item);
                                      });
                                      return expandedItems[idxi];
                                    })
                                  : selectedOrder.items || [];

                              return shipmentItems.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm"
                                >
                                  <div
                                    className="w-3 h-3 rounded-full shadow-inner"
                                    style={{
                                      backgroundColor:
                                        item.color?.toLowerCase(),
                                    }}
                                  />
                                  <span className="text-[10px] font-extrabold text-[#0f172a] uppercase tracking-wide">
                                    {item.color}
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                          Initialising Operational Context...
                        </p>
                      </div>
                    )}

                    {/* Status Pipeline */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Evolution State
                        </h4>
                        <div className="h-px flex-1 mx-6 bg-slate-100" />
                      </div>

                      <div className="relative space-y-3">
                        <div className="absolute left-[24px] top-11 bottom-11 w-px bg-slate-200" />

                        {STATUS_OPTIONS.map((s, i) => {
                          const isSelected = editData.status === s;
                          const isCurrentStatus =
                            selectedOrder.shipments?.[editData.shipmentIndex]
                              ?.status === s;

                          const statusStyles = {
                            PROCESSING: {
                              icon: Clock,
                              desc: "Rings are being sized & prepared for shipment",
                              colorClass: "amber",
                              bgSelected: "bg-amber-600",
                              borderSelected: "border-amber-600",
                              bgLight: "bg-amber-50/50",
                              textSelected: "text-amber-700",
                            },
                            SHIPPED: {
                              icon: Truck,
                              desc: "Handed over to carrier. Customer receives tracking number",
                              colorClass: "blue",
                              bgSelected: "bg-blue-600",
                              borderSelected: "border-blue-600",
                              bgLight: "bg-blue-50/50",
                              textSelected: "text-blue-700",
                            },
                            DELIVERED: {
                              icon: CheckCircle2,
                              desc: "Confirmed delivery. Customer ownership starts",
                              colorClass: "emerald",
                              bgSelected: "bg-emerald-600",
                              borderSelected: "border-emerald-600",
                              bgLight: "bg-emerald-50/50",
                              textSelected: "text-emerald-700",
                            },
                            CANCELLED: {
                              icon: AlertCircle,
                              desc: "Order voided. This action is terminal",
                              colorClass: "red",
                              bgSelected: "bg-red-600",
                              borderSelected: "border-red-600",
                              bgLight: "bg-red-50/50",
                              textSelected: "text-red-700",
                            },
                          }[s];

                          const StatusIcon = statusStyles.icon;

                          return (
                            <div key={s} className="space-y-3">
                              <button
                                onClick={() =>
                                  setEditData({ ...editData, status: s })
                                }
                                className={`relative w-full flex items-start gap-6 p-5 rounded-[32px] transition-all border-2 text-left ${
                                  isSelected
                                    ? `${statusStyles.borderSelected} ${statusStyles.bgLight} shadow-sm`
                                    : "bg-white hover:bg-slate-50 border-slate-50"
                                }`}
                              >
                                <div
                                  className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    isSelected
                                      ? `${statusStyles.bgSelected} text-white shadow-lg`
                                      : "bg-white border border-slate-200 text-slate-400"
                                  }`}
                                >
                                  <StatusIcon className="w-6 h-6" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span
                                      className={`text-sm font-bold ${isSelected ? statusStyles.textSelected : "text-slate-700"}`}
                                    >
                                      {s}
                                    </span>
                                    {isCurrentStatus && (
                                      <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                    {statusStyles.desc}
                                  </p>
                                </div>
                              </button>

                              {isSelected && s === "CANCELLED" && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="px-5 py-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 mx-4"
                                >
                                  <AlertCircle className="w-5 h-5 shrink-0" />
                                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                    Warning: Terminal Action. This will void the
                                    shipment permanently.
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setModalType(null)}
                        className="px-8 py-4 bg-white text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all border border-slate-200"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(editData.status)}
                        disabled={
                          isActionLoading ||
                          (editData.shipmentIndex === "all"
                            ? selectedOrder.shipments?.every(
                                (sh) => sh.status === editData.status,
                              )
                            : selectedOrder.shipments?.[editData.shipmentIndex]
                                ?.status === editData.status)
                        }
                        className={`flex-1 py-4 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-30 disabled:grayscale disabled:pointer-events-none ${
                          ["DELIVERED", "CANCELLED"].includes(editData.status)
                            ? "bg-red-600 shadow-red-600/20"
                            : "bg-blue-600 shadow-blue-600/20"
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {["DELIVERED", "CANCELLED"].includes(
                              editData.status,
                            )
                              ? "Confirm & Finalize"
                              : "Update Logistics"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {modalType === "delete" && (
                  <div className="space-y-6 text-center py-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                      <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-[#0f172a] mb-2">
                        Purge Order Confirmation
                      </h4>
                      <p className="text-sm text-[#64748b] max-w-sm mx-auto font-medium">
                        Are you certain you wish to purge{" "}
                        <span className="text-red-600 font-bold">
                          #{selectedOrder.id.substring(0, 8).toUpperCase()}
                        </span>
                        ? This action will erase all operational trace and is{" "}
                        <span className="text-red-600 font-bold">
                          irreversible
                        </span>
                        .
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                      <button
                        onClick={() => setModalType(null)}
                        className="flex-1 py-4 bg-[#f8fafc] text-[#64748b] rounded-2xl text-[13px] font-semibold cursor-pointer hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteOrder}
                        disabled={isActionLoading}
                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Confirm Purge"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
