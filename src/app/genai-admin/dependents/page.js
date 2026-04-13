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
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminPermissions } from "@/contexts/AdminPermissionContext";

export default function DependentsPage() {
  const { isSuperAdmin, adminCountry } = useAdminPermissions();
  const [dependents, setDependents] = useState([]);
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
    const params = new URLSearchParams({ dependents: "true" });
    if (countryFilter !== "ALL") params.append("country", countryFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setDependents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch dependents error:", err);
        setLoading(false);
      });
  }, [countryFilter]);

  // Fetch available countries dynamically
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

  const filteredDependents = dependents.filter(
    (dep) =>
      dep.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.mainPurchaserEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const exportToCSV = () => {
    const headers = ["Activator Email", "Purchaser Email", "Plan", "Activated At", "Address"];
    const csvData = filteredDependents.map((dep) => [
      dep.email,
      dep.mainPurchaserEmail,
      dep.subscription?.plan,
      new Date(dep.joinedAt).toLocaleString(),
      dep.address?.replace(/,/g, " ") || "N/A",
    ]);

    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `nexring_dependents_${new Date().toISOString().split("T")[0]}.csv`,
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
          Scanning Activation Grid...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#0f172a] mb-1">
            Dependent Activation Network
          </h1>
          <p className="text-[#64748b] font-medium">
            Biometric telemetry from linked family and dependent accounts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
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
            <Download className="w-4 h-4" /> Export Network Data
          </button>
        </div>
      </div>

      <div className="p-10 bg-white border border-[#e2e8f0] rounded-[40px] relative overflow-hidden group shadow-sm">
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-emerald-500/5 rounded-[24px] group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-4xl font-light text-[#0f172a] tracking-tight mb-1">
              {dependents.length}
            </h3>
            <p className="text-[#64748b] text-xs font-light uppercase tracking-widest">
              Active Dependent Links
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b] group-focus-within:text-[#0027ED] transition-colors" />
        <input
          type="text"
          placeholder="Locate dependent by email or linked purchaser..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-[#e2e8f0] rounded-[24px] py-5 pl-14 pr-8 text-[#0f172a] font-light placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0027ED] focus:ring-4 focus:ring-[#0027ED]/5 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDependents.map((dep) => (
          <motion.div
            key={dep.email}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8 }}
            className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] group transition-all hover:shadow-xl hover:shadow-[#0f172a]/5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-transparent to-[#f8fafc]/50 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-emerald-500 rounded-[22px] flex items-center justify-center font-light text-2xl text-white shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div className="px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Verified Link
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-xl font-light text-[#0f172a] mb-1">
                    {dep.email.split('@')[0]}
                  </h4>
                  <p className="text-sm text-[#64748b] font-light flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-[#0027ED]/60" /> {dep.email}
                  </p>
                  
                  <div className="p-4 bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] space-y-3">
                    <div>
                      <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widert mb-1">Linked Purchaser</p>
                      <p className="text-sm text-[#0f172a] font-medium flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-[#0027ED]" /> {dep.mainPurchaserEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widert mb-1">Plan Configuration</p>
                      <p className="text-sm text-[#0f172a] font-medium">
                        {dep.subscription?.plan || "Essential"} Membership
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#f1f5f9] flex justify-between items-center text-[10px] font-light uppercase tracking-widest text-[#64748b]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0027ED]/40" />{" "}
                    {new Date(dep.joinedAt).toLocaleDateString()}
                  </div>
                  <div className="text-emerald-600 bg-emerald-500/5 px-3 py-1 rounded-full font-bold">
                    ACTIVE
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
