"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Save,
  X,
  Upload,
  Plus,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Globe,
  Package,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";
import { useAdminPermissions } from "@/contexts/AdminPermissionContext";

export default function ProductManage() {
  const router = useRouter();
  const { isReadOnly } = useAdminPermissions();
  const params = useParams();
  const id = params.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : null;
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isReadOnly) {
      router.push("/genai-admin/products");
    }
  }, [isReadOnly, router]);

  // Pricing & Inventory state (only used when editing)
  const [pricingRows, setPricingRows] = useState([]);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [pricingForm, setPricingForm] = useState({
    country: "US",
    currency: "USD",
    price: "",
    mrp: "",
    taxRate: "12",
    shippingFee: "15",
    membershipPrice: "",
    coupons: "",
    discountPercent: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    customCountry: "",
  });
  const [inventoryForm, setInventoryForm] = useState({
    country: "US",
    color: "",
    size: "7",
    stock: "",
    customCountry: "",
  });
  const [pricingSaving, setPricingSaving] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);

  // Inventory Pagination
  const [currentInventoryPage, setCurrentInventoryPage] = useState(1);
  const rowsPerPage = 10;
  const totalInventoryPages = Math.ceil(inventoryRows.length / rowsPerPage);
  const paginatedInventory = inventoryRows.slice(
    (currentInventoryPage - 1) * rowsPerPage,
    currentInventoryPage * rowsPerPage,
  );

  const COUNTRY_OPTIONS = [
    { code: "US", label: "United States", currency: "USD" },
    { code: "IN", label: "India", currency: "INR" },
    { code: "GB", label: "United Kingdom", currency: "GBP" },
    { code: "DE", label: "Germany", currency: "EUR" },
    { code: "FR", label: "France", currency: "EUR" },
    { code: "AE", label: "UAE", currency: "AED" },
    { code: "SA", label: "Saudi Arabia", currency: "SAR" },
    { code: "CA", label: "Canada", currency: "CAD" },
    { code: "AU", label: "Australia", currency: "AUD" },
    { code: "SG", label: "Singapore", currency: "SGD" },
    { code: "JP", label: "Japan", currency: "JPY" },
    { code: "KR", label: "South Korea", currency: "KRW" },
    { code: "BR", label: "Brazil", currency: "BRL" },
    { code: "MX", label: "Mexico", currency: "MXN" },
    { code: "ZA", label: "South Africa", currency: "ZAR" },
    { code: "NZ", label: "New Zealand", currency: "NZD" },
    { code: "SE", label: "Sweden", currency: "SEK" },
    { code: "CH", label: "Switzerland", currency: "CHF" },
    { code: "IT", label: "Italy", currency: "EUR" },
    { code: "ES", label: "Spain", currency: "EUR" },
    { code: "NL", label: "Netherlands", currency: "EUR" },
    { code: "MY", label: "Malaysia", currency: "MYR" },
    { code: "TH", label: "Thailand", currency: "THB" },
    { code: "ID", label: "Indonesia", currency: "IDR" },
    { code: "PH", label: "Philippines", currency: "PHP" },
    { code: "OTHER", label: "— Custom Country Code —", currency: "USD" },
  ];

  const SIZE_OPTIONS = ["7", "8", "9", "10", "11", "12"];

  // Fetch pricing & inventory when editing
  useEffect(() => {
    if (isEdit && id) {
      fetch(`/api/admin/products/pricing?productId=${id}`)
        .then((r) => r.json())
        .then((data) => setPricingRows(data || []))
        .catch(console.error);
      fetch(`/api/admin/products/inventory?productId=${id}`)
        .then((r) => r.json())
        .then((data) => setInventoryRows(data || []))
        .catch(console.error);
    }
  }, [isEdit, id]);

  const handleAddPricing = async () => {
    if (!pricingForm.price) return;
    const actualCountry =
      pricingForm.country === "OTHER"
        ? pricingForm.customCountry.toUpperCase().trim()
        : pricingForm.country;
    if (!actualCountry) return;
    setPricingSaving(true);
    try {
      await fetch("/api/admin/products/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          country: actualCountry,
          currency: pricingForm.currency,
          price: pricingForm.price,
          mrp: pricingForm.mrp,
          taxRate: pricingForm.taxRate,
          shippingFee: pricingForm.shippingFee,
          membershipPrice: pricingForm.membershipPrice,
          coupons: pricingForm.coupons
            ? pricingForm.coupons
                .split(",")
                .map((c) => c.trim().toUpperCase())
                .filter((c) => c)
            : [],
          discountPercent: pricingForm.discountPercent,
          startDate: pricingForm.startDate,
          endDate: pricingForm.endDate,
        }),
      });
      const res = await fetch(`/api/admin/products/pricing?productId=${id}`);
      setPricingRows(await res.json());
      setPricingForm({
        country: "US",
        currency: "USD",
        price: "",
        mrp: "",
        taxRate: "12",
        shippingFee: "15",
        membershipPrice: "",
        coupons: "",
        discountPercent: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        customCountry: "",
      });
      setIsEditingPricing(false);
    } catch (e) {
      console.error(e);
    }
    setPricingSaving(false);
  };

  const handleDeletePricing = async (country) => {
    try {
      await fetch("/api/admin/products/pricing", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, country }),
      });
      setPricingRows((prev) => prev.filter((r) => r.country !== country));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddInventory = async () => {
    if (!inventoryForm.color || !inventoryForm.stock || !inventoryForm.size)
      return;
    const actualCountry =
      inventoryForm.country === "OTHER"
        ? inventoryForm.customCountry.toUpperCase().trim()
        : inventoryForm.country;
    if (!actualCountry) return;
    setInventorySaving(true);
    try {
      const colorsToAdd =
        inventoryForm.color === "ALL"
          ? (formData.colors || []).map((c) => c.name)
          : [inventoryForm.color];
      const sizesToAdd =
        inventoryForm.size === "ALL" ? SIZE_OPTIONS : [inventoryForm.size];

      const payload = [];
      for (const c of colorsToAdd) {
        for (const s of sizesToAdd) {
          payload.push({
            productId: id,
            country: actualCountry,
            color: c,
            size: s,
            stock: parseInt(inventoryForm.stock, 10),
          });
        }
      }

      await fetch("/api/admin/products/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.length === 1 ? payload[0] : payload),
      });

      // Delay slightly before re-fetching to ensure DynamoDB consistency
      await new Promise((r) => setTimeout(r, 500));
      const res = await fetch(
        `/api/admin/products/inventory?productId=${id}&t=${Date.now()}`,
      );
      if (res.ok) {
        const newData = await res.json();
        setInventoryRows(newData);
        // alert("Inventory updated successfully!");
      }
      setInventoryForm({
        country: "US",
        color: "",
        size: "7",
        stock: "",
        customCountry: "",
      });
      setIsEditingInventory(false);
    } catch (e) {
      console.error(e);
    }
    setInventorySaving(false);
  };

  const handleDeleteInventory = async (country, color, size) => {
    try {
      await fetch("/api/admin/products/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, country, color, size }),
      });
      setInventoryRows((prev) => {
        const next = prev.filter(
          (r) =>
            !(r.country === country && r.color === color && r.size === size),
        );
        const totalStock = next.reduce((acc, item) => acc + (item.stock || 0), 0);
        if (totalStock <= 0) {
          setFormData((f) => ({ ...f, status: "Out of Stock" }));
        }
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteColor = async (index) => {
    if (formData.colors.length <= 1) return;
    const colorToDelete = formData.colors[index].name;

    if (colorToDelete) {
      const confirmDelete = window.confirm(
        `WARNING: You are about to delete the color variant "${colorToDelete}".\n\nThis will also PERMANENTLY DELETE all associated inventory for this color across all regions and sizes.\n\nAre you sure you want to proceed?`
      );
      if (!confirmDelete) return;
    }

    setIsSaving(true);
    try {
      if (isEdit && colorToDelete) {
        // Trigger cross-region inventory deletion in the backend
        await fetch("/api/admin/products/inventory", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: id, color: colorToDelete }),
        });
        
        // Remove associated inventory rows from local state
        setInventoryRows((prev) => {
          const next = prev.filter((r) => r.color !== colorToDelete);
          const totalStock = next.reduce((acc, item) => acc + (item.stock || 0), 0);
          if (totalStock <= 0) {
            setFormData((f) => ({ ...f, status: "Out of Stock" }));
          }
          return next;
        });
      }

      setFormData((prev) => ({
        ...prev,
        colors: prev.colors.filter((_, i) => i !== index),
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to delete color and associated inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  // Form State

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    mrp: "",
    price: "",
    category: "Smart Rings",
    status: "Active",
    colors: [
      {
        name: "Matte Black",
        swatchImage: null,
        swatchPreview: null,
        heroAssets: [], // Array of { file, preview, type, url }
        sku: "",
        inStock: true,
      },
    ],
    sizeGuide: null,
    sizeGuidePreview: null,
    getStartedText: "Get Started",
    customSlug: false,
    techSpecs: {
      model: "Ring AIR",
      body: {
        dimensions: ["Width – 8.1 mm", "Thickness – 2.45 – 2.8 mm"],
        weight: "2.4 – 3.6 g",
        material: [
          "The outer shell is made from fighter jet grade Titanium...",
          "The inners of the ring is coated with medical-grade hypoallergenic...",
        ],
      },
      connectivity: [
        "Bluetooth Low Energy (BLE5)",
        "Automatic firmware updates via the Ultrahuman App",
      ],
      sensors: [
        "Infrared Photoplethysmography (PPG) sensor",
        "Non-contact medical-grade skin temperature sensor",
      ],
    },
  });

  // Fetch Existing Data if Editing
  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/admin/products/${id}`);
          if (res.ok) {
            const data = await res.json();

            if (!data) {
              console.warn("Product not found or empty response");
              return;
            }

            // Deeply map fetched data to ensure 100% fidelity
            setFormData({
              title: data.title || "",
              slug: data.slug || "",
              mrp: data.mrp?.toString() || "",
              price: data.price?.toString() || "",
              category: data.category || "Smart Rings",
              status: data.status || "Active",
              getStartedText: data.getStartedText || "Get Started",
              customSlug: true,
              // Restore Technical Specifications with safety defaults
              techSpecs: {
                model: data.techSpecs?.model || "Ring AIR",
                body: {
                  dimensions: data.techSpecs?.body?.dimensions || [],
                  weight: data.techSpecs?.body?.weight || "",
                  material: data.techSpecs?.body?.material || [],
                },
                connectivity: data.techSpecs?.connectivity || [],
                sensors: data.techSpecs?.sensors || [],
              },
              // Restore Image Previews for Colors
              colors: (data.colors || []).map((c) => ({
                name: c.name || "",
                swatchImage: c.swatchImage || null,
                swatchPreview: c.swatchImage || null,
                heroAssets: (c.heroAssets || []).map(a => ({
                  url: a.url,
                  type: a.type,
                  preview: a.url
                })),
                sku: c.sku || "",
              })),
              // Restore Size Guide Preview
              sizeGuide: data.sizeGuide || null,
              sizeGuidePreview: data.sizeGuide || null,
            });
          }
        } catch (error) {
          console.error("Failed to fetch product:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [isEdit, id]);

  // Slug generation
  useEffect(() => {
    if (!isEdit && formData.title && !formData.customSlug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      if (generatedSlug !== formData.slug) {
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            slug: generatedSlug,
          }));
        }, 0);
      }
    }
  }, [formData.title, isEdit, formData.slug, formData.customSlug]);

  const handleAddSpecPoint = (category, subCategory = null) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.techSpecs };
      if (subCategory) {
        newSpecs[category][subCategory] = [
          ...newSpecs[category][subCategory],
          "",
        ];
      } else {
        newSpecs[category] = [...newSpecs[category], ""];
      }
      return { ...prev, techSpecs: newSpecs };
    });
  };

  const handleRemoveSpecPoint = (category, index, subCategory = null) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.techSpecs };
      if (subCategory) {
        newSpecs[category][subCategory] = newSpecs[category][
          subCategory
        ].filter((_, i) => i !== index);
      } else {
        newSpecs[category] = newSpecs[category].filter((_, i) => i !== index);
      }
      return { ...prev, techSpecs: newSpecs };
    });
  };

  const handleSpecChange = (category, index, value, subCategory = null) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.techSpecs };
      if (subCategory) {
        newSpecs[category][subCategory][index] = value;
      } else {
        newSpecs[category][index] = value;
      }
      return { ...prev, techSpecs: newSpecs };
    });
  };

  const handleAddColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          name: "",
          swatchImage: null,
          swatchPreview: null,
          heroAssets: [],
          sku: "",
          inStock: true,
        },
      ],
    }));
  };

  const handleHeroAssetAdd = (colorIndex, file) => {
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert("Only images and videos are allowed");
      return;
    }

    const currentAssets = formData.colors[colorIndex].heroAssets || [];
    const videoCount = currentAssets.filter((a) => a.type === "video").length;
    const imageCount = currentAssets.filter((a) => a.type === "image").length;

    if (isVideo) {
      if (videoCount >= 2) {
        alert("Maximum 2 videos allowed per variant");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert("Video size must be under 15MB");
        return;
      }
    } else {
      if (imageCount >= 4) {
        alert("Maximum 4 images allowed per variant");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be under 5MB");
        return;
      }
    }

    const newAsset = {
      file,
      preview: URL.createObjectURL(file),
      type: isVideo ? "video" : "image",
    };

    setFormData((prev) => {
      const newColors = [...prev.colors];
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        heroAssets: [
          ...(newColors[colorIndex].heroAssets || []),
          newAsset,
        ],
      };
      return { ...prev, colors: newColors };
    });
  };

  const handleHeroAssetRemove = (colorIndex, assetIndex) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        heroAssets: (newColors[colorIndex].heroAssets || []).filter(
          (_, i) => i !== assetIndex,
        ),
      };
      return { ...prev, colors: newColors };
    });
  };

  const handleColorChange = (index, field, value) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      if (field === "swatchImage") {
        newColors[index].swatchImage = value;
        newColors[index].swatchPreview = URL.createObjectURL(value);
      } else {
        newColors[index][field] = value;
      }
      return { ...prev, colors: newColors };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const uploadFile = async (file, pathPrefix) => {
        if (!file || typeof file === "string") return file;
        const body = new FormData();
        body.append("file", file);
        body.append("path", pathPrefix);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.url;
      };

      // 1. Upload Size Guide
      const sizeGuideUrl = await uploadFile(formData.sizeGuide, "docs/");

      // 3. Upload Color Assets
      const updatedColors = await Promise.all(
        formData.colors.map(async (color) => {
          const swatchUrl = await uploadFile(
            color.swatchImage,
            "colors/swatches/",
          );

          const uploadedAssets = await Promise.all(
            (color.heroAssets || []).map(async (asset) => {
              if (asset.file) {
                const url = await uploadFile(
                  asset.file,
                  asset.type === "video" ? "colors/videos/" : "colors/products/",
                );
                return { url, type: asset.type };
              }
              return { url: asset.url, type: asset.type };
            }),
          );

          return {
            name: color.name,
            swatchImage: swatchUrl || color.swatchPreview,
            heroAssets: uploadedAssets,
            sku: color.sku,
          };
        }),
      );

      const payload = {
        title: formData.title,
        slug: formData.slug,
        mrp: Number(formData.mrp),
        price: Number(formData.price),
        getStartedText: formData.getStartedText,
        category: formData.category,
        status: formData.status,
        techSpecs: formData.techSpecs,
        sizeGuide: sizeGuideUrl || formData.sizeGuidePreview,
        colors: updatedColors,
      };

      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `/api/admin/products/${id}` : "/api/admin/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/genai-admin/products");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save product. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0027ED] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-[#0f172a]">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/genai-admin/products"
            className="p-2.5 bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl text-[#64748b] transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light text-[#0f172a]">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-[#64748b] font-medium">
              {isEdit
                ? "Update product details and specifications"
                : "Create a new product listing"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-white hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] rounded-xl text-sm font-light transition-all cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-xl text-sm font-light transition-all shadow-lg shadow-[#0027ED]/20 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? "Update Product" : "Save Product"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] space-y-8 shadow-sm">
          <h3 className="text-xl font-light flex items-center gap-3 text-[#0f172a]">
            <div className="p-2 bg-[#0027ED]/10 rounded-lg">
              <Info className="w-5 h-5 text-[#0027ED]" />
            </div>
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                Product Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all placeholder:text-[#64748b]/40"
                placeholder="e.g. Ring AIR"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest flex justify-between">
                Product Slug{" "}
                <span className="text-[9px] text-[#0027ED] italic">
                  Auto-link
                </span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value,
                    customSlug: true,
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#064e3b] font-mono focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                Product Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all cursor-pointer"
              >
                <option value="Smart Rings">Smart Rings</option>
                <option value="Accessories">Accessories</option>
                <option value="Exclusive">Exclusive</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                Listing Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#064e3b] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                Button Call-to-Action
              </label>
              <input
                type="text"
                required
                value={formData.getStartedText}
                onChange={(e) =>
                  setFormData({ ...formData, getStartedText: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
              />
            </div>
          </div>
        </section>

        {/* Colors & Variants */}
        <section className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] space-y-8 shadow-sm">
          <h3 className="text-xl font-light flex items-center gap-3 text-[#0f172a]">
            <div className="p-2 bg-[#0027ED]/10 rounded-lg">
              <ImageIcon className="w-5 h-5 text-[#0027ED]" />
            </div>
            Color Variants
          </h3>

          <div className="space-y-6">
            {formData.colors.map((color, index) => (
              <div
                key={index}
                className="p-8 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0] relative group space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                        Color Name
                      </label>
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[index].name = e.target.value;
                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                        placeholder="Matte Black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={color.sku}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[index].sku = e.target.value;
                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                        placeholder="NR-BLK-01"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                      Selection Swatch
                    </label>
                    <div className="flex items-center gap-6">
                      <div
                        className="h-20 w-20 rounded-[20px] border-2 border-dashed border-[#cbd5e1] bg-white flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0027ED] hover:bg-[#f1f5f9] transition-all shadow-xs"
                        onClick={() =>
                          document.getElementById(`swatch-img-${index}`).click()
                        }
                      >
                        {color.swatchPreview ? (
                          <Image
                            src={color.swatchPreview}
                            alt="Swatch"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Plus className="w-5 h-5 text-[#64748b]" />
                        )}
                        <input
                          id={`swatch-img-${index}`}
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleColorChange(
                              index,
                              "swatchImage",
                              e.target.files[0],
                            )
                          }
                        />
                      </div>
                      <p className="text-[11px] text-[#64748b] max-w-[140px] leading-relaxed font-medium">
                        Used for color circles in selection UI
                      </p>
                    </div>
                                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest flex justify-between items-center">
                      <span>Product Hero Assets (Max 4 Images, 2 Videos)</span>
                      <span className="text-[9px] font-medium text-[#0027ED]">
                        {(color.heroAssets || []).length} / 6 Total
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {/* Asset Slots */}
                      {(color.heroAssets || []).map((asset, assetIdx) => (
                        <div
                          key={assetIdx}
                          className="relative aspect-square rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden group/asset"
                        >
                          {asset.type === "video" ? (
                            <video
                              src={asset.preview}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseOver={(e) => e.target.play()}
                              onMouseOut={(e) => e.target.pause()}
                            />
                          ) : (
                            <Image
                              src={asset.preview}
                              alt="Asset"
                              fill
                              className="object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleHeroAssetRemove(index, assetIdx)
                            }
                            className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover/asset:opacity-100 transition-opacity shadow-sm cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-[8px] text-white uppercase font-bold tracking-tighter">
                            {asset.type}
                          </div>
                        </div>
                      ))}

                      {/* Add Button */}
                      {(color.heroAssets || []).length < 6 && (
                        <div
                          className="aspect-square rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#0027ED] hover:bg-[#f1f5f9] transition-all group/add"
                          onClick={() =>
                            document
                              .getElementById(`hero-upload-${index}`)
                              .click()
                          }
                        >
                          <Plus className="w-5 h-5 text-[#64748b] group-hover/add:text-[#0027ED] group-hover/add:scale-110 transition-all" />
                          <span className="text-[9px] font-medium text-[#64748b] mt-1 group-hover/add:text-[#0027ED]">
                            Add Asset
                          </span>
                          <input
                            id={`hero-upload-${index}`}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleHeroAssetAdd(index, e.target.files[0]);
                                e.target.value = "";
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
    </div>
                </div>

                {formData.colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteColor(index)}
                    className="absolute top-4 right-4 p-2.5 bg-white text-[#64748b] hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-[#e2e8f0] transition-all shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddColor}
              className="w-full py-5 border-2 border-dashed border-[#e2e8f0] bg-white rounded-[32px] text-[#64748b] hover:text-[#0027ED] hover:border-[#0027ED]/30 hover:bg-[#f1f5f9] transition-all flex items-center justify-center gap-3 cursor-pointer font-light text-xs uppercase tracking-widest shadow-xs"
            >
              <Plus className="w-5 h-5" /> Add New Color Variant
            </button>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] space-y-10 shadow-sm">
          <h3 className="text-xl font-light flex items-center gap-3 text-[#0f172a]">
            <div className="p-2 bg-[#0027ED]/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-[#0027ED]" />
            </div>
            Technical Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                Model Hardware ID
              </label>
              <input
                type="text"
                value={formData.techSpecs.model}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    techSpecs: { ...formData.techSpecs, model: e.target.value },
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest">
                Device Weight
              </label>
              <input
                type="text"
                value={formData.techSpecs.body.weight}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    techSpecs: {
                      ...formData.techSpecs,
                      body: {
                        ...formData.techSpecs.body,
                        weight: e.target.value,
                      },
                    },
                  })
                }
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-3 px-4 text-[#0f172a] font-light focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                placeholder="2.4 – 3.6 g"
              />
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest flex justify-between items-center">
              Physical Dimensions
              <button
                type="button"
                onClick={() => handleAddSpecPoint("body", "dimensions")}
                className="text-[#0027ED] text-[10px] font-light uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Dim
              </button>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.techSpecs.body.dimensions.map((dim, i) => (
                <div key={i} className="flex gap-2.5 group">
                  <input
                    value={dim}
                    onChange={(e) =>
                      handleSpecChange("body", i, e.target.value, "dimensions")
                    }
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm text-[#0f172a] font-medium focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSpecPoint("body", i, "dimensions")
                    }
                    className="p-3 text-[#64748b] hover:text-rose-600 bg-white border border-[#e2e8f0] rounded-xl hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest flex justify-between items-center">
              Material & Crafting
              <button
                type="button"
                onClick={() => handleAddSpecPoint("body", "material")}
                className="text-[#0027ED] text-[10px] font-light uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Point
              </button>
            </label>
            <div className="space-y-4">
              {formData.techSpecs.body.material.map((point, i) => (
                <div key={i} className="flex gap-4 group">
                  <textarea
                    value={point}
                    onChange={(e) =>
                      handleSpecChange("body", i, e.target.value, "material")
                    }
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-3.5 px-4 text-sm text-[#0f172a] font-medium focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all min-h-[60px] resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecPoint("body", i, "material")}
                    className="p-4 text-[#64748b] hover:text-rose-600 bg-white border border-[#e2e8f0] rounded-2xl hover:bg-rose-50 transition-all h-fit cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#e2e8f0]">
            <div className="space-y-6">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest flex justify-between items-center">
                Connectivity Protocols
                <button
                  type="button"
                  onClick={() => handleAddSpecPoint("connectivity")}
                  className="text-[#0027ED] text-[10px] font-light uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Point
                </button>
              </label>
              <div className="space-y-3">
                {formData.techSpecs.connectivity.map((point, i) => (
                  <div key={i} className="flex gap-2.5">
                    <input
                      value={point}
                      onChange={(e) =>
                        handleSpecChange("connectivity", i, e.target.value)
                      }
                      className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm text-[#0f172a] font-medium focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecPoint("connectivity", i)}
                      className="p-3 text-[#64748b] hover:text-rose-600 bg-white border border-[#e2e8f0] rounded-xl hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest flex justify-between items-center">
                Onboard Sensors
                <button
                  type="button"
                  onClick={() => handleAddSpecPoint("sensors")}
                  className="text-[#0027ED] text-[10px] font-light uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Point
                </button>
              </label>
              <div className="space-y-3">
                {formData.techSpecs.sensors.map((point, i) => (
                  <div key={i} className="flex gap-2.5">
                    <input
                      value={point}
                      onChange={(e) =>
                        handleSpecChange("sensors", i, e.target.value)
                      }
                      className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm text-[#0f172a] font-medium focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecPoint("sensors", i)}
                      className="p-3 text-[#64748b] hover:text-rose-600 bg-white border border-[#e2e8f0] rounded-xl hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-[#e2e8f0]">
            <label className="text-[11px] font-light text-[#64748b] uppercase tracking-widest block mb-6">
              Sizing Documentation
            </label>
            <div className="flex items-center gap-10">
              <div
                className="h-32 w-32 rounded-[32px] border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0027ED] hover:bg-white transition-all group shadow-xs"
                onClick={() =>
                  document.getElementById("size-guide-input").click()
                }
              >
                {formData.sizeGuidePreview ? (
                  <Image
                    src={formData.sizeGuidePreview}
                    className="w-full h-full object-cover"
                    alt="Size"
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-7 h-7 text-[#64748b] mx-auto mb-2 group-hover:text-[#0027ED] group-hover:scale-110 transition-transform" />
                  </div>
                )}
                <input
                  id="size-guide-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({
                        ...formData,
                        sizeGuide: file,
                        sizeGuidePreview: URL.createObjectURL(file),
                      });
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-light text-[#0f172a]">
                  Size Guide Asset
                </p>
                <p className="text-xs text-[#64748b] max-w-[280px] leading-relaxed font-medium">
                  Upload PDF or Image. This will be shown to customers in the
                  &quot;What&apos;s my size?&quot; popup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing by Country — only when editing */}
        {isEdit && (
          <section className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] space-y-8 shadow-sm">
            <h3 className="text-xl font-light flex items-center gap-3 text-[#0f172a]">
              <div className="p-2 bg-[#0027ED]/10 rounded-lg">
                <Globe className="w-5 h-5 text-[#0027ED]" />
              </div>
              Pricing by Country
            </h3>

            {/* Pricing Table */}
            {pricingRows.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#64748b] text-[10px] uppercase tracking-widest">
                      <th className="py-3 px-4 text-left font-light">
                        Country
                      </th>
                      <th className="py-3 px-4 text-left font-light">
                        Currency
                      </th>
                      <th className="py-3 px-4 text-left font-light">Price</th>
                      <th className="py-3 px-4 text-left font-light">MRP</th>
                      <th className="py-3 px-4 text-left font-light">Tax %</th>
                      <th className="py-3 px-4 text-left font-light">Ship</th>
                      <th className="py-3 px-4 text-left font-light">Memb.</th>
                      <th className="py-3 px-4 text-left font-light">Coupons</th>
                      <th className="py-3 px-4 text-left font-light">Disc %</th>
                      <th className="py-3 px-4 text-left font-light">Validity</th>
                      <th className="py-3 px-4 text-right font-light">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRows.map((row) => (
                      <tr
                        key={row.country}
                        className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[#0f172a]">
                          {COUNTRY_OPTIONS.find((c) => c.code === row.country)
                            ?.label || row.country}
                        </td>
                        <td className="py-3 px-4 text-[#64748b]">
                          {row.currency}
                        </td>
                        <td className="py-3 px-4 text-[#0f172a] font-medium">
                          {getCurrencySymbol(row.currency || "USD")}{row.price}
                        </td>
                        <td className="py-3 px-4 text-[#64748b]">
                          {getCurrencySymbol(row.currency || "USD")}{row.mrp}
                        </td>
                        <td className="py-3 px-4 text-[#64748b]">{row.taxRate || 12}%</td>
                        <td className="py-3 px-4 text-[#64748b]">{row.shippingFee || 15}</td>
                        <td className="py-3 px-4 text-[#64748b]">{row.membershipPrice || "-"}</td>
                        <td className="py-3 px-4 text-[#64748b] font-mono text-[9px]">
                          {row.coupons?.length > 0 ? row.coupons.join(", ") : "All"}
                        </td>
                        <td className="py-3 px-4 text-[#0f172a] font-medium">
                          {row.discountPercent ? `${row.discountPercent}%` : "-"}
                        </td>
                        <td className="py-3 px-4 text-[#64748b] text-[9px]">
                          {row.startDate ? (
                            <div className="flex flex-col">
                              <span>S: {row.startDate}</span>
                              {row.endDate && <span>E: {row.endDate}</span>}
                            </div>
                          ) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const isCustom = !COUNTRY_OPTIONS.find(
                                  (c) =>
                                    c.code === row.country &&
                                    c.code !== "OTHER",
                                );
                                setPricingForm({
                                  country: isCustom ? "OTHER" : row.country,
                                  customCountry: isCustom ? row.country : "",
                                  currency: row.currency,
                                  price: row.price.toString(),
                                  mrp: row.mrp ? row.mrp.toString() : "",
                                  taxRate: (row.taxRate || 12).toString(),
                                  shippingFee: (row.shippingFee || 15).toString(),
                                  membershipPrice: row.membershipPrice ? row.membershipPrice.toString() : "",
                                  coupons: row.coupons ? row.coupons.join(", ") : "",
                                  discountPercent: row.discountPercent ? row.discountPercent.toString() : "",
                                  startDate: row.startDate || new Date().toISOString().split("T")[0],
                                  endDate: row.endDate || "",
                                });
                                setIsEditingPricing(true);
                                // scroll down to form
                                window.scrollTo({
                                  top: document.body.scrollHeight / 2, // Approximate middle for pricing form
                                  behavior: "smooth",
                                });
                              }}
                              className="p-1.5 text-[#64748b] hover:text-[#0027ED] hover:bg-[#0027ED]/10 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePricing(row.country)}
                              className="p-1.5 text-[#64748b] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add/Edit Pricing Form */}
            <div
              className={`p-6 bg-[#f8fafc] rounded-2xl border ${isEditingPricing ? "border-[#0027ED]/30 bg-[#0027ED]/5" : "border-[#e2e8f0]"} space-y-4 transition-all`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-[#0027ED] uppercase tracking-widest">
                  {isEditingPricing ? "Editing Regional Pricing" : "Add Country Pricing"}
                </p>
                {isEditingPricing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPricing(false);
                      setPricingForm({
                        country: "US",
                        currency: "USD",
                        price: "",
                        mrp: "",
                        taxRate: "12",
                        shippingFee: "15",
                        membershipPrice: "",
                        coupons: "",
                        discountPercent: "",
                        startDate: new Date().toISOString().split("T")[0],
                        endDate: "",
                        customCountry: "",
                      });
                    }}
                    className="text-[10px] font-medium text-rose-500 uppercase tracking-widest hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <div
                className={`grid grid-cols-2 gap-4 ${pricingForm.country === "OTHER" ? "md:grid-cols-5" : "md:grid-cols-4"}`}
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Country
                  </label>
                  <select
                    disabled={isEditingPricing}
                    value={pricingForm.country}
                    onChange={(e) => {
                      const match = COUNTRY_OPTIONS.find(
                        (c) => c.code === e.target.value,
                      );
                      setPricingForm({
                        ...pricingForm,
                        country: e.target.value,
                        currency: match?.currency || pricingForm.currency,
                        customCountry: "",
                      });
                    }}
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                {pricingForm.country === "OTHER" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                      ISO Country Code
                    </label>
                    <input
                      type="text"
                      disabled={isEditingPricing}
                      maxLength={2}
                      value={pricingForm.customCountry}
                      onChange={(e) =>
                        setPricingForm({
                          ...pricingForm,
                          customCountry: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-mono font-medium focus:outline-none focus:border-[#0027ED] uppercase disabled:opacity-50"
                      placeholder="e.g. NG"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={pricingForm.currency}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        currency: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Price ({getCurrencySymbol(pricingForm.currency)})
                  </label>
                  <input
                    type="number"
                    value={pricingForm.price}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, price: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="199"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    MRP ({getCurrencySymbol(pricingForm.currency)})
                  </label>
                  <input
                    type="number"
                    value={pricingForm.mrp}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, mrp: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="349"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Tax %
                  </label>
                  <input
                    type="number"
                    value={pricingForm.taxRate}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, taxRate: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Ship Fee
                  </label>
                  <input
                    type="number"
                    value={pricingForm.shippingFee}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, shippingFee: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Memb. Price ({getCurrencySymbol(pricingForm.currency)})
                  </label>
                  <input
                    type="number"
                    value={pricingForm.membershipPrice}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, membershipPrice: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="999"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Valid Coupons (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={pricingForm.coupons}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, coupons: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED] placeholder:text-[10px]"
                    placeholder="WINTER20, NEXRING10 (Leave blank for all)"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={pricingForm.discountPercent}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, discountPercent: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                    placeholder="20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={pricingForm.startDate}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, startDate: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={pricingForm.endDate}
                    min={pricingForm.startDate}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, endDate: e.target.value })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddPricing}
                disabled={pricingSaving || !pricingForm.price}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-xl text-xs font-light transition-all disabled:opacity-50 cursor-pointer"
              >
                {pricingSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isEditingPricing ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {isEditingPricing ? "Update Pricing" : "Add Country Pricing"}
              </button>
            </div>
          </section>
        )}

        {/* Inventory — only when editing */}
        {isEdit && (
          <section className="bg-white border border-[#e2e8f0] p-8 rounded-[32px] space-y-8 shadow-sm">
            <h3 className="text-xl font-light flex items-center gap-3 text-[#0f172a]">
              <div className="p-2 bg-[#0027ED]/10 rounded-lg">
                <Package className="w-5 h-5 text-[#0027ED]" />
              </div>
              Inventory Management
            </h3>

            {/* Inventory Table */}
            {inventoryRows.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#64748b] text-[10px] uppercase tracking-widest">
                      <th className="py-3 px-4 text-left font-light">
                        Country
                      </th>
                      <th className="py-3 px-4 text-left font-light">Color</th>
                      <th className="py-3 px-4 text-left font-light">Size</th>
                      <th className="py-3 px-4 text-left font-light">Stock</th>
                      <th className="py-3 px-4 text-right font-light">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInventory.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[#0f172a]">
                          {COUNTRY_OPTIONS.find((c) => c.code === row.country)
                            ?.label || row.country}
                        </td>
                        <td className="py-3 px-4 text-[#0f172a]">
                          {row.color}
                        </td>
                        <td className="py-3 px-4 text-[#64748b]">{row.size}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${row.stock > 10 ? "bg-green-50 text-green-600" : row.stock > 0 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}
                          >
                            {row.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const isCustom = !COUNTRY_OPTIONS.find(
                                  (c) =>
                                    c.code === row.country &&
                                    c.code !== "OTHER",
                                );
                                // Match color case with metadata to ensure dropdown populates correctly
                                const matchingColor = formData.colors.find(
                                  (c) =>
                                    c.name.toUpperCase() ===
                                    row.color.toUpperCase(),
                                );
                                setInventoryForm({
                                  country: isCustom ? "OTHER" : row.country,
                                  customCountry: isCustom ? row.country : "",
                                  color: matchingColor
                                    ? matchingColor.name
                                    : row.color,
                                  size: row.size,
                                  stock: row.stock.toString(),
                                });
                                setIsEditingInventory(true);
                                // scroll down to form
                                window.scrollTo({
                                  top: document.body.scrollHeight,
                                  behavior: "smooth",
                                });
                              }}
                              className="p-1.5 text-[#64748b] hover:text-[#0027ED] hover:bg-[#0027ED]/10 rounded-lg transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteInventory(
                                  row.country,
                                  row.color,
                                  row.size,
                                )
                              }
                              className="p-1.5 text-[#64748b] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalInventoryPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2">
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-light">
                  Page {currentInventoryPage} of {totalInventoryPages} (
                  {inventoryRows.length} items)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentInventoryPage === 1}
                    onClick={() =>
                      setCurrentInventoryPage((prev) => Math.max(1, prev - 1))
                    }
                    className="p-2 border border-[#e2e8f0] rounded-lg text-[#64748b] disabled:opacity-30 hover:bg-[#0027ED]/5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentInventoryPage === totalInventoryPages}
                    onClick={() =>
                      setCurrentInventoryPage((prev) =>
                        Math.min(totalInventoryPages, prev + 1),
                      )
                    }
                    className="p-2 border border-[#e2e8f0] rounded-lg text-[#64748b] disabled:opacity-30 hover:bg-[#0027ED]/5 transition-colors cursor-pointer rotate-180"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Add/Edit Inventory Form */}
            <div
              className={`p-6 bg-[#f8fafc] rounded-2xl border ${isEditingInventory ? "border-[#0027ED]/30 bg-[#0027ED]/5" : "border-[#e2e8f0]"} space-y-4 transition-all`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-[#0027ED] uppercase tracking-widest">
                  {isEditingInventory
                    ? "Editing Stock Quantity"
                    : "Add Inventory"}
                </p>
                {isEditingInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInventory(false);
                      setInventoryForm({
                        country: "US",
                        color: "",
                        size: "7",
                        stock: "",
                        customCountry: "",
                      });
                    }}
                    className="text-[10px] text-[#64748b] hover:text-rose-600 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Cancel Edit
                  </button>
                )}
              </div>

              <div
                className={`grid grid-cols-2 gap-4 ${inventoryForm.country === "OTHER" ? "md:grid-cols-5" : "md:grid-cols-4"}`}
              >
                <div
                  className={`space-y-1.5 ${isEditingInventory ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Country
                  </label>
                  <select
                    value={inventoryForm.country}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        country: e.target.value,
                        customCountry: "",
                      })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED] cursor-pointer"
                    disabled={isEditingInventory}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                {inventoryForm.country === "OTHER" && (
                  <div
                    className={`space-y-1.5 ${isEditingInventory ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                      ISO Country Code
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={inventoryForm.customCountry}
                      onChange={(e) =>
                        setInventoryForm({
                          ...inventoryForm,
                          customCountry: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-mono font-medium focus:outline-none focus:border-[#0027ED] uppercase"
                      placeholder="e.g. NG"
                      disabled={isEditingInventory}
                    />
                  </div>
                )}
                <div
                  className={`space-y-1.5 ${isEditingInventory ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Color
                  </label>
                  <select
                    value={inventoryForm.color}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        color: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED] cursor-pointer"
                    disabled={isEditingInventory}
                  >
                    <option value="">Select Color</option>
                    <option
                      value="ALL"
                      className="font-semibold text-[#0027ED]"
                    >
                      All Colors
                    </option>
                    {(formData.colors || []).map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className={`space-y-1.5 ${isEditingInventory ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <label className="text-[10px] uppercase font-light text-[#64748b] tracking-wider">
                    Size
                  </label>
                  <select
                    value={inventoryForm.size}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        size: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-light focus:outline-none focus:border-[#0027ED] cursor-pointer"
                    disabled={isEditingInventory}
                  >
                    <option
                      value="ALL"
                      className="font-semibold text-[#0027ED]"
                    >
                      All Sizes (7-12)
                    </option>
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-[#0027ED] font-medium tracking-wider">
                    New Stock Qty
                  </label>
                  <input
                    type="number"
                    value={inventoryForm.stock}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        stock: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#0027ED]/30 rounded-xl py-2.5 px-4 text-sm font-medium focus:outline-none focus:border-[#0027ED]"
                    placeholder="25"
                    autoFocus={isEditingInventory}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddInventory}
                disabled={
                  inventorySaving ||
                  !inventoryForm.color ||
                  !inventoryForm.stock
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-xl text-xs font-light transition-all disabled:opacity-50 cursor-pointer"
              >
                {inventorySaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isEditingInventory ? "Update Stock Balance" : "Add Inventory"}
              </button>
            </div>
          </section>
        )}
      </form>

      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-white/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-[#0027ED]/10 rounded-full mx-auto" />
                <div className="absolute inset-0 w-24 h-24 border-4 border-[#0027ED] border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_40px_rgba(0,39,237,0.15)]" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-light tracking-tight text-[#0f172a] italic">
                  NexRing Sync
                </h2>
                <p className="text-[#64748b] max-w-sm font-light leading-relaxed">
                  We&apos;re uploading your high-fidelity assets and committing
                  specifications to the DynamoDB core.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
