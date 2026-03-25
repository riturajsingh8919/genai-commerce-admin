"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  UserPlus,
  Lock,
  DollarSign,
  Truck,
  ReceiptText,
  Tag,
  ChevronRight,
  Search,
  Trash2,
  Shield,
  Globe,
  Plus,
  Loader2,
  X,
  Edit2,
  Power,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol } from "@/lib/currency";
import { useAdminPermissions, ADMIN_TYPES } from "@/contexts/AdminPermissionContext";

export default function SettingsPage() {
  const { isSuperAdmin, adminCountry } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState(!isSuperAdmin ? "security" : "general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    role: "",
  });

  const [admins, setAdmins] = useState([]);
  const [dbCountries, setDbCountries] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    adminType: ADMIN_TYPES.SUPER_ADMIN,
    adminCountry: "",
  });

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponIndex, setEditingCouponIndex] = useState(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    startDate: "",
    endDate: "",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [generalSettings, setGeneralSettings] = useState({
    currency: "USD",
    soldBy: "NexCura Health Labs",
    shipFrom: "Warehouse 1, Silicon Valley, CA",
    featureBadges: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, settingsRes, adminsRes, dashRes] = await Promise.all([
          fetch("/api/admin/me"),
          fetch("/api/admin/settings"),
          fetch("/api/admin/users?role=admin"),
          fetch("/api/admin/dashboard"),
        ]);

        if (profileRes.ok) setAdminProfile(await profileRes.json());
        if (settingsRes.ok) setGeneralSettings(await settingsRes.json());
        if (adminsRes.ok) setAdmins(await adminsRes.json());
        if (dashRes.ok) {
          const dash = await dashRes.json();
          if (dash.availableCountries) setDbCountries(dash.availableCountries);
        }
      } catch (error) {
        console.error("Failed to fetch settings data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSettingsUpdate = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generalSettings),
      });
      if (res.ok) {
        // Updated silently for coupons/tax internal saves
        if (e) alert("Settings updated successfully");
      }
    } catch (error) {
      console.error("Settings Update Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const persistSettings = async (settings) => {
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Failed to persist settings:", error);
    }
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return;

    let updatedCoupons;
    if (editingCouponIndex !== null) {
      updatedCoupons = generalSettings.coupons.map((c, i) =>
        i === editingCouponIndex ? { ...c, ...newCoupon } : c,
      );
    } else {
      updatedCoupons = [
        ...generalSettings.coupons,
        { ...newCoupon, status: "Active" },
      ];
    }

    const updatedSettings = { ...generalSettings, coupons: updatedCoupons };
    setGeneralSettings(updatedSettings);
    setNewCoupon({ code: "", discount: "", startDate: "", endDate: "" });
    setShowCouponForm(false);
    setEditingCouponIndex(null);
    persistSettings(updatedSettings);
  };

  const toggleCouponStatus = (index) => {
    const updatedCoupons = generalSettings.coupons.map((c, i) =>
      i === index
        ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
        : c,
    );
    const updatedSettings = { ...generalSettings, coupons: updatedCoupons };
    setGeneralSettings(updatedSettings);
    persistSettings(updatedSettings);
  };

  const startEditingCoupon = (index) => {
    const coupon = generalSettings.coupons[index];
    setNewCoupon({
      code: coupon.code,
      discount: coupon.discount,
      startDate: coupon.startDate || "",
      endDate: coupon.endDate || "",
    });
    setEditingCouponIndex(index);
    setShowCouponForm(true);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAdmin, role: "admin" }),
      });

      if (res.ok) {
        const created = await res.json();
        setAdmins([...admins, created]);
        setShowAddAdmin(false);
        setNewAdmin({ name: "", email: "", password: "", adminType: ADMIN_TYPES.SUPER_ADMIN, adminCountry: "" });
        alert("Admin added successfully");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add admin");
      }
    } catch (error) {
      console.error("Add Admin Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admins.length <= 1) {
      alert("Cannot delete the last admin account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${admin.name} (${admin.email}) as an admin? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk: admin.pk }),
      });

      if (res.ok) {
        setAdmins(admins.filter((a) => a.pk !== admin.pk));
        alert("Admin removed successfully");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove admin");
      }
    } catch (error) {
      console.error("Delete Admin Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: adminProfile.name }),
      });
      if (res.ok) {
        alert("Profile updated successfully");
      }
    } catch (error) {
      console.error("Update Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwords.new || passwords.new.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: passwords.new }),
      });

      if (res.ok) {
        alert("Password updated successfully");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password Update Error:", error);
      alert("A system error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "general", name: "General Settings", icon: SettingsIcon, superOnly: true },
    { id: "cartfeatures", name: "Cart Features", icon: ShoppingBag, superOnly: true },
    { id: "admins", name: "Admin Accounts", icon: Shield, superOnly: true },
    { id: "security", name: "Profile & Security", icon: Lock },
  ].filter(tab => isSuperAdmin || !tab.superOnly);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#0027ED] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#0f172a] mb-1">
            System Settings
          </h1>
          <p className="text-[#64748b] font-medium">
            Configure your store, finances, and administration
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Sidebar */}
        <div className="w-full lg:w-72 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? "bg-[#0027ED]/5 border-[#0027ED]/20 text-[#0027ED] shadow-sm"
                  : "bg-white hover:bg-[#f8fafc] border-transparent text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              <tab.icon
                className={`w-5 h-5 ${activeTab === tab.id ? "text-[#0027ED]" : ""}`}
              />
              <span className="font-light text-sm uppercase tracking-wider">
                {tab.name}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[32px] p-8 min-h-[500px] relative overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "general" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-6">
                    <div>
                      <h3 className="text-xl font-light text-[#0f172a]">
                        Store Identity
                      </h3>
                      <p className="text-xs text-[#64748b] font-medium">
                        Global brand visibility settings
                      </p>
                    </div>
                    <button
                      onClick={handleSettingsUpdate}
                      disabled={isSaving}
                      className="bg-[#0027ED] text-white p-2.5 hover:bg-[#0021c7] rounded-xl cursor-pointer disabled:opacity-50 shadow-lg shadow-[#0027ED]/20 transition-all"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                        Legal Business Name
                      </label>
                      <input
                        value={generalSettings.soldBy}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            soldBy: e.target.value,
                          })
                        }
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                        Shipping Hub Address
                      </label>
                      <input
                        value={generalSettings.shipFrom}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            shipFrom: e.target.value,
                          })
                        }
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                        Store Currency
                      </label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            currency: e.target.value,
                          })
                        }
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="AED">AED (د.إ)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="SGD">SGD (S$)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "cartfeatures" && (
                <div className="space-y-8">
                  {/* Membership */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-6">
                      <div>
                        <h3 className="text-xl font-light text-[#0f172a]">
                          Membership Config
                        </h3>
                        <p className="text-xs text-[#64748b] font-medium">
                          Membership card shown on the cart page
                        </p>
                      </div>
                      <button
                        onClick={handleSettingsUpdate}
                        disabled={isSaving}
                        className="bg-[#0027ED] text-white p-2.5 hover:bg-[#0021c7] rounded-xl cursor-pointer disabled:opacity-50 shadow-lg shadow-[#0027ED]/20 transition-all"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                          Membership Name
                        </label>
                        <input
                          value={generalSettings.membership?.name || ""}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              membership: {
                                ...generalSettings.membership,
                                name: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                          Monthly Price (
                          {getCurrencySymbol(
                            (generalSettings?.currency || "USD").split(" ")[0],
                          )}
                          )
                        </label>
                        <input
                          value={generalSettings.membership?.price || ""}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              membership: {
                                ...generalSettings.membership,
                                price: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={generalSettings.membership?.description || ""}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            membership: {
                              ...generalSettings.membership,
                              description: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {/* Feature Badges Section */}
                    <div className="pt-10 border-t border-[#f1f5f9] space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-[#0f172a] uppercase tracking-wider">
                            Feature Badges
                          </h4>
                          <p className="text-[11px] text-[#64748b] font-light">
                            Small trust labels shown in the cart
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...generalSettings,
                              featureBadges: [
                                ...(generalSettings.featureBadges || []),
                                { label: "New Badge" },
                              ],
                            };
                            setGeneralSettings(updated);
                            persistSettings(updated);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] hover:bg-[#0027ED]/5 text-[#0027ED] border border-[#e2e8f0] hover:border-[#0027ED]/20 rounded-lg text-[10px] font-light uppercase tracking-widest transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Badge
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(generalSettings.featureBadges || []).map(
                          (badge, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] group"
                            >
                              <input
                                value={badge.label}
                                onChange={(e) => {
                                  const newBadges = [
                                    ...generalSettings.featureBadges,
                                  ];
                                  newBadges[idx] = {
                                    ...newBadges[idx],
                                    label: e.target.value,
                                  };
                                  setGeneralSettings({
                                    ...generalSettings,
                                    featureBadges: newBadges,
                                  });
                                }}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-light text-[#0f172a] p-0"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newBadges =
                                    generalSettings.featureBadges.filter(
                                      (_, i) => i !== idx,
                                    );
                                  const updated = {
                                    ...generalSettings,
                                    featureBadges: newBadges,
                                  };
                                  setGeneralSettings(updated);
                                  persistSettings(updated);
                                }}
                                className="p-1.5 text-[#94a3b8] hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "admins" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-6">
                    <div>
                      <h3 className="text-xl font-light text-[#0f172a]">
                        Administrative Access
                      </h3>
                      <p className="text-xs text-[#64748b] font-medium">
                        Control dashboard permissions
                      </p>
                    </div>
                    {isSuperAdmin && (
                    <button
                      onClick={() => setShowAddAdmin(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0027ED] text-white rounded-xl text-xs font-light uppercase tracking-widest hover:bg-[#0021c7] shadow-lg shadow-[#0027ED]/20 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Add Admin
                    </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {admins.map((admin) => (
                      <div
                        key={admin.email}
                        className="p-5 bg-[#f8fafc] rounded-[24px] border border-[#e2e8f0] flex items-center justify-between group hover:border-[#0027ED]/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white border border-[#e2e8f0] rounded-[18px] flex items-center justify-center text-[#0027ED] font-light text-lg shadow-sm group-hover:scale-105 transition-transform">
                            {admin.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-light text-[#0f172a] text-sm leading-tight">
                              {admin.name}
                            </p>
                            <p className="text-[10px] text-[#64748b] font-light">
                              {admin.email}
                              {admin.email === adminProfile.email &&
                                " (SESSION)"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Role badge */}
                          {(() => {
                            const type = admin.adminType || ADMIN_TYPES.SUPER_ADMIN;
                            const badgeMap = {
                              [ADMIN_TYPES.SUPER_ADMIN]: { label: "Super Admin", cls: "bg-[#0027ED]/10 text-[#0027ED] border-[#0027ED]/20" },
                              [ADMIN_TYPES.GLOBAL_ADMIN]: { label: "Global Admin", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                              [ADMIN_TYPES.COUNTRY_ADMIN]: { label: `Country · ${admin.adminCountry || "?"}`, cls: "bg-amber-50 text-amber-700 border-amber-200" },
                            };
                            const b = badgeMap[type];
                            return (
                              <span className={`px-3 py-1 border rounded-full text-[9px] font-medium uppercase tracking-widest ${b.cls}`}>
                                {b.label}
                              </span>
                            );
                          })()}
                          {isSuperAdmin && admins.length >= 2 ? (
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              disabled={
                                isSaving || admin.email === adminProfile.email
                              }
                              className="p-2 hover:bg-rose-50 text-[#94a3b8] hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                admin.email === adminProfile.email
                                  ? "Cannot delete your own account"
                                  : "Remove admin"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-2 text-[#cbd5e1] cursor-not-allowed"
                              title="Need at least 2 admins to remove one"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-12">
                  <div className="space-y-8">
                    <h3 className="text-xl font-light text-[#0f172a] border-b border-[#f1f5f9] pb-6">
                      Identity Profile
                    </h3>
                    <div className="max-w-md space-y-6">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest ml-1">
                          Full Legal Name
                        </label>
                        <input
                          value={adminProfile.name}
                          onChange={(e) =>
                            setAdminProfile({
                              ...adminProfile,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3.5 px-5 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest ml-1">
                          Registered Email (Locked)
                        </label>
                        <input
                          value={adminProfile.email}
                          readOnly
                          className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl py-3.5 px-5 text-[#64748b] font-medium cursor-not-allowed"
                        />
                      </div>
                      <button
                        onClick={handleProfileUpdate}
                        disabled={isSaving}
                        className="px-8 py-3.5 bg-[#0027ED] text-white rounded-xl text-xs font-light uppercase tracking-widest shadow-lg shadow-[#0027ED]/20 hover:bg-[#0021c7] transition-all cursor-pointer disabled:opacity-50"
                      >
                        Update Identity
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-xl font-light text-[#0f172a] border-b border-[#f1f5f9] pb-6">
                      Nxring Access
                    </h3>
                    <div className="max-w-md space-y-6">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest ml-1">
                          New Secure Password
                        </label>
                        <input
                          type="password"
                          value={passwords.new}
                          onChange={(e) =>
                            setPasswords({ ...passwords, new: e.target.value })
                          }
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3.5 px-5 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest ml-1">
                          Verify New Password
                        </label>
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              confirm: e.target.value,
                            })
                          }
                          className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3.5 px-5 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <button
                        onClick={handlePasswordUpdate}
                        disabled={isSaving}
                        className="w-full py-4 bg-white border-2 border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#0027ED] rounded-xl text-xs font-light uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? "Authorizing..." : "Re-Secure Access"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddAdmin && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAdmin(false)}
              className="absolute inset-0 bg-white/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white border border-[#e2e8f0] rounded-[40px] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden"
            >
              {/* Subtle Blue Glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0027ED]/5 blur-[80px] rounded-full" />

              <div className="flex items-center justify-between mb-10 relative">
                <div>
                  <h2 className="text-3xl font-light text-[#0f172a] mb-1.5 tracking-tight italic">
                    New Operator
                  </h2>
                  <p className="text-xs text-[#64748b] font-light uppercase tracking-widest">
                    Authorized System Access
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAdmin(false)}
                  className="p-3 bg-[#f8fafc] hover:bg-rose-50 text-[#64748b] hover:text-rose-600 rounded-full border border-[#e2e8f0] transition-all cursor-pointer shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-8 relative">
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-[0.2em] ml-1">
                      Full Identity
                    </label>
                    <input
                      required
                      value={newAdmin.name}
                      onChange={(e) =>
                        setNewAdmin({ ...newAdmin, name: e.target.value })
                      }
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4 px-6 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                      placeholder="e.g. Alexander Pierce"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-[0.2em] ml-1">
                      Nxring Email
                    </label>
                    <input
                      required
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) =>
                        setNewAdmin({ ...newAdmin, email: e.target.value })
                      }
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4 px-6 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                      placeholder="operator@nexring.pro"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-[0.2em] ml-1">
                      System Key
                    </label>
                    <input
                      required
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) =>
                        setNewAdmin({ ...newAdmin, password: e.target.value })
                      }
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4 px-6 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-[0.2em] ml-1">
                      Access Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: ADMIN_TYPES.SUPER_ADMIN, label: "Super Admin", sub: "Full CRUD", icon: Shield },
                        { value: ADMIN_TYPES.GLOBAL_ADMIN, label: "Global Admin", sub: "All regions", icon: Globe },
                        { value: ADMIN_TYPES.COUNTRY_ADMIN, label: "Country Admin", sub: "One region", icon: Globe },
                      ].map(({ value, label, sub, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setNewAdmin({ ...newAdmin, adminType: value, adminCountry: "" })}
                          className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            newAdmin.adminType === value
                              ? "border-[#0027ED]/40 bg-[#0027ED]/5 text-[#0027ED]"
                              : "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:border-[#0027ED]/20"
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-[9px] font-medium uppercase tracking-wider leading-tight">{label}</span>
                          <span className="text-[8px] opacity-60">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Country Selector — only for COUNTRY_ADMIN */}
                  {newAdmin.adminType === ADMIN_TYPES.COUNTRY_ADMIN && (
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-[0.2em] ml-1">
                        Assigned Country
                      </label>
                      <select
                        required
                        value={newAdmin.adminCountry}
                        onChange={(e) => setNewAdmin({ ...newAdmin, adminCountry: e.target.value })}
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4 px-6 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="">
                          {dbCountries.length === 0 ? "Loading countries..." : "Select country..."}
                        </option>
                        {dbCountries.map((code) => {
                          const countryMap = {
                            US: "🇺🇸 United States", IN: "🇮🇳 India", GB: "🇬🇧 United Kingdom",
                            AE: "🇦🇪 UAE", CA: "🇨🇦 Canada", AU: "🇦🇺 Australia",
                            SG: "🇸🇬 Singapore", JP: "🇯🇵 Japan", DE: "🇩🇪 Germany",
                            FR: "🇫🇷 France", BR: "🇧🇷 Brazil", MX: "🇲🇽 Mexico",
                            NZ: "🇳🇿 New Zealand", ZA: "🇿🇦 South Africa", NG: "🇳🇬 Nigeria",
                          };
                          return (
                            <option key={code} value={code}>
                              {countryMap[code] || `🌍 ${code}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAdmin(false)}
                    className="flex-1 py-4 bg-white hover:bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] rounded-2xl font-light text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-4 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-2xl font-light text-xs uppercase tracking-widest shadow-xl shadow-[#0027ED]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    Authorize
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
