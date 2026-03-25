"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MoreVertical,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Package,
  AlertCircle,
  Globe,
  X,
  Loader2,
  Save,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";
import { useAdminPermissions } from "@/contexts/AdminPermissionContext";

function ProductOptionsDropdown({ product, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleOpen = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Position menu below the button, aligned to the right
    setCoords({
      top: rect.bottom + window.scrollY,
      left: rect.right - 208 + window.scrollX, // 208 is menu width (w-52 = 13rem = 208px)
    });
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#0027ED]/5 text-[#64748b] hover:text-[#0027ED] rounded-lg transition-all cursor-pointer border border-[#e2e8f0] hover:border-[#0027ED]/20 font-light text-[10px] uppercase tracking-widest"
      >
        Actions <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-100"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              style={{
                position: "fixed",
                top: coords.top - window.scrollY + 8,
                left: coords.left - window.scrollX,
                width: "208px",
              }}
              className="bg-white border border-[#e2e8f0] rounded-xl shadow-2xl z-101 overflow-hidden"
            >
              <div className="p-1.5 space-y-0.5">
                <Link
                  href={`/nxring`}
                  target="_blank"
                  className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-light uppercase tracking-widest text-[#64748b] hover:text-[#0027ED] hover:bg-[#0027ED]/5 rounded-lg transition-all"
                >
                  <Eye className="w-4 h-4 opacity-70" /> View Storefront
                </Link>
                <Link
                  href={`/genai-admin/products/manage/${product.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-light uppercase tracking-widest text-[#64748b] hover:text-[#0027ED] hover:bg-[#0027ED]/5 rounded-lg transition-all"
                >
                  <Edit className="w-4 h-4 opacity-70" /> Edit Details
                </Link>
                <div className="h-px bg-[#e2e8f0] mx-2 my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-light uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 opacity-70" /> Terminate Listing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusChanger({ currentStatus }) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Out of Stock": "bg-amber-50 text-amber-600 border-amber-100",
    Draft: "bg-slate-50 text-slate-500 border-slate-100",
  };

  return (
    <div
      className={`inline-flex px-3 py-1 rounded-full text-[10px] font-light uppercase tracking-widest border transition-all ${
        styles[currentStatus] || styles.Draft
      }`}
    >
      {currentStatus || "Draft"}
    </div>
  );
}

function StockBreakdownTooltip({ stockByCountry }) {
  if (!stockByCountry || Object.keys(stockByCountry).length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full mb-3 left-0 z-100 w-52 bg-white border border-[#e2e8f0] rounded-xl shadow-2xl p-4 overflow-hidden"
    >
      <div className="space-y-3">
        <p className="text-[10px] font-medium text-[#0027ED] uppercase tracking-widest border-b border-[#f1f5f9] pb-2">
          Global Stock Matrix
        </p>
        <div className="space-y-2">
          {Object.entries(stockByCountry).map(([country, stock]) => (
            <div
              key={country}
              className="flex items-center justify-between group/row"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0027ED]/30 group-hover/row:bg-[#0027ED] transition-colors" />
                <span className="text-[10px] text-[#64748b] uppercase font-light">
                  {country}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium ${stock > 0 ? "text-[#0f172a]" : "text-rose-500"}`}
              >
                {stock} Units
              </span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-[#f1f5f9]">
          <p className="text-[8px] text-[#94a3b8] uppercase tracking-tighter italic">
            * Hover over badge to view breakdown
          </p>
        </div>
      </div>
      {/* Tooltip Arrow */}
      <div className="absolute -bottom-1 left-6 w-2 h-2 bg-white border-r border-b border-[#e2e8f0] rotate-45" />
    </motion.div>
  );
}

