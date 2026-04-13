"use client";

import { useEffect, useState } from "react";
import {
  Search,
  UserCircle,
  Mail,
  Calendar,
  ShieldCheck,
  MoreVertical,
  Download,
  Loader2,
  MapPin,
  Globe,
  Check,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdminPermissions } from "@/contexts/AdminPermissionContext";

export default function UsersPage() {
  const { isSuperAdmin, isReadOnly, adminCountry, adminType } = useAdminPermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const initialCountry = (!isSuperAdmin && adminCountry) ? adminCountry : "US";
  const [countryFilter, setCountryFilter] = useState(initialCountry);
  const [availableCountries, setAvailableCountries] = useState([
    "US",
    "IN",
  ]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ role: "user" });
    if (countryFilter !== "ALL") params.append("country", countryFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch users error:", err);
        setLoading(false);
      });
  }, [countryFilter]);

  // Fetch available countries dynamically to ensure the filter stays in sync
  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.availableCountries) {
          setAvailableCountries(["US", "IN"]);
        }
      })
      .catch((err) => console.error("Fetch countries error:", err));
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Address",
      "Joined Date",
      "Last Order",
      "Total Orders",
    ];
    const csvData = filteredUsers.map((user) => [
      user.name,
      user.email,
      user.address?.replace(/,/g, " ") || user.adminCountry || "No Location",
      user.joinedAt ? new Date(user.joinedAt).toLocaleString() : user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A",
      user.lastOrderAt ? new Date(user.lastOrderAt).toLocaleString() : "N/A",
      user.totalOrders || (user.role === "admin" ? "N/A" : 1),
    ]);

    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `nexring_users_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-[#0027ED] animate-spin" />
        <p className="text-[#64748b] font-medium tracking-widest text-[10px] uppercase">
          Scanning Neural Database...
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#0f172a] mb-1">
            Verified Customer Hub
          </h1>
          <p className="text-[#64748b] font-medium">
            Intelligence on every verified NexRing operator
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Country Selection Dropdown */}
          <div className="relative">
            <button
              disabled={!isSuperAdmin && !!adminCountry}
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className={`flex items-center gap-3 px-5 py-3 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-[#f8fafc] transition-all cursor-pointer shadow-sm min-w-[160px] justify-between ${!isSuperAdmin && adminCountry ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#0027ED]" />
                <span>
                  {countryFilter === "ALL" ? "All Regions" : countryFilter}
                </span>
              </div>
              <ChevronDown
                className={`w-3 h-3 text-[#64748b] transition-transform ${showCountryDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showCountryDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCountryDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {availableCountries.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setLoading(true);
                        setCountryFilter(c);
                        setShowCountryDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-[10px] uppercase tracking-widest transition-colors hover:bg-[#f8fafc]"
                    >
                      <span
                        className={
                          countryFilter === c
                            ? "text-[#0027ED] font-bold"
                            : "text-[#64748b]"
                        }
                      >
                        {c === "ALL" ? "All Regions" : c}
                      </span>
                      {countryFilter === c && (
                        <Check className="w-3 h-3 text-[#0027ED]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-xl text-[10px] font-light uppercase tracking-widest hover:bg-[#f8fafc] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Nxring Data
          </button>
        </div>
      </div>

      <div className="p-10 bg-white border border-[#e2e8f0] rounded-[40px] relative overflow-hidden group shadow-sm">
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-[#0027ED]/5 rounded-[24px] group-hover:scale-110 transition-transform">
            <UserCircle className="w-10 h-10 text-[#0027ED]" />
          </div>
          <div>
            <h3 className="text-4xl font-light text-[#0f172a] tracking-tight mb-1">
              {users.length}
            </h3>
            <p className="text-[#64748b] text-xs font-light uppercase tracking-widest">
              Verified Operators Across Network
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0027ED]/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b] group-focus-within:text-[#0027ED] transition-colors" />
        <input
          type="text"
          placeholder="Locate operator by name or frequency (email)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-[#e2e8f0] rounded-[24px] py-5 pl-14 pr-8 text-[#0f172a] font-light placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0027ED] focus:ring-4 focus:ring-[#0027ED]/5 transition-all shadow-sm"
        />
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.email}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8 }}
            className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] group transition-all hover:shadow-xl hover:shadow-[#0f172a]/5 relative overflow-hidden"
          >
            {/* Subtle Gradient Backdrop */}
            <div className="absolute inset-0 bg-linear-to-br from-transparent to-[#f8fafc]/50 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-[#0027ED] rounded-[22px] flex items-center justify-center font-light text-2xl text-white shadow-lg shadow-[#0027ED]/20 group-hover:rotate-6 transition-transform">
                  {user.name?.charAt(0) || "U"}
                </div>
                <button className="p-3 bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] rounded-2xl text-[#64748b] transition-all cursor-pointer">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-xl font-light text-[#0f172a] flex items-center gap-2 mb-1">
                    {user.name}
                  </h4>
                  <p className="text-sm text-[#64748b] font-light flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-[#0027ED]/60" /> {user.email}
                  </p>
                  <p className="text-[11px] text-[#64748b] font-light flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#0027ED]/40" />{" "}
                    {user.address || user.country || user.adminCountry || "No Location Provided"}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#f1f5f9] flex justify-between items-center text-[10px] font-light uppercase tracking-widest text-[#64748b]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0027ED]/40" />{" "}
                    {user.joinedAt || user.createdAt 
                      ? new Date(user.joinedAt || user.createdAt).toLocaleDateString() 
                      : "N/A"}
                  </div>
                  <div className="text-[#0027ED] bg-[#0027ED]/5 px-3 py-1 rounded-full font-light">
                    {user.totalOrders || 1} Orders
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
