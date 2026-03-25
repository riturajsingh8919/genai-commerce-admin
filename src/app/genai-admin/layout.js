"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  UserCircle,
  LogOut,
  ChevronRight,
  CheckCheck,
  Eye,
  AlertTriangle,
  ChevronLeft,
  EyeOff,
} from "lucide-react";
import { deleteCookie } from "cookies-next";
import {
  AdminPermissionContext,
  ADMIN_TYPES,
} from "@/contexts/AdminPermissionContext";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/genai-admin" },
  { name: "Products", icon: Package, href: "/genai-admin/products" },
  { name: "Orders", icon: ShoppingCart, href: "/genai-admin/orders" },
  { name: "Users", icon: Users, href: "/genai-admin/users" },
  { name: "Dependents", icon: Users, href: "/genai-admin/dependents" },
  { name: "Settings", icon: Settings, href: "/genai-admin/settings" },
];

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState({
    name: "Admin",
    role: "admin",
    adminType: "SUPER_ADMIN",
    adminCountry: null,
  });

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return new Set(
          JSON.parse(localStorage.getItem("admin-read-notifs") || "[]"),
        );
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const notifRef = useRef(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Low Stock Carousel
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // Fetch notifications from dashboard API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setLowStockAlerts(data.lowStockAlerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markRead = (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("admin-read-notifs", JSON.stringify([...next]));
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds(() => {
      const next = new Set(notifications.map((n) => n.id));
      localStorage.setItem("admin-read-notifs", JSON.stringify([...next]));
      return next;
    });
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          setAdminUser(data);
        } else if (res.status === 401) {
          // Explicitly redirect to login if unauthorized
          router.push("/genai-admin/login");
        }
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
      }
    };

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsMobile(true);
      } else {
        setIsSidebarOpen(true);
        setIsMobile(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    if (pathname !== "/genai-admin/login") {
      fetchProfile().finally(() => {
        setIsLoading(false);
      });
    } else {
      setTimeout(() => setIsLoading(false), 0);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname, router]);

  // Carousel auto-slide
  useEffect(() => {
    if (lowStockAlerts.length <= 1 || isCarouselPaused) return;

    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % lowStockAlerts.length);
    }, 5000); // Slide every 5 seconds

    return () => clearInterval(interval);
  }, [lowStockAlerts.length, isCarouselPaused]);

  // Separate effect for notifications to avoid cascading setState lint error
  useEffect(() => {
    if (pathname === "/genai-admin/login") return;

    // Defer initial fetch so it doesn't trigger cascading renders
    const t = setTimeout(() => fetchNotifications(), 0);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search handler
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (q.trim().length > 0) {
      // Filter notifications + nav items as search results
      const navResults = menuItems
        .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
        .map((m) => ({ type: "page", title: m.name, href: m.href }));

      const orderResults = notifications
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q.toLowerCase()) ||
            n.description.toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, 5)
        .map((n) => ({
          type: "order",
          title: n.title,
          description: n.description,
          href: "/genai-admin/orders",
        }));

      setSearchResults([...navResults, ...orderResults]);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push("/genai-admin/orders");
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      deleteCookie("admin_token", { path: "/" }); // Client-side cleanup fallback
      setAdminUser(null);
      router.push("/genai-admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/genai-admin/login");
    }
  };

  const isSuperAdmin =
    !adminUser?.adminType || adminUser?.adminType === ADMIN_TYPES.SUPER_ADMIN;
  const isReadOnly = !isSuperAdmin;
  const adminCountry = adminUser?.adminCountry || null;

  const permissionValue = {
    isSuperAdmin,
    isReadOnly,
    adminCountry,
    adminType: adminUser?.adminType || ADMIN_TYPES.SUPER_ADMIN,
  };

  if (pathname === "/genai-admin/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0027ED] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#0027ED] font-light tracking-widest text-xs uppercase animate-pulse">
            Nexcura
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminPermissionContext.Provider value={permissionValue}>
      <div className="admin-root min-h-screen bg-[#f8fafc] text-[#0f172a] flex overflow-hidden font-sans selection:bg-[#0027ED]/10">
        {/* Premium Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0027ED]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5646a3]/5 blur-[120px] rounded-full" />
        </div>

        {/* Sidebar Overlay (Mobile) */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-40 transition-opacity cursor-pointer"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 z-50 w-72 h-screen bg-white border-r border-[#e2e8f0] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 shadow-sm`}
        >
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center gap-3 mb-12 px-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-[#0027ED] rounded-xl flex items-center justify-center shadow-lg shadow-[#0027ED]/20 cursor-pointer"
              >
                <span className="text-xl font-light text-white">N</span>
              </motion.div>
              <h2 className="text-2xl font-light tracking-tight text-[#0f172a]">
                Nexcura
              </h2>
            </div>

            <div className="mb-6 px-2">
              <p className="text-[10px] font-light text-[#64748b] uppercase tracking-[0.2em] mb-4">
                Main Navigation
              </p>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.name === "Products" &&
                      pathname.startsWith("/genai-admin/products"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                        isActive
                          ? "bg-[#0027ED] text-white shadow-md shadow-[#0027ED]/20"
                          : "hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 z-10">
                        <item.icon
                          className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-[#64748b] group-hover:text-[#0027ED]"}`}
                        />
                        <span className="text-sm font-light tracking-tight">
                          {item.name}
                        </span>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeInd"
                          className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full z-10 shadow-sm"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto h-px bg-[#e2e8f0] mb-8" />

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-[#f8fafc] p-3 rounded-2xl border border-[#e2e8f0] hover:border-[#0027ED]/30 transition-all cursor-pointer group">
                <div className="relative">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center border border-[#e2e8f0] group-hover:border-[#0027ED]/50 transition-colors">
                    <UserCircle className="w-6 h-6 text-[#0027ED]" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-light truncate text-[#0f172a] group-hover:text-[#0027ED] transition-colors">
                    {adminUser?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-[#64748b] font-light tracking-tight uppercase">
                    {adminUser?.adminType === ADMIN_TYPES.COUNTRY_ADMIN
                      ? `Admin · ${adminUser?.adminCountry}`
                      : adminUser?.adminType === ADMIN_TYPES.GLOBAL_ADMIN
                        ? "Global Admin"
                        : "Super Admin"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-[#64748b] hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 group cursor-pointer"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-light uppercase tracking-widest">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-screen relative">
          {/* Header */}
          <header className="sticky top-0 h-20 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] px-8 flex items-center justify-between z-30">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#e2e8f0] rounded-xl transition-all active:scale-95 lg:hidden cursor-pointer"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-[#0f172a]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#0f172a]" />
                )}
              </button>
              <div className="relative hidden xl:block" ref={searchRef}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-[#64748b]" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders, products, customers..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onKeyDown={handleSearchSubmit}
                  className="w-[400px] bg-[#f1f5f9] border border-transparent rounded-2xl py-3 pl-12 pr-12 text-sm focus:outline-none focus:border-[#0027ED] focus:bg-white focus:shadow-sm transition-all placeholder:text-[#64748b]"
                />
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full left-0 mt-2 w-full bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      {searchResults.map((r, i) => (
                        <Link
                          key={i}
                          href={r.href}
                          onClick={() => {
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0"
                        >
                          {r.type === "page" ? (
                            <LayoutDashboard className="w-4 h-4 text-[#0027ED]" />
                          ) : (
                            <ShoppingCart className="w-4 h-4 text-[#64748b]" />
                          )}
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm text-[#0f172a] truncate">
                              {r.title}
                            </p>
                            {r.description && (
                              <p className="text-[11px] text-[#94a3b8] truncate">
                                {r.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-3 h-3 text-[#cbd5e1]" />
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Low Stock Alert Carousel (Desktop) */}
            <div className="hidden xl:flex flex-1 justify-center max-w-[400px]">
              <AnimatePresence mode="wait">
                {lowStockAlerts.length > 0 &&
                  lowStockAlerts[currentAlertIndex] && (
                    <motion.div
                      key={currentAlertIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onMouseEnter={() => setIsCarouselPaused(true)}
                      onMouseLeave={() => setIsCarouselPaused(false)}
                      className="flex items-center gap-3 px-6 py-2.5 bg-rose-50 border border-rose-100 rounded-2xl group cursor-pointer hover:bg-rose-100/50 transition-all duration-300"
                    >
                      <div className="p-1.5 bg-rose-100 rounded-lg group-hover:scale-110 transition-transform">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                            Low Stock Alert
                          </span>
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                            {lowStockAlerts[currentAlertIndex].stock} Left
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-rose-950 truncate">
                          {lowStockAlerts[currentAlertIndex].productName} (
                          {lowStockAlerts[currentAlertIndex].variant})
                        </p>
                        <p className="text-[9px] text-rose-600/70 font-medium tracking-tight">
                          Inventory: {lowStockAlerts[currentAlertIndex].country}
                        </p>
                      </div>

                      {lowStockAlerts.length > 1 && (
                        <div className="ml-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentAlertIndex(
                                (prev) =>
                                  (prev - 1 + lowStockAlerts.length) %
                                  lowStockAlerts.length,
                              );
                            }}
                            className="p-1 hover:bg-rose-200 rounded-md transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentAlertIndex(
                                (prev) => (prev + 1) % lowStockAlerts.length,
                              );
                            }}
                            className="p-1 hover:bg-rose-200 rounded-md transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl transition-all cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-[#64748b]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#0027ED] rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[9px] text-white font-medium leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </span>
                  )}
                </motion.button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                        <h4 className="text-sm font-medium text-[#0f172a]">
                          Notifications
                        </h4>
                        <div className="flex items-center gap-3">
                          {unreadCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAllRead();
                              }}
                              className="flex items-center gap-1 text-[10px] text-[#64748b] hover:text-[#0027ED] uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              <CheckCheck className="w-3 h-3" /> Mark all read
                            </button>
                          )}
                          <span className="text-[10px] text-[#0027ED] uppercase tracking-widest">
                            {unreadCount} new
                          </span>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <p className="text-center text-[#94a3b8] text-sm py-8">
                            No notifications
                          </p>
                        ) : (
                          notifications.slice(0, 10).map((n) => {
                            const isRead = readIds.has(n.id);
                            return (
                              <div
                                key={n.id}
                                className={`flex gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0 ${isRead ? "opacity-50" : ""}`}
                              >
                                <Link
                                  href="/genai-admin/orders"
                                  onClick={() => {
                                    markRead(n.id);
                                    setShowNotifications(false);
                                  }}
                                  className="flex gap-3 flex-1 min-w-0"
                                >
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isRead ? "bg-[#f1f5f9]" : "bg-[#0027ED]/5"}`}
                                  >
                                    <Package
                                      className={`w-4 h-4 ${isRead ? "text-[#94a3b8]" : "text-[#0027ED]"}`}
                                    />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-[#0f172a] truncate">
                                      {n.title}
                                    </p>
                                    <p className="text-[11px] text-[#94a3b8] truncate">
                                      {n.description}
                                    </p>
                                    <p className="text-[10px] text-[#cbd5e1] mt-1">
                                      {n.time}
                                    </p>
                                  </div>
                                </Link>
                                {!isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markRead(n.id);
                                    }}
                                    className="p-1.5 hover:bg-[#e2e8f0] rounded-lg transition-colors shrink-0 self-center cursor-pointer"
                                    title="Mark as read"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#94a3b8]" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      <Link
                        href="/genai-admin/orders"
                        onClick={() => setShowNotifications(false)}
                        className="block text-center px-5 py-3 border-t border-[#f1f5f9] text-xs text-[#0027ED] hover:bg-[#f8fafc] transition-colors"
                      >
                        View All Orders
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-8 bg-[#e2e8f0] mx-2" />

              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] font-light text-[#0027ED] uppercase tracking-[0.2em] leading-none mb-1 text-right">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-light text-[#0f172a] tracking-tight">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Read-only Banner for non-super admins */}
          {isReadOnly && (
            <div className="sticky top-0 z-2 flex items-center justify-center gap-3 py-2.5 px-6 bg-amber-50 border-b border-amber-200">
              <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[11px] font-medium text-amber-700 uppercase tracking-widest">
                {adminUser?.adminType === ADMIN_TYPES.COUNTRY_ADMIN
                  ? `Country Admin — Read-Only · ${adminCountry}`
                  : "Global Admin — Read-Only · All Regions"}
              </p>
            </div>
          )}
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar relative">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>

        <style jsx global>{`
          .admin-root {
            color-scheme: light;
          }

          .admin-root button,
          .admin-root a,
          .admin-root [role="button"],
          .admin-root input[type="submit"],
          .admin-root input[type="button"],
          .admin-root .cursor-pointer {
            cursor: pointer !important;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
          }

          @keyframes float {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
            100% {
              transform: translateY(0px);
            }
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    </AdminPermissionContext.Provider>
  );
}