function StockDashboard({ products }) {
  const { isSuperAdmin, adminCountry } = useAdminPermissions();
  const [filters, setFilters] = useState({
    country: (!isSuperAdmin && adminCountry) ? adminCountry : "All",
    color: "All",
    size: "All",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Flatten the inventory data
  const flattenedInventory = products.flatMap((product) => {
    const items = [];
    Object.entries(product.granularInventory || {}).forEach(
      ([country, colors]) => {
        Object.entries(colors).forEach(([color, sizes]) => {
          Object.entries(sizes).forEach(([size, stock]) => {
            items.push({
              id: `${product.id}-${country}-${color}-${size}`,
              productId: product.id,
              title: product.title,
              mainImage:
                product.mainImage ||
                (product.colors &&
                  product.colors[0]?.heroAssets?.find((a) => a.type === "image")
                    ?.url) ||
                (product.colors && product.colors[0]?.productImage),
              country,
              color,
              size,
              stock: Number(stock),
            });
          });
        });
      },
    );
    return items;
  });

  // Extract filter options
  const countries = [
    "All",
    ...Array.from(new Set(flattenedInventory.map((i) => i.country))).sort(),
  ];
  const colors = [
    "All",
    ...Array.from(new Set(flattenedInventory.map((i) => i.color))).sort(),
  ];
  const sizes = [
    "All",
    ...Array.from(
      new Set(flattenedInventory.map((i) => i.size.toString())),
    ).sort((a, b) => Number(a) - Number(b)),
  ];

  // Apply filters
  const filteredItems = flattenedInventory.filter((item) => {
    const matchCountry =
      filters.country === "All" || item.country === filters.country;
    const matchColor = filters.color === "All" || item.color === filters.color;
    const matchSize =
      filters.size === "All" || item.size.toString() === filters.size;
    const matchSearch =
      item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.color.toLowerCase().includes(filters.search.toLowerCase());
    return matchCountry && matchColor && matchSize && matchSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Handle filter changes and reset pagination
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Dashboard Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-[10px] uppercase font-medium text-[#0027ED] tracking-widest pl-1">
            Country Matrix
          </label>
          <select
            disabled={!isSuperAdmin && !!adminCountry}
            value={filters.country}
            onChange={(e) => handleFilterChange("country", e.target.value)}
            className={`w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[10px] font-light uppercase tracking-widest text-[#0f172a] focus:border-[#0027ED] focus:bg-white outline-none transition-all cursor-pointer ${!isSuperAdmin && adminCountry ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "Every Region" : c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-light text-[#64748b] tracking-widest pl-1">
            Colorway
          </label>
          <select
            value={filters.color}
            onChange={(e) => handleFilterChange("color", e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[10px] font-light uppercase tracking-widest text-[#0f172a] focus:border-[#0027ED] focus:bg-white outline-none transition-all cursor-pointer"
          >
            {colors.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Colors" : c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-light text-[#64748b] tracking-widest pl-1">
            Size Range
          </label>
          <select
            value={filters.size}
            onChange={(e) => handleFilterChange("size", e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[10px] font-light uppercase tracking-widest text-[#0f172a] focus:border-[#0027ED] focus:bg-white outline-none transition-all cursor-pointer"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "Full Range" : `Size ${s}`}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-light text-[#64748b] tracking-widest pl-1">
            Search Matrix
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Filter specific items..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-light uppercase tracking-widest text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#0027ED] focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stock Matrix Listing */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[9px] uppercase tracking-[0.2em] text-[#94a3b8] bg-[#f8fafc]/50">
                <th className="px-8 py-5 font-light">Inventory Item</th>
                <th className="px-8 py-5 font-light text-center">Region</th>
                <th className="px-8 py-5 font-light text-center">Color</th>
                <th className="px-8 py-5 font-light text-center">Size</th>
                <th className="px-8 py-5 font-light text-right">
                  Available Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/50">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#f8fafc]/50 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] shrink-0 relative overflow-hidden bg-white shadow-xs group-hover:scale-105 transition-transform duration-300">
                          {item.mainImage ? (
                            <Image
                              src={item.mainImage}
                              alt=""
                              fill
                              className="object-cover p-1"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-[#cbd5e1] absolute inset-0 m-auto" />
                          )}
                        </div>
                        <span className="text-xs font-light text-[#0f172a] truncate max-w-[200px]">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-[10px] font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded uppercase tracking-widest border border-[#e2e8f0]">
                        {item.country}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-[10px] text-[#64748b] font-light uppercase tracking-widest">
                        {item.color}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-[10px] text-[#0f172a] font-medium">
                        {item.size}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[11px] font-bold ${item.stock > 10 ? "text-emerald-600" : item.stock > 0 ? "text-amber-600" : "text-rose-500"}`}
                        >
                          {item.stock} Units
                        </span>
                        {item.stock === 0 && (
                          <span className="text-[8px] uppercase tracking-tighter text-rose-400 font-medium">
                            Critical Depletion
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-8 h-8 text-[#cbd5e1] opacity-50" />
                      <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-light">
                        No precise matches found in the matrix
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]/30 flex items-center justify-between">
            <p className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-light">
              Showing{" "}
              <span className="text-[#0f172a] font-medium">
                {Math.min(
                  filteredItems.length,
                  (currentPage - 1) * itemsPerPage + 1,
                )}
                -{Math.min(filteredItems.length, currentPage * itemsPerPage)}
              </span>{" "}
              of{" "}
              <span className="text-[#0f172a] font-medium">
                {filteredItems.length}
              </span>{" "}
              Variants
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-2 border border-[#e2e8f0] rounded-xl text-[#64748b] disabled:opacity-30 hover:bg-[#0027ED]/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="p-2 border border-[#e2e8f0] rounded-xl text-[#64748b] disabled:opacity-30 hover:bg-[#0027ED]/5 transition-colors cursor-pointer rotate-180"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductPageOptions({ isReadOnly }) {
  const [isOpen, setIsOpen] = useState(false);

  if (isReadOnly) return null; // Hide the entire creation menu for read-only

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-xl text-xs font-light uppercase tracking-widest shadow-lg shadow-[#0027ED]/20 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Create Artifact
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-56 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <Link
                  href="/genai-admin/products/manage"
                  className="flex items-center gap-3 px-4 py-3 text-xs font-light uppercase tracking-widest text-[#64748b] hover:text-[#0027ED] hover:bg-[#0027ED]/5 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" /> New Listing
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-light uppercase tracking-widest text-[#64748b] hover:text-[#0027ED] hover:bg-[#0027ED]/5 rounded-xl transition-all cursor-pointer">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsList() {
  const { isSuperAdmin, isReadOnly, adminCountry } = useAdminPermissions();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Catalog"); // "Catalog" or "Dashboard"
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to terminate this listing?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const handleStatusUpdate = (id, newStatus) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );
  };

  const statuses = ["All", "Active", "Out of Stock", "Draft"];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700 pb-12 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e2e8f0] pb-8">
        <div>
          <h1 className="text-3xl font-light text-[#0f172a] mb-1.5 uppercase tracking-tighter">
            Inventory{" "}
            <span className="text-[#0027ED]/60 font-light">System</span>
          </h1>
          <p className="text-[#94a3b8] font-light flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
            Catalog Archive • {products.length} Items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProductPageOptions isReadOnly={isReadOnly} />
        </div>
      </div>

      {/* NEW: DASHBOARD SUMMARY CARDS REMOVED AS PER USER REQUEST */}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl w-fit">
          {["Catalog", "Dashboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-[10px] uppercase tracking-widest transition-all rounded-lg cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-[#0027ED] shadow-sm font-medium"
                  : "text-[#94a3b8] hover:text-[#64748b] font-light"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 flex-1 md:justify-end">
          <div className="relative flex-1 md:max-w-xs group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Filter by title, slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 pl-11 pr-4 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all font-light"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[10px] font-light uppercase tracking-widest text-[#0f172a] focus:outline-none focus:border-[#0027ED] cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s} Status
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === "Dashboard" ? (
        <StockDashboard products={filteredProducts} />
      ) : (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] bg-[#f8fafc]/50">
                  <th className="px-8 py-5 font-light">Product / Line</th>
                  <th className="px-8 py-5 font-light">Valuation</th>
                  <th className="px-8 py-5 font-light">Status</th>
                  <th className="px-8 py-5 font-light">System Reference</th>
                  <th className="px-8 py-5 font-light text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]/50">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-8 py-6">
                          <div className="flex gap-4 items-center">
                            <div className="h-12 w-12 bg-[#f8fafc] rounded-xl" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-[#f8fafc] rounded-full w-1/4" />
                              <div className="h-2 bg-[#f8fafc] rounded-full w-1/6 opacity-50" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-[#f8fafc]/30 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#e2e8f0] overflow-hidden relative shadow-sm transition-transform duration-500 group-hover:scale-105">
                            {product.mainImage ||
                            (product.colors &&
                              product.colors[0]?.heroAssets?.find(
                                (a) => a.type === "image",
                              )?.url) ||
                            (product.colors &&
                              product.colors[0]?.productImage) ? (
                              <Image
                                src={
                                  product.mainImage ||
                                  (product.colors &&
                                    product.colors[0]?.heroAssets?.find(
                                      (a) => a.type === "image",
                                    )?.url) ||
                                  product.colors[0].productImage
                                }
                                alt={product.title}
                                fill
                                sizes="48px"
                                className="object-cover p-1"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-[#94a3b8]/30" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-light text-[#0f172a] mb-0.5 tracking-tight group-hover:text-[#0027ED] transition-colors">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-2 relative">
                              <p className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-light">
                                {product.techSpecs?.model || "Standard"} •{" "}
                                {product.colors?.length || 0} variants
                              </p>
                              <div className="group/stock relative">
                                <Link
                                  href={`/genai-admin/products/manage/${product.id}#inventory`}
                                  className="px-2 py-0.5 bg-[#0027ED]/5 hover:bg-[#0027ED]/10 text-[#0027ED] text-[9px] uppercase tracking-widest font-medium rounded transition-colors flex items-center gap-1"
                                >
                                  <Globe className="w-2.5 h-2.5" />
                                  Stock: {product.totalStock || 0}
                                </Link>

                                <div className="hidden group-hover/stock:block">
                                  <StockBreakdownTooltip
                                    stockByCountry={product.stockByCountry}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-base font-light text-[#0f172a] tracking-tight">
                            {product.price
                              ? `${getCurrencySymbol(product.currency || "USD")}${formatPrice(product.price, product.currency || "USD")}`
                              : "Multi-Region"}
                          </span>
                          {product.mrp > product.price && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#94a3b8] line-through font-light">
                                {getCurrencySymbol(product.currency || "USD")}
                                {formatPrice(
                                  product.mrp,
                                  product.currency || "USD",
                                )}
                              </span>
                              <span className="text-[9px] text-[#0027ED] font-light uppercase">
                                -
                                {Math.round(
                                  ((product.mrp - product.price) /
                                    product.mrp) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <StatusChanger
                          productId={product.id}
                          currentStatus={product.status}
                          onStatusUpdate={handleStatusUpdate}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-[#64748b] font-mono opacity-60">
                            ID: {product.id.substring(0, 12)}...
                          </span>
                          <span className="text-[9px] text-[#0027ED] font-mono py-0.5 px-2 bg-[#0027ED]/5 rounded w-fit">
                            {product.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {isSuperAdmin && (
                        <div className="flex justify-end overflow-visible">
                          <ProductOptionsDropdown
                            product={product}
                            onDelete={() => handleDelete(product.id)}
                          />
                        </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-5 max-w-sm mx-auto">
                        <div className="p-5 bg-[#f8fafc] rounded-full border border-[#e2e8f0]">
                          <AlertCircle className="w-8 h-8 text-[#cbd5e1]" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-light text-[#0f172a] uppercase tracking-widest">
                            No Matrix Matches
                          </h3>
                          <p className="text-[#94a3b8] font-light text-xs leading-relaxed">
                            Your current filter configuration yielded zero
                            results.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setActiveTab("Catalog");
                            setStatusFilter("All");
                          }}
                          className="text-[#0027ED] font-light text-[10px] uppercase tracking-widest hover:underline cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
