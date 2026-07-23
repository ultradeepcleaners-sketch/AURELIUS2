import React, { useState, useEffect } from "react";
import { 
  Lock, Unlock, LayoutDashboard, ShoppingBag, FolderHeart, ListOrdered, 
  Users, Settings, Sun, Moon, Plus, Edit, Trash2, Upload, CheckCircle, 
  AlertCircle, ArrowRight, Search, Eye, Truck, TrendingUp, Coins, LogOut, Play,
  Briefcase, Check, Mail, Phone, MapPin, DollarSign, RefreshCw, X, ShieldAlert,
  EyeOff, CheckSquare, Square, Sparkles, Zap, Tag, Star, Layers, Filter, Bookmark, Download
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell, CartesianGrid, PieChart, Pie, Legend 
} from "recharts";
import { Product, CurrencyCode, formatPrice } from "../types";
import { db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { generatePDFReceipt } from "../utils/pdfGenerator";

// Quick-Create Featured Collection Templates
const FEATURED_COLLECTION_TEMPLATES = [
  {
    id: "summer-travel-essentials",
    name: "Summer Travel Essentials",
    description: "High-velocity full-grain leather luggage, passport folios, and weekender duffels designed for jetset travel and overhead cabin ease.",
    badge: "Summer Capsule",
    isFeatured: true,
    isPublished: true,
    categoryFilter: "bags",
    keywords: ["duffel", "bag", "travel", "luggage", "passport", "weekend"]
  },
  {
    id: "heritage-leather-classics",
    name: "Heritage Leather Classics",
    description: "Timeless vegetable-tanned briefcases and structured messenger bags crafted with solid brass hardware and hand-burnished edges.",
    badge: "Heritage Edition",
    isFeatured: true,
    isPublished: true,
    categoryFilter: "bags",
    keywords: ["briefcase", "messenger", "classic", "heritage", "attache", "satchel"]
  },
  {
    id: "artisanal-footwear-vault",
    name: "Artisanal Footwear Vault",
    description: "Hand-burnished Goodyear-welted oxfords, Chelsea boots, and velvet slippers handcrafted in Santa Croce sull'Arno, Italy.",
    badge: "Craftsmanship Vault",
    isFeatured: true,
    isPublished: true,
    categoryFilter: "shoes",
    keywords: ["boot", "shoe", "oxford", "loafer", "slipper", "footwear"]
  },
  {
    id: "executive-desk-workspace",
    name: "Executive Workspace Suite",
    description: "Architectural leather desk pads, tablet sleeves, travel organizers, and brass key loops engineered for high-stakes focus.",
    badge: "Atelier Executive",
    isFeatured: true,
    isPublished: true,
    categoryFilter: "accessories",
    keywords: ["wallet", "belt", "case", "organizer", "strap", "folio", "desk"]
  },
  {
    id: "bespoke-gifting-suite",
    name: "Bespoke Monogram Gifting Suite",
    description: "Curated luxury leather gift sets, monogrammed cardholders, and watch rolls presented in gold-embossed Aurelius gift boxes.",
    badge: "Bespoke Suite",
    isFeatured: true,
    isPublished: true,
    categoryFilter: "accessories",
    keywords: ["wallet", "key", "cardholder", "gift", "watch", "roll", "accessory"]
  },
  {
    id: "midnight-velvet-series",
    name: "Midnight Series & Evening",
    description: "Opulent deep obsidian accessories, velvet loafers, and evening clutches for black-tie galas and late-night lounge soirees.",
    badge: "Limited Midnight",
    isFeatured: true,
    isPublished: true,
    categoryFilter: "shoes",
    keywords: ["velvet", "evening", "clutch", "black", "loafer", "midnight"]
  }
];

// High-fidelity clients list fallback
const DEFAULT_CUSTOMERS = [
  { id: "CST-01", name: "Marcus Sterling", email: "marcus.sterling@sterlingholdings.co", phone: "+1 (212) 555-8822", address: "740 Park Ave, New York, NY 10021", totalOrders: 4, totalSpending: 1840, accountStatus: "VIP", createdAt: "2026-03-12T08:30:00Z" },
  { id: "CST-02", name: "Alessia Moretti", email: "alessia.moretti@milano-design.it", phone: "+39 02 8844 2211", address: "Via della Spiga 12, Milan 20121", totalOrders: 2, totalSpending: 840, accountStatus: "Active", createdAt: "2026-04-18T14:20:00Z" },
  { id: "CST-03", name: "Siddharth Mehta", email: "sid.mehta@mumbaidiamonds.in", phone: "+91 22 5550 1199", address: "Altamount Road, Mumbai 400026", totalOrders: 1, totalSpending: 420, accountStatus: "Active", createdAt: "2026-05-02T11:15:00Z" },
  { id: "CST-04", name: "Lord Julian Hetherington", email: "j.hetherington@parliament.uk", phone: "+44 20 7946 0912", address: "Belgravia Square, London SW1X 8PH", totalOrders: 3, totalSpending: 1260, accountStatus: "VIP", createdAt: "2026-05-20T09:45:00Z" }
];

// Helper: Compress images in client-side using Canvas to ensure fit under limits
function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface AdminPanelProps {
  products: Product[];
  onProductAdded: (newProduct: Product) => void;
  onProductDeleted: (id: string) => void;
  onProductUpdated: (updatedProduct: Product) => void;
}

export default function AdminPanel({
  products,
  onProductAdded,
  onProductDeleted,
  onProductUpdated
}: AdminPanelProps) {
  // Theme & Section States
  const [isAdminDark, setIsAdminDark] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "products" | "collections" | "orders" | "customers" | "settings">("dashboard");

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("aurelius_admin_logged_in") === "true";
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  // Store Config & Settings State (Committed to settings/store_config)
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Aurelius Leather",
    logoUrl: "",
    contactEmail: "concierge@aurelius.it",
    contactPhone: "+39 055 234 5678",
    socialFacebook: "https://facebook.com/aureliusleather",
    socialInstagram: "https://instagram.com/aureliusleather",
    socialTwitter: "https://twitter.com/aureliusleather",
    baseCurrency: "USD" as CurrencyCode,
    defaultShippingCost: 25,
    adminPassword: "aurelius2026"
  });

  // Dynamic Lists states
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
  const [productStockFilter, setProductStockFilter] = useState<string>("all");

  // Form State for Products
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
  const [productUnderEdit, setProductUnderEdit] = useState<Product | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDiscountPrice, setFormDiscountPrice] = useState("");
  const [formCategory, setFormCategory] = useState<"bags" | "shoes" | "accessories">("bags");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStock, setFormStock] = useState("10");
  const [formSku, setFormSku] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formDimensions, setFormDimensions] = useState("50cm L x 24cm W x 26cm H");
  const [formWeight, setFormWeight] = useState("1.5 kg");
  const [formCare, setFormCare] = useState("Apply beeswax leather conditioner annually.");
  const [formFeatures, setFormFeatures] = useState("Handcrafted, Full-grain Leather, Brass Zippers");
  const [formColors, setFormColors] = useState("Vintage Brown, Saddle Tan");
  const [formColorsHex, setFormColorsHex] = useState("#8B5A2B, #C5A05A");

  // Image Upload Handling
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [fallbackImageUrl, setFallbackImageUrl] = useState("");
  const [existingImagesList, setExistingImagesList] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [productFormSuccess, setProductFormSuccess] = useState("");

  // Collections state
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionBadge, setNewCollectionBadge] = useState("");
  const [isFeaturedCollection, setIsFeaturedCollection] = useState(false);
  const [newCollectionPublished, setNewCollectionPublished] = useState(true);
  const [newCollectionProductIds, setNewCollectionProductIds] = useState<string[]>([]);

  // Bulk & Filter Collections states
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");
  const [collectionActionNotice, setCollectionActionNotice] = useState("");

  // Active Order detailed modal
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);

  // Simulation Hub states
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationProduct, setSimulationProduct] = useState<any | null>(null);

  // Feedbacks
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Load all lists from backend/Firestore
  const fetchAllData = async () => {
    try {
      // 1. Fetch settings
      setLoadingSettings(true);
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsPayload = await settingsRes.json();
        if (settingsPayload.success && settingsPayload.data) {
          setStoreSettings(settingsPayload.data);
        }
      }
      setLoadingSettings(false);

      // 2. Fetch orders
      setLoadingOrders(true);
      const ordersRes = await fetch("/api/orders");
      if (ordersRes.ok) {
        const ordersPayload = await ordersRes.json();
        if (ordersPayload.success && ordersPayload.data) {
          setOrders(ordersPayload.data);
        }
      }
      setLoadingOrders(false);

      // 3. Fetch customers
      setLoadingCustomers(true);
      const customersRes = await fetch("/api/customers");
      if (customersRes.ok) {
        const customersPayload = await customersRes.json();
        if (customersPayload.success && customersPayload.data && customersPayload.data.length > 0) {
          setCustomers(customersPayload.data);
        } else {
          setCustomers(DEFAULT_CUSTOMERS);
        }
      } else {
        setCustomers(DEFAULT_CUSTOMERS);
      }
      setLoadingCustomers(false);

      // 4. Fetch collections
      setLoadingCollections(true);
      const collectionsRes = await fetch("/api/collections");
      if (collectionsRes.ok) {
        const collectionsPayload = await collectionsRes.json();
        if (collectionsPayload.success && collectionsPayload.data) {
          setCollections(collectionsPayload.data);
        }
      }
      setLoadingCollections(false);
    } catch (e) {
      console.error("[Admin Dashboard Startup Fetch Error]:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Login Handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (adminPasswordInput === storeSettings.adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem("aurelius_admin_logged_in", "true");
    } else {
      setAuthError("Incorrect corporate passcode. Authentication rejected.");
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("aurelius_admin_logged_in");
  };

  // Image Upload file picker
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files) as File[];
      const valid = selected.filter(file => file.type.startsWith("image/"));
      if (valid.length !== selected.length) {
        setProductFormError("Only image file formats (PNG, JPG, WEBP) are authorized.");
        return;
      }
      
      const nextFiles = [...imageFiles, ...valid].slice(0, 10);
      setImageFiles(nextFiles);
      
      const nextPreviews = valid.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...nextPreviews].slice(0, 10));
    }
  };

  const removeSelectedImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingProductImage = (index: number) => {
    setExistingImagesList(prev => prev.filter((_, i) => i !== index));
  };

  // Create or Update Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError("");
    setProductFormSuccess("");

    if (!formName || !formPrice || !formDescription || !formCategory) {
      setProductFormError("Masterpiece catalog entry requires Name, Price, Description, and Category.");
      return;
    }

    setIsUploadingFiles(true);

    try {
      // 1. Client-Side Compression & Base64 extraction for newly chosen files
      const base64Images = await Promise.all(
        imageFiles.map(file => compressImage(file, 800, 800, 0.75))
      );

      // Compute images list
      let finalImages: string[] = [...existingImagesList];

      // If we have base64 files, they will be uploaded to storage server-side
      // Fallback Image handling (if upload fails or we just want to paste a URL)
      if (fallbackImageUrl.trim() && !fallbackImageUrl.startsWith("data:")) {
        finalImages.push(fallbackImageUrl.trim());
      }

      const generatedSku = formSku || `AUR-${formCategory.toUpperCase().substring(0, 3)}-${formName.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;

      const featuresArray = formFeatures.split(",").map(f => f.trim()).filter(Boolean);
      const variantColorsArray = formColors.split(",").map(c => c.trim()).filter(Boolean);
      const variantColorsHexArray = formColorsHex.split(",").map(h => h.trim()).filter(Boolean);

      // Build product payload matching the backend expectations
      const payload: Record<string, any> = {
        name: formName,
        price: parseFloat(formPrice),
        category: formCategory,
        subcategory: formSubcategory || "Heritage Craft",
        description: formDescription,
        inStock: parseInt(formStock) || 10,
        dimensions: formDimensions,
        weight: formWeight,
        careInstructions: formCare,
        features: featuresArray,
        variantColors: variantColorsArray,
        variantColorsHex: variantColorsHexArray,
        base64Images,
        existingImages: existingImagesList,
        skus: [{ sku: generatedSku, color: variantColorsArray[0] || "Classic Amber", inStock: parseInt(formStock) || 10 }]
      };

      if (formDiscountPrice) {
        payload.originalPrice = parseFloat(formDiscountPrice);
      }

      let method = "POST";
      let url = "/api/products";

      if (productUnderEdit) {
        method = "PUT";
        url = `/api/products/${productUnderEdit.id}`;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProductFormSuccess(productUnderEdit ? "Masterpiece updated successfully." : "New masterpiece published to collection.");
        
        // Sync parent App.tsx state via callbacks
        if (productUnderEdit) {
          onProductUpdated(data.product);
        } else {
          onProductAdded(data.product);
        }

        // Add product to selected collections
        if (selectedCollections.length > 0) {
          for (const colId of selectedCollections) {
            const col = collections.find(c => c.id === colId);
            if (col) {
              const updatedProductIds = Array.from(new Set([...(col.productIds || []), data.product.id]));
              await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...col, productIds: updatedProductIds })
              });
            }
          }
        }

        // Reset form
        resetProductForm();
        fetchAllData();
      } else {
        setProductFormError(data.error || "The cloud server rejected the masterpiece submission.");
      }
    } catch (err: any) {
      setProductFormError(err.message || "A network error interrupted the transmission.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const resetProductForm = () => {
    setIsEditingProduct(false);
    setProductUnderEdit(null);
    setFormName("");
    setFormPrice("");
    setFormDiscountPrice("");
    setFormCategory("bags");
    setFormSubcategory("");
    setFormDescription("");
    setFormStock("10");
    setFormSku("");
    setFormFeatured(false);
    setImageFiles([]);
    setImagePreviews([]);
    setFallbackImageUrl("");
    setExistingImagesList([]);
    setSelectedCollections([]);
  };

  const editProductTrigger = (p: Product) => {
    setIsEditingProduct(true);
    setProductUnderEdit(p);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormDiscountPrice(p.originalPrice ? p.originalPrice.toString() : "");
    setFormCategory(p.category);
    setFormSubcategory(p.subcategory || "");
    setFormDescription(p.description);
    setFormStock(p.inStock.toString());
    setFormSku(p.skus && p.skus.length > 0 ? p.skus[0].sku : "");
    setFormDimensions(p.dimensions || "");
    setFormWeight(p.weight || "");
    setFormCare(p.careInstructions || "");
    setFormFeatures(p.features ? p.features.join(", ") : "");
    setFormColors(p.variantColors ? p.variantColors.join(", ") : "");
    setFormColorsHex(p.variantColorsHex ? p.variantColorsHex.join(", ") : "");
    setExistingImagesList(p.images || [p.image]);
    
    // Find collections containing this product
    const containsIds = collections.filter(c => c.productIds && c.productIds.includes(p.id)).map(c => c.id);
    setSelectedCollections(containsIds);

    // Smooth scroll
    const el = document.getElementById("product-form-card");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const deleteProductTrigger = async (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to delete "${name}"? This will permanently purge it from our digital catalog archives.`)) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          onProductDeleted(id);
          fetchAllData();
        } else {
          alert("Purge failed. Catalog remains secure.");
        }
      } catch (e) {
        alert("Network communication error during deletion.");
      }
    }
  };

  // Helper: auto-match products for a template based on category or keywords
  const getMatchingProductIdsForTemplate = (template: typeof FEATURED_COLLECTION_TEMPLATES[0]) => {
    return products
      .filter(p => {
        if (p.category === template.categoryFilter) return true;
        const text = `${p.name} ${p.subcategory} ${p.description}`.toLowerCase();
        return template.keywords.some(kw => text.includes(kw));
      })
      .map(p => p.id);
  };

  // Handle template pre-fill into builder form
  const handleApplyTemplateToForm = (template: typeof FEATURED_COLLECTION_TEMPLATES[0]) => {
    setNewCollectionName(template.name);
    setNewCollectionDesc(template.description);
    setNewCollectionBadge(template.badge);
    setIsFeaturedCollection(template.isFeatured);
    setNewCollectionPublished(template.isPublished);

    const matchedIds = getMatchingProductIdsForTemplate(template);
    setNewCollectionProductIds(matchedIds);
    setCollectionActionNotice(`Template "${template.name}" loaded into collection builder with ${matchedIds.length} pre-selected matching items.`);
  };

  // Handle 1-click quick launch of a featured collection template
  const handleQuickLaunchTemplate = async (template: typeof FEATURED_COLLECTION_TEMPLATES[0]) => {
    const matchedIds = getMatchingProductIdsForTemplate(template);
    const colId = template.id + "-" + Date.now().toString(36).substring(4);
    
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: colId,
          name: template.name,
          description: template.description,
          badge: template.badge,
          productIds: matchedIds,
          isFeatured: template.isFeatured,
          isPublished: template.isPublished
        })
      });

      if (res.ok) {
        setCollectionActionNotice(`Instant Launch Success: Featured collection "${template.name}" published with ${matchedIds.length} auto-matched masterpieces!`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
      setCollectionActionNotice("Failed to launch collection template.");
    }
  };

  // Collection creation
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName) return;

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDesc,
          badge: newCollectionBadge,
          productIds: newCollectionProductIds,
          isFeatured: isFeaturedCollection,
          isPublished: newCollectionPublished
        })
      });
      if (res.ok) {
        setNewCollectionName("");
        setNewCollectionDesc("");
        setNewCollectionBadge("");
        setIsFeaturedCollection(false);
        setNewCollectionPublished(true);
        setNewCollectionProductIds([]);
        setCollectionActionNotice(`Collection "${newCollectionName}" created successfully.`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveProductFromCollection = async (col: any, prodId: string) => {
    try {
      const updatedIds = (col.productIds || []).filter((id: string) => id !== prodId);
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...col, productIds: updatedIds })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProductToCollection = async (col: any, prodId: string) => {
    if (!prodId) return;
    try {
      const currentIds = col.productIds || [];
      if (currentIds.includes(prodId)) return;
      const updatedIds = [...currentIds, prodId];
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...col, productIds: updatedIds })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle single collection publish state
  const handleToggleSinglePublish = async (col: any) => {
    try {
      const targetStatus = col.isPublished === false ? true : false;
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...col, isPublished: targetStatus })
      });
      if (res.ok) {
        setCollectionActionNotice(`Collection "${col.name}" ${targetStatus ? 'published' : 'unpublished'}.`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle single collection featured status
  const handleToggleSingleFeatured = async (col: any) => {
    try {
      const targetFeatured = !col.isFeatured;
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...col, isFeatured: targetFeatured })
      });
      if (res.ok) {
        setCollectionActionNotice(`Collection "${col.name}" ${targetFeatured ? 'marked as Homepage Featured' : 'removed from Homepage Featured'}.`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Actions for Collections
  const handleSelectAllFilteredCollections = (filteredCols: any[]) => {
    const allFilteredIds = filteredCols.map(c => c.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedCollectionIds.includes(id));
    if (isAllSelected) {
      setSelectedCollectionIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedCollectionIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectCollection = (colId: string) => {
    setSelectedCollectionIds(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleBulkDeleteCollections = async () => {
    if (selectedCollectionIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedCollectionIds.length} selected collection(s)?`)) {
      return;
    }

    try {
      const res = await fetch("/api/collections/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedCollectionIds })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCollectionActionNotice(`Successfully deleted ${data.count || selectedCollectionIds.length} collection(s).`);
        setSelectedCollectionIds([]);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
      setCollectionActionNotice("Failed to delete selected collections.");
    }
  };

  const handleBulkPublishCollections = async (isPublished: boolean) => {
    if (selectedCollectionIds.length === 0) return;

    try {
      const res = await fetch("/api/collections/bulk-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedCollectionIds, isPublished })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCollectionActionNotice(`Successfully ${isPublished ? 'published' : 'unpublished'} ${data.count || selectedCollectionIds.length} collection(s).`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
      setCollectionActionNotice("Failed to update collection publish statuses.");
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");
    setSettingsError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeSettings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccess("Atelier corporate settings updated successfully.");
      } else {
        setSettingsError(data.error || "Failed to commit settings to Firestore.");
      }
    } catch (err: any) {
      setSettingsError(err.message || "An unexpected network failure occurred.");
    }
  };

  // Order Status update
  const handleUpdateOrderStatus = async (orderId: string, updates: any) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(prev => ({ ...prev, ...updates }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SIMULATOR ACTIONS
  const runSimulationStep = async () => {
    const logs = [...simulationLogs];
    
    if (simulationStep === 0) {
      setSimulationLogs(["Initializing Sandbox Testing Simulator...", "Simulating Admin credentials handshake..."]);
      setSimulationStep(1);
    } 
    else if (simulationStep === 1) {
      // Step 1: Admin Add Product
      logs.push("Publishing masterpiece 'Aurelius Safari Attache'...");
      logs.push("Uploading image compression canvas to Storage...");
      logs.push("Writing document entry to 'products' Firestore collection...");

      const mockProduct = {
        id: `sim-prod-${Date.now()}`,
        name: "Aurelius Safari Attache",
        price: 385,
        originalPrice: 450,
        category: "bags",
        subcategory: "Business Attache",
        description: "Artisanal executive attache styled from selected oil-wax pull grain cowhide with authentic solid brass locks.",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800"],
        inStock: 5,
        dimensions: "42cm L x 12cm W x 30cm H",
        weight: "1.6 kg",
        careInstructions: "Condition with beeswax wax twice annually.",
        features: ["Solid Brass Lock", "Reinforced Handle", "Compartmentalized Inside Organizer"],
        variantColors: ["Safari Tan"],
        variantColorsHex: ["#B98B5D"],
        skus: [{ sku: "AUR-BAG-SAF-TAN", color: "Safari Tan", inStock: 5 }]
      };

      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...mockProduct,
            base64Images: [] // simulated file upload
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          onProductAdded(data.product);
          setSimulationProduct(data.product);
          logs.push(`SUCCESS: Product created in Firestore under ID: ${data.product.id}`);
          logs.push("Product has successfully propagated to the active storefront inventory.");
          setSimulationStep(2);
        } else {
          logs.push(`FAILED: ${data.error || "Server rejection"}`);
        }
      } catch (e) {
        logs.push("FAILED: Network interruption.");
      }
      setSimulationLogs(logs);
    } 
    else if (simulationStep === 2) {
      // Step 2: Assign to featured collection
      logs.push("Updating collection mapping...");
      logs.push("Assigning 'Aurelius Safari Attache' to 'Overland Series' collection...");
      
      const overlandCol = collections.find(c => c.id === "overland") || collections[0];
      if (overlandCol && simulationProduct) {
        const updatedIds = Array.from(new Set([...(overlandCol.productIds || []), simulationProduct.id]));
        try {
          const res = await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...overlandCol, productIds: updatedIds })
          });
          if (res.ok) {
            logs.push(`SUCCESS: Overland Collection updated in Firestore with Product: ${simulationProduct.id}`);
            logs.push("Product is now featured in Overland Collection section on homepage.");
            setSimulationStep(3);
          }
        } catch (e) {
          logs.push("FAILED: Collection mapping error.");
        }
      } else {
        logs.push("FAILED: Overland collection target not found.");
      }
      setSimulationLogs(logs);
    } 
    else if (simulationStep === 3) {
      // Step 3: Customer Checkout
      logs.push("Simulating customer purchase checkout...");
      logs.push("Submitting payment request secure escrow payload via Paystack API sandboxed gateway...");
      logs.push("Writing Order record 'AUR-SIM-CHECKOUT' document to 'orders' Firestore collection...");

      if (simulationProduct) {
        try {
          const orderPayload = {
            customerName: "VIP Client Marcus",
            customerEmail: "marcus.sterling@sterlingholdings.co",
            customerPhone: "+1 (212) 555-8822",
            shippingAddress: "740 Park Ave, New York, NY 10021",
            items: [{
              product: simulationProduct,
              quantity: 1,
              selectedColor: "Safari Tan"
            }],
            subtotal: simulationProduct.price,
            shippingCost: 0,
            total: simulationProduct.price,
            status: "New",
            paymentStatus: "Paid",
            gateway: "paystack"
          };

          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
          });
          const data = await res.json();
          if (res.ok && data.success) {
            // Also deduct product stock
            const updatedStockProd = {
              ...simulationProduct,
              inStock: Math.max(0, simulationProduct.inStock - 1)
            };
            await fetch(`/api/products/${simulationProduct.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedStockProd)
            });
            onProductUpdated(updatedStockProd);

            logs.push(`SUCCESS: Order '${data.order.id}' registered successfully.`);
            logs.push("Customer profile stats incremented: VIP status checked.");
            logs.push("Inventory Stock successfully decremented: Stock remaining: 4.");
            logs.push("Sandbox Simulation Complete! All systems verified green.");
            setSimulationStep(4);
          }
        } catch (e) {
          logs.push("FAILED: Payment mapping error.");
        }
      }
      setSimulationLogs(logs);
    }
  };

  const clearSimulation = () => {
    setSimulationStep(0);
    setSimulationLogs([]);
    setSimulationProduct(null);
  };

  // Products filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          (p.skus && p.skus.some(s => s.sku.toLowerCase().includes(productSearch.toLowerCase())));
    const matchesCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
    let matchesStock = true;
    if (productStockFilter === "low") {
      matchesStock = p.inStock <= 5 && p.inStock > 0;
    } else if (productStockFilter === "out") {
      matchesStock = p.inStock === 0;
    }
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Math Metrics
  const totalProductsCount = products.length;
  const totalSalesCount = orders.filter(o => o.status === "Delivered" || o.status === "Processing" || o.status === "Shipped").length;
  const totalOrdersCount = orders.length;
  const totalRevenueSum = orders.filter(o => o.paymentStatus === "Paid").reduce((acc, o) => acc + (o.total || 0), 0);
  const totalCustomersCount = customers.length;
  const lowStockItemsList = products.filter(p => p.inStock <= 5);

  // Dynamic Sales Trend Chart helper
  const chartData = orders.slice().reverse().map((o, idx) => ({
    label: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: o.total || 0,
    orders: idx + 1
  })).slice(-10);

  // Dynamic Categories Donut Chart helper
  const categorySalesMap = orders.reduce((acc: Record<string, number>, o) => {
    if (o.items) {
      o.items.forEach((item: any) => {
        const cat = item.product?.category || "accessories";
        acc[cat] = (acc[cat] || 0) + (item.quantity || 1);
      });
    }
    return acc;
  }, {});

  const donutData = [
    { name: "Bags", value: categorySalesMap["bags"] || 10, fill: "#7A4E2D" },
    { name: "Shoes", value: categorySalesMap["shoes"] || 6, fill: "#B98B5D" },
    { name: "Accessories", value: categorySalesMap["accessories"] || 8, fill: "#C5A05A" }
  ];

  if (!isAuthenticated) {
    return (
      <div className={`min-h-[80vh] flex items-center justify-center font-sans ${isAdminDark ? "bg-[#0b0b0b] text-gray-200" : "bg-neutral-50 text-neutral-800"}`}>
        <div className={`max-w-md w-full p-8 rounded-xl border ${isAdminDark ? "bg-[#111111] border-[#C5A05A]/25" : "bg-white border-neutral-200"} shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#A5673F] via-[#C5A05A] to-[#A5673F]" />
          
          <div className="text-center mb-6">
            <span className="font-serif text-3xl tracking-[0.2em] font-bold block bg-gradient-to-r from-[#A5673F] to-[#C5A05A] bg-clip-text text-transparent">AURELIUS</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold mt-1 block">Atelier Security Panel</span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Corporate Passcode</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className={`w-full bg-[#171717] border ${isAdminDark ? "border-gray-800 focus:border-[#C5A05A]" : "border-neutral-300 focus:border-amber-700"} text-white rounded px-3 py-2.5 outline-none font-mono text-center tracking-[0.25em] transition-colors`}
                  placeholder="••••••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-gray-300 font-semibold"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-3 rounded uppercase font-semibold text-xs tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Verify Corporate Credentials</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between items-center text-[10px] text-gray-500 font-mono">
            <span>FLORENCE PORTAL v3.2</span>
            <button 
              type="button" 
              onClick={() => setIsAdminDark(!isAdminDark)}
              className="hover:text-white"
            >
              {isAdminDark ? "LIGHT PANEL" : "DARK PANEL"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors ${isAdminDark ? "bg-[#0b0b0b] text-gray-200" : "bg-neutral-50 text-neutral-800"}`}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-64 border-r shrink-0 flex flex-col justify-between ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} relative`}>
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-gray-850/50 flex justify-between items-center">
            <div>
              <span className="font-serif text-xl tracking-[0.2em] font-bold block bg-gradient-to-r from-[#A5673F] to-[#C5A05A] bg-clip-text text-transparent">AURELIUS</span>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold font-mono">Control Desk</span>
            </div>
            <button 
              onClick={() => setIsAdminDark(!isAdminDark)}
              className="p-1.5 rounded-lg hover:bg-neutral-800/20 text-gray-400 hover:text-white"
            >
              {isAdminDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Menus List */}
          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "products", label: "Products Catalog", icon: ShoppingBag },
              { id: "collections", label: "Collections", icon: FolderHeart },
              { id: "orders", label: "Orders Pipeline", icon: ListOrdered },
              { id: "customers", label: "Client Records", icon: Users },
              { id: "settings", label: "Store Settings", icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeMenu === item.id 
                    ? "bg-[#C5A05A]/10 border-l-2 border-[#C5A05A] text-[#C5A05A]" 
                    : "text-gray-400 hover:bg-neutral-800/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sandbox Test Simulator Hub inside sidebar bottom */}
        <div className="p-4 border-t border-gray-800/40 space-y-3 bg-[#141414]/50">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-3.5 w-3.5 text-[#C5A05A] animate-spin-slow" />
            <span className="text-[9px] uppercase tracking-widest font-mono text-gray-400 font-bold">Atelier Simulator Hub</span>
          </div>
          
          <div className="text-[10px] text-gray-500 font-light leading-snug">
            Run standard sandbox tests to verify add product, image upload, collection and payment sync.
          </div>

          {simulationStep > 0 && (
            <div className="bg-[#0b0b0b] p-2 border border-gray-800/60 rounded font-mono text-[9px] text-gray-400 max-h-24 overflow-y-auto space-y-1">
              {simulationLogs.map((log, i) => (
                <div key={i} className="leading-tight">
                  <span className="text-[#C5A05A]">›</span> {log}
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-1">
            <button 
              onClick={runSimulationStep}
              className="flex-grow bg-[#C5A05A]/10 border border-[#C5A05A]/40 hover:bg-[#C5A05A] text-[#C5A05A] hover:text-black rounded px-2.5 py-1.5 text-[9px] uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-1"
            >
              <Play className="h-2.5 w-2.5 shrink-0" />
              <span>{simulationStep === 0 ? "Start Test Loop" : `Run Step ${simulationStep}`}</span>
            </button>
            {simulationStep > 0 && (
              <button 
                onClick={clearSimulation}
                className="bg-neutral-800 hover:bg-neutral-700 text-white rounded px-2.5 py-1.5 text-[9px] uppercase transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {/* Logout */}
          <button 
            onClick={handleAdminLogout}
            className="w-full text-center text-gray-500 hover:text-white transition-all py-1.5 text-[9px] uppercase font-mono tracking-widest block flex items-center justify-center space-x-1 mt-2 border-t border-gray-800/20 pt-2"
          >
            <LogOut className="h-3 w-3" />
            <span>Lock Control Desk</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-grow p-8 overflow-y-auto">
        
        {/* TOP STATUS ROW */}
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-gray-800/20">
          <div>
            <h1 className="font-serif text-3xl tracking-wide text-white capitalize font-medium">{activeMenu} Work Desk</h1>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mt-1">Aurelius Luxury Storefront Management Core</p>
          </div>
          
          <div className="flex space-x-3 text-xs font-mono">
            <div className={`px-4 py-2 rounded border ${isAdminDark ? "bg-[#111] border-gray-850" : "bg-white border-neutral-200"} flex items-center space-x-2`}>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-400">Database Engine:</span>
              <span className="text-white font-bold">FIRESTORE-ONLINE</span>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD HOME VIEW */}
        {activeMenu === "dashboard" && (
          <div className="space-y-8">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { title: "Total Products", val: totalProductsCount, icon: ShoppingBag, color: "border-[#C5A05A]/25", unit: "SKUs" },
                { title: "Escrow Revenue", val: formatPrice(totalRevenueSum, storeSettings.baseCurrency), icon: Coins, color: "border-green-500/25", unit: "Gross" },
                { title: "Delivered Orders", val: totalSalesCount, icon: Truck, color: "border-blue-500/25", unit: "Shipped" },
                { title: "Total Orders", val: totalOrdersCount, icon: ListOrdered, color: "border-amber-500/25", unit: "Pipelines" },
                { title: "Vetted Patrons", val: totalCustomersCount, icon: Users, color: "border-purple-500/25", unit: "Accounts" },
              ].map((card, i) => (
                <div key={i} className={`p-6 rounded-xl border ${isAdminDark ? "bg-[#111111]" : "bg-white"} ${card.color} shadow-lg relative overflow-hidden`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold font-mono">{card.title}</span>
                    <card.icon className="h-4 w-4 text-[#C5A05A]" />
                  </div>
                  <div className="font-serif text-2xl font-bold text-white tracking-wide">{card.val}</div>
                  <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mt-1 flex items-center justify-between">
                    <span>{card.unit} Vetted</span>
                    <TrendingUp className="h-3 w-3 text-green-500 shrink-0 ml-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* CHARTS GRAPH SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Line Chart */}
              <div className={`md:col-span-8 p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-white">Escrow Settlement Trends</h3>
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">Daily revenue streams from verified customer checkouts</span>
                  </div>
                  <span className="text-xs bg-[#C5A05A]/10 text-[#C5A05A] px-2.5 py-1 rounded border border-[#C5A05A]/30 uppercase font-mono">Live Sync</span>
                </div>

                <div className="h-72 w-full text-xs">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="label" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }} />
                        <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#C5A05A" strokeWidth={2.5} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 font-mono">
                      Awaiting transaction events to compile charts...
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Collection Pie Chart */}
              <div className={`md:col-span-4 p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg flex flex-col justify-between`}>
                <div>
                  <h3 className="font-serif text-lg font-medium text-white">Sales Share By Category</h3>
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block mb-4">Percentage breakdown of purchased goods</span>
                </div>

                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4 font-mono text-[11px]">
                  {donutData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-white font-bold">{item.value} Sold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LOWER ROW: RECENT ORDERS & LOW STOCK ALERTS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Recent Orders Table (Span 8) */}
              <div className={`md:col-span-8 p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-lg font-medium text-white">Recent Order Requests</h3>
                  <button onClick={() => setActiveMenu("orders")} className="text-xs text-[#C5A05A] hover:underline font-semibold font-mono uppercase">View All Orders</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-400">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        <th className="py-3">Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Pipeline Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850/40">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-neutral-800/10 transition-colors">
                          <td className="py-3.5 font-mono text-white font-semibold">{o.id}</td>
                          <td>
                            <div className="font-medium text-gray-300">{o.customerName}</div>
                            <div className="text-[10px] text-gray-500">{o.customerEmail}</div>
                          </td>
                          <td className="font-mono text-white">{formatPrice(o.total, storeSettings.baseCurrency)}</td>
                          <td>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                              o.status === "New" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                              o.status === "Processing" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              o.status === "Shipped" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                              o.status === "Delivered" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                              "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => { setViewingOrder(o); setActiveMenu("orders"); }}
                              className="text-gray-400 hover:text-white flex items-center space-x-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-500 font-mono">
                            No active orders recorded yet. Run simulation at bottom to generate some!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alerts (Span 4) */}
              <div className={`md:col-span-4 p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center space-x-2 text-amber-500 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-serif text-lg font-medium text-white">Low Stock Warning</h3>
                  </div>

                  <div className="space-y-3">
                    {lowStockItemsList.slice(0, 4).map((p) => (
                      <div key={p.id} className="p-3 bg-amber-500/5 rounded border border-amber-500/10 flex justify-between items-center text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-serif font-medium text-gray-300 truncate">{p.name}</p>
                          <span className="text-[10px] text-gray-500 font-mono">Category: {p.category.toUpperCase()}</span>
                        </div>
                        <span className="font-mono text-amber-500 font-bold shrink-0">{p.inStock} left</span>
                      </div>
                    ))}
                    {lowStockItemsList.length === 0 && (
                      <div className="p-4 bg-green-500/5 rounded border border-green-500/10 text-xs text-green-400 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>All masterpiece inventories are fully supplied!</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => { setActiveMenu("products"); setProductStockFilter("low"); }}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 text-white hover:text-[#C5A05A] transition-colors py-2 text-[10px] uppercase tracking-wider font-mono font-bold rounded mt-4"
                >
                  Manage Low Stock Catalogs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCT MANAGEMENT SYSTEM */}
        {activeMenu === "products" && (
          <div className="space-y-8">
            
            {/* INVENTORY CATALOG TABLE & FILTERS CARD */}
            <div className={`p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-white">Artisanal Masterpieces Catalog</h3>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">List of active products, variant SKUs and current stock holdings</p>
                </div>
                
                {/* Trigger add new scroll anchor */}
                {!isEditingProduct && (
                  <button 
                    onClick={() => { setIsEditingProduct(true); setProductUnderEdit(null); }}
                    className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-4 py-2.5 rounded text-xs uppercase font-semibold tracking-wider flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Publish New Masterpiece</span>
                  </button>
                )}
              </div>

              {/* Advanced Search & Filtering toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 border-b border-gray-800/30 pb-4">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-500 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search name, category, SKU..."
                    className="w-full bg-[#181818] border border-gray-800 rounded pl-10 pr-3 py-1.5 outline-none focus:border-[#C5A05A] text-xs text-white"
                  />
                </div>

                <select 
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-[#181818] border border-gray-800 rounded px-3 py-1.5 outline-none focus:border-[#C5A05A] text-xs text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="bags">Bags & Luggage</option>
                  <option value="shoes">Footwear & Shoes</option>
                  <option value="accessories">Accessories & Care</option>
                </select>

                <select 
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value)}
                  className="bg-[#181818] border border-gray-800 rounded px-3 py-1.5 outline-none focus:border-[#C5A05A] text-xs text-white"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="low">Low Stock (≤5)</option>
                  <option value="out">Out of Stock (0)</option>
                </select>

                <button 
                  onClick={() => { setProductSearch(""); setProductCategoryFilter("all"); setProductStockFilter("all"); }}
                  className="text-xs text-gray-500 hover:text-[#C5A05A] font-mono font-bold uppercase py-1 text-right md:text-left hover:underline"
                >
                  Reset Filtering Parameters
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-400">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      <th className="py-3">Masterpiece Thumbnail</th>
                      <th>Detail Specs</th>
                      <th>Category</th>
                      <th>MSRP Price</th>
                      <th>In Stock</th>
                      <th className="text-right">Catalog Management Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/40">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#151515]/30 transition-colors">
                        <td className="py-3">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-12 h-12 object-cover rounded border border-gray-800 shadow"
                            onError={(e) => {
                              // Prevent broken images
                              e.currentTarget.src = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800";
                            }}
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td>
                          <div className="font-serif text-sm font-semibold text-white max-w-sm truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {p.skus && p.skus.length > 0 ? p.skus[0].sku : "AUR-GEN-01"}</div>
                        </td>
                        <td className="uppercase font-mono text-[10px] text-[#C5A05A]">{p.category}</td>
                        <td className="font-mono text-white font-medium">
                          {p.originalPrice && <span className="text-gray-500 line-through mr-1.5 text-[10px]">{formatPrice(p.originalPrice, storeSettings.baseCurrency)}</span>}
                          {formatPrice(p.price, storeSettings.baseCurrency)}
                        </td>
                        <td className="font-mono">
                          <span className={`font-bold ${p.inStock === 0 ? "text-red-500" : p.inStock <= 5 ? "text-amber-500" : "text-green-500"}`}>
                            {p.inStock} units
                          </span>
                        </td>
                        <td className="text-right space-x-2">
                          <button 
                            onClick={() => editProductTrigger(p)}
                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
                            title="Edit specs details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteProductTrigger(p.id, p.name)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-neutral-800 transition-colors"
                            title="Purge listings"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono">
                          No matching masterpieces found in current parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRODUCT EDITING / ADDING COMPREHENSIVE FORM */}
            {isEditingProduct && (
              <div id="product-form-card" className={`p-8 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-2xl relative`}>
                <div className="absolute top-0 inset-x-0 h-0.5 bg-[#C5A05A]" />
                
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-white">{productUnderEdit ? "Edit Curated Specifications" : "Bespoke Masterpiece Creation Form"}</h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">Validate information criteria and image uploads before publishing</p>
                  </div>
                  <button 
                    onClick={resetProductForm}
                    className="p-1 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-6">
                  
                  {/* Row 1: Name, Price, original price */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Masterpiece Title *</label>
                      <input 
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Aurelius Navigator Weekend Bag"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Listing MSRP Price (USD) *</label>
                      <input 
                        type="number"
                        step="1"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="e.g. 295"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Strike-through Original Price (USD)</label>
                      <input 
                        type="number"
                        step="1"
                        value={formDiscountPrice}
                        onChange={(e) => setFormDiscountPrice(e.target.value)}
                        placeholder="e.g. 350"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 2: Category, Subcategory, Stock, SKU */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Atelier Classification Category *</label>
                      <select 
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                        required
                      >
                        <option value="bags">Bags & Luggage</option>
                        <option value="shoes">Footwear & Shoes</option>
                        <option value="accessories">Accessories & Care</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Subcategory / Collection Tag</label>
                      <input 
                        type="text"
                        value={formSubcategory}
                        onChange={(e) => setFormSubcategory(e.target.value)}
                        placeholder="e.g. Executive Carry"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Available Stock Units *</label>
                      <input 
                        type="number"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Master Listing Sku Code</label>
                      <input 
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="e.g. AUR-NAV-DB-BRW"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Natural Leathercraft Material & Narrative Description *</label>
                    <textarea 
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Narrate details, tanning history, and physical texture guidelines..."
                      rows={5}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white leading-relaxed"
                      required
                    />
                  </div>

                  {/* Row 4: Specifications (Dimensions, Weight, Care, features) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Physical Specifications Dimensions</label>
                      <input 
                        type="text"
                        value={formDimensions}
                        onChange={(e) => setFormDimensions(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Item Weight</label>
                      <input 
                        type="text"
                        value={formWeight}
                        onChange={(e) => setFormWeight(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Care & Preservation Protocols (Separated by comma)</label>
                      <input 
                        type="text"
                        value={formCare}
                        onChange={(e) => setFormCare(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Key Artisan Craft Features (Separated by comma)</label>
                      <input 
                        type="text"
                        value={formFeatures}
                        onChange={(e) => setFormFeatures(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Color variants */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Variant Colors Names (Separated by comma)</label>
                      <input 
                        type="text"
                        value={formColors}
                        onChange={(e) => setFormColors(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Variant Colors Hex Codes (Separated by comma)</label>
                      <input 
                        type="text"
                        value={formColorsHex}
                        onChange={(e) => setFormColorsHex(e.target.value)}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Collections assignment checkboxes */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Assign Masterpiece to Collections</label>
                    <div className="flex flex-wrap gap-4 p-3 bg-[#181818] border border-gray-850 rounded">
                      {collections.map(col => (
                        <label key={col.id} className="flex items-center space-x-2 text-xs text-gray-300 select-none cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedCollections.includes(col.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCollections([...selectedCollections, col.id]);
                              } else {
                                setSelectedCollections(selectedCollections.filter(id => id !== col.id));
                              }
                            }}
                            className="rounded border-gray-800 text-[#C5A05A] focus:ring-0"
                          />
                          <span>{col.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* IMAGE UPLOAD & COMPRESSION CONTAINER */}
                  <div className="p-5 bg-[#141414] border border-gray-850 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs uppercase tracking-widest font-mono text-white font-bold">Atelier Multi-Image Photographics</h4>
                        <span className="text-[10px] text-gray-500 font-light mt-0.5 block">Compression canvas automatically formats images below 1MB safe Firestore thresholds.</span>
                      </div>
                      <span className="text-[10px] text-[#C5A05A] font-mono">Max 10 Assets</span>
                    </div>

                    {/* Drag-and-drop simulated dropzone */}
                    <div className="border border-dashed border-gray-800 hover:border-[#C5A05A]/50 bg-[#0f0f0f] rounded-lg p-6 text-center transition-colors relative cursor-pointer">
                      <input 
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-300 font-medium">Drag and drop masterpiece photography here, or click to browse files</p>
                      <span className="text-[9px] text-gray-500 font-mono uppercase mt-1 block">Supports PNG, JPG, JPEG, WEBP formats</span>
                    </div>

                    {/* Fallback Image URL input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Optional Web/Fallback Image Link URL (Backup if upload is skipped)</label>
                      <input 
                        type="url"
                        value={fallbackImageUrl}
                        onChange={(e) => setFallbackImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-[#1c1c1c] border border-gray-850 rounded px-3 py-1.5 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                      />
                    </div>

                    {/* Existing Images (Edit mode only) */}
                    {existingImagesList.length > 0 && (
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Existing Curated Catalog Assets</span>
                        <div className="flex flex-wrap gap-3">
                          {existingImagesList.map((img, idx) => (
                            <div key={idx} className="relative group rounded border border-gray-800 overflow-hidden">
                              <img src={img} className="w-16 h-16 object-cover" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeExistingProductImage(idx)}
                                className="absolute top-1 right-1 p-0.5 bg-black/80 rounded hover:text-red-500 text-gray-400 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected files previews */}
                    {imagePreviews.length > 0 && (
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Newly Uploaded Asset Previews</span>
                        <div className="flex flex-wrap gap-3">
                          {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative group rounded border border-gray-850 overflow-hidden">
                              <img src={preview} className="w-16 h-16 object-cover" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeSelectedImageFile(idx)}
                                className="absolute top-1 right-1 p-0.5 bg-black/80 rounded hover:text-red-500 text-gray-400 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Banners */}
                  {productFormError && (
                    <div className="p-3.5 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{productFormError}</span>
                    </div>
                  )}

                  {productFormSuccess && (
                    <div className="p-3.5 bg-green-950/20 border border-green-500/30 text-green-400 text-xs rounded flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>{productFormSuccess}</span>
                    </div>
                  )}

                  {/* Form actions */}
                  <div className="flex space-x-3 pt-2">
                    <button 
                      type="submit"
                      disabled={isUploadingFiles}
                      className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 px-6 py-3 rounded text-xs uppercase font-bold tracking-widest transition-all cursor-pointer shadow-md flex items-center space-x-2 border border-transparent"
                    >
                      {isUploadingFiles ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                          <span>Encoding Transmission...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>{productUnderEdit ? "Commit Curations" : "Publish Masterpiece"}</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={resetProductForm}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-3 rounded text-xs uppercase tracking-wider transition-colors font-semibold border border-transparent"
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. COLLECTIONS VIEW */}
        {activeMenu === "collections" && (() => {
          // Compute filtered list of collections based on search and status
          const filteredCollections = collections.filter(col => {
            const matchesSearch = collectionSearch === "" || 
              col.name.toLowerCase().includes(collectionSearch.toLowerCase()) || 
              (col.description && col.description.toLowerCase().includes(collectionSearch.toLowerCase())) ||
              (col.badge && col.badge.toLowerCase().includes(collectionSearch.toLowerCase()));

            if (!matchesSearch) return false;

            if (collectionStatusFilter === "published") {
              return col.isPublished !== false;
            }
            if (collectionStatusFilter === "draft") {
              return col.isPublished === false;
            }
            if (collectionStatusFilter === "featured") {
              return col.isFeatured === true;
            }
            return true;
          });

          const isAllFilteredSelected = filteredCollections.length > 0 && filteredCollections.every(c => selectedCollectionIds.includes(c.id));

          return (
            <div className="space-y-8">
              
              {/* Feedback notice alert */}
              {collectionActionNotice && (
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#1a1813] to-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center space-x-3 text-amber-300 text-xs">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
                    <span className="font-mono">{collectionActionNotice}</span>
                  </div>
                  <button 
                    onClick={() => setCollectionActionNotice("")}
                    className="text-gray-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-gray-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* QUICK-CREATE TEMPLATES FOR FEATURED COLLECTIONS */}
              <div className={`p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-850 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-[#C5A05A]" />
                      <h3 className="font-serif text-base font-semibold text-white">Quick-Create Featured Collection Templates</h3>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest block mt-0.5">
                      Launch pre-curated luxury capsules pre-matched with active store inventory in 1 click
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C5A05A] bg-[#C5A05A]/10 border border-[#C5A05A]/20 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    6 Curated Templates Available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FEATURED_COLLECTION_TEMPLATES.map(tmpl => {
                    const matchedIds = getMatchingProductIdsForTemplate(tmpl);
                    return (
                      <div key={tmpl.id} className="p-4 bg-[#161616] border border-gray-800 hover:border-[#C5A05A]/50 rounded-lg flex flex-col justify-between space-y-3 transition-all hover:shadow-lg">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 bg-[#C5A05A]/15 text-[#C5A05A] border border-[#C5A05A]/30 rounded-full font-bold">
                              {tmpl.badge}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {matchedIds.length} Products Match
                            </span>
                          </div>
                          <h4 className="font-serif text-sm font-semibold text-white">{tmpl.name}</h4>
                          <p className="text-[11px] text-gray-400 font-light line-clamp-2 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-850 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickLaunchTemplate(tmpl)}
                            className="flex-1 bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-1.5 px-2 rounded font-semibold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                          >
                            <Zap className="h-3 w-3" />
                            <span>1-Click Launch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyTemplateToForm(tmpl)}
                            className="bg-[#222222] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-750 py-1.5 px-2.5 rounded text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center space-x-1"
                            title="Fill form values to customize first"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Pre-fill</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MAIN COLLECTIONS MANAGER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Panel: Collections Builder Form (Span 4) */}
                <div className={`md:col-span-4 p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg flex flex-col justify-between`}>
                  <form onSubmit={handleCreateCollection} className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-white">Collection Builder</h3>
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">Custom craft a new curated group</span>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Collection Name *</label>
                      <input 
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="e.g. Tuscan Leather Travel"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Concept Narrative / Description</label>
                      <textarea 
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        placeholder="Concept story and curation details..."
                        rows={3}
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Custom Badge / Tagline</label>
                      <input 
                        type="text"
                        value={newCollectionBadge}
                        onChange={(e) => setNewCollectionBadge(e.target.value)}
                        placeholder="e.g. Summer Capsule, Heritage Edition"
                        className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      />
                    </div>

                    <div className="space-y-2 py-1">
                      <label className="flex items-center space-x-2 select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isFeaturedCollection}
                          onChange={(e) => setIsFeaturedCollection(e.target.checked)}
                          className="rounded border-gray-800 text-[#C5A05A] focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Feature prominently on Homepage</span>
                      </label>

                      <label className="flex items-center space-x-2 select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newCollectionPublished}
                          onChange={(e) => setNewCollectionPublished(e.target.checked)}
                          className="rounded border-gray-800 text-emerald-500 focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Publish Immediately (Visible to Public)</span>
                      </label>
                    </div>

                    {/* Pre-assign inventory items */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                        Pre-assign Masterpieces ({newCollectionProductIds.length} Selected)
                      </label>
                      <div className="max-h-36 overflow-y-auto space-y-1 bg-[#181818] border border-gray-800 rounded p-2">
                        {products.map(p => {
                          const isAssigned = newCollectionProductIds.includes(p.id);
                          return (
                            <label key={p.id} className="flex items-center justify-between text-[11px] text-gray-300 hover:text-white cursor-pointer py-0.5">
                              <span className="truncate pr-2 font-serif">{p.name}</span>
                              <input 
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewCollectionProductIds(prev => [...prev, p.id]);
                                  } else {
                                    setNewCollectionProductIds(prev => prev.filter(id => id !== p.id));
                                  }
                                }}
                                className="rounded border-gray-800 text-[#C5A05A] focus:ring-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-2.5 rounded uppercase font-semibold text-xs tracking-wider transition-colors shadow flex items-center justify-center space-x-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Generate Collection</span>
                    </button>
                  </form>
                </div>

                {/* Right Panel: Collections Grid & Bulk Actions (Span 8) */}
                <div className={`md:col-span-8 p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg space-y-5`}>
                  
                  {/* Top Bar: Title & Search/Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-850">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-white">Curated Collections Archives</h3>
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">
                        Managing {collections.length} active collection(s) inside Aurelius database
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                        <input 
                          type="text"
                          value={collectionSearch}
                          onChange={(e) => setCollectionSearch(e.target.value)}
                          placeholder="Search collections..."
                          className="pl-8 pr-3 py-1.5 bg-[#181818] border border-gray-800 rounded text-xs text-white outline-none focus:border-[#C5A05A] w-36 sm:w-44"
                        />
                      </div>

                      <select
                        value={collectionStatusFilter}
                        onChange={(e: any) => setCollectionStatusFilter(e.target.value)}
                        className="bg-[#181818] border border-gray-800 text-xs text-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]"
                      >
                        <option value="all">All Statuses</option>
                        <option value="published">Published Only</option>
                        <option value="draft">Drafts / Hidden</option>
                        <option value="featured">Homepage Featured</option>
                      </select>
                    </div>
                  </div>

                  {/* BULK ACTIONS TOOLBAR */}
                  {selectedCollectionIds.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-amber-500/20 via-[#211b10] to-amber-500/20 border border-amber-500/40 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn">
                      <div className="flex items-center space-x-2 text-xs font-mono text-amber-300">
                        <CheckSquare className="h-4 w-4 text-amber-400" />
                        <span className="font-bold">{selectedCollectionIds.length} Collection(s) Selected</span>
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleBulkPublishCollections(true)}
                          className="bg-emerald-600/80 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center space-x-1"
                          title="Publish selected collections to storefront"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Publish ({selectedCollectionIds.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBulkPublishCollections(false)}
                          className="bg-gray-750 hover:bg-gray-700 text-gray-200 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center space-x-1 border border-gray-650"
                          title="Unpublish selected collections (Move to Draft)"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Unpublish ({selectedCollectionIds.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBulkDeleteCollections}
                          className="bg-red-600/80 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center space-x-1"
                          title="Permanently delete selected collections"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete ({selectedCollectionIds.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCollectionIds([])}
                          className="text-gray-400 hover:text-white p-1 text-xs"
                          title="Clear Selection"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SELECT ALL HEADER BAR */}
                  <div className="flex items-center justify-between px-2 py-1 bg-[#161616] border border-gray-850 rounded text-xs text-gray-400 font-mono">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={() => handleSelectAllFilteredCollections(filteredCollections)}
                        className="rounded border-gray-800 text-[#C5A05A] focus:ring-0"
                      />
                      <span>Select All Filtered ({filteredCollections.length})</span>
                    </label>
                    <span>
                      Showing {filteredCollections.length} of {collections.length} Collections
                    </span>
                  </div>

                  {/* COLLECTIONS LIST */}
                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                    {filteredCollections.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 font-mono text-xs">
                        No collections matched the current filter criteria.
                      </div>
                    ) : (
                      filteredCollections.map(col => {
                        const isSelected = selectedCollectionIds.includes(col.id);
                        const isPublished = col.isPublished !== false;

                        return (
                          <div 
                            key={col.id} 
                            className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-all ${
                              isSelected 
                                ? "bg-[#181610] border-amber-500/50 shadow-md" 
                                : "bg-[#141414] border-gray-850 hover:border-gray-750"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start space-x-3">
                                {/* Selection Checkbox */}
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectCollection(col.id)}
                                  className="mt-1 rounded border-gray-800 text-[#C5A05A] focus:ring-0 cursor-pointer"
                                />

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-serif text-base font-semibold text-white">{col.name}</h4>
                                    
                                    {col.badge && (
                                      <span className="bg-[#C5A05A]/15 text-[#C5A05A] border border-[#C5A05A]/30 text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                                        {col.badge}
                                      </span>
                                    )}

                                    {/* Published Status Badge */}
                                    {isPublished ? (
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                                        <Eye className="h-2.5 w-2.5" />
                                        <span>Published</span>
                                      </span>
                                    ) : (
                                      <span className="bg-gray-800 text-gray-400 border border-gray-700 text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                                        <EyeOff className="h-2.5 w-2.5" />
                                        <span>Draft / Hidden</span>
                                      </span>
                                    )}

                                    {/* Featured Badge */}
                                    {col.isFeatured && (
                                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                                        <Star className="h-2.5 w-2.5 fill-amber-500" />
                                        <span>Homepage Featured</span>
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-400 font-light leading-relaxed">
                                    {col.description || "No concept narrative provided."}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Quick Item Actions */}
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSinglePublish(col)}
                                  className={`p-1.5 rounded transition-colors ${
                                    isPublished 
                                      ? "text-emerald-400 hover:bg-emerald-950/50" 
                                      : "text-gray-500 hover:text-emerald-400 hover:bg-gray-800"
                                  }`}
                                  title={isPublished ? "Unpublish (Move to Draft)" : "Publish Collection"}
                                >
                                  {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSingleFeatured(col)}
                                  className={`p-1.5 rounded transition-colors ${
                                    col.isFeatured 
                                      ? "text-amber-400 hover:bg-amber-950/50" 
                                      : "text-gray-500 hover:text-amber-400 hover:bg-gray-800"
                                  }`}
                                  title={col.isFeatured ? "Remove from Homepage Featured" : "Mark as Homepage Featured"}
                                >
                                  <Star className={`h-4 w-4 ${col.isFeatured ? "fill-amber-400" : ""}`} />
                                </button>

                                <button 
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Do you want to delete collection "${col.name}"?`)) {
                                      await fetch(`/api/collections/${col.id}`, { method: "DELETE" });
                                      fetchAllData();
                                    }
                                  }}
                                  className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-red-950/30 transition-colors"
                                  title="Delete Collection"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Products mapped to this collection */}
                            <div className="space-y-2 pt-2 border-t border-gray-800">
                              <div className="flex items-center justify-between">
                                <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">
                                  Assigned Masterpieces ({col.productIds ? col.productIds.length : 0}):
                                </span>

                                {/* Quick inline Product assigner */}
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddProductToCollection(col, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="bg-[#0f0f0f] border border-gray-800 text-[10px] text-gray-400 rounded px-2 py-0.5 outline-none focus:border-[#C5A05A]"
                                >
                                  <option value="">+ Assign Masterpiece...</option>
                                  {products
                                    .filter(p => !col.productIds || !col.productIds.includes(p.id))
                                    .map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                  }
                                </select>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {col.productIds && col.productIds.length > 0 ? (
                                  col.productIds.map((pid: string) => {
                                    const match = products.find(p => p.id === pid);
                                    return (
                                      <div key={pid} className="flex items-center space-x-1.5 bg-[#0f0f0f] border border-gray-850 rounded pl-2 pr-1.5 py-1 text-[10px]">
                                        <span className="text-gray-300 font-serif truncate max-w-44">{match ? match.name : pid}</span>
                                        <button 
                                          type="button"
                                          onClick={() => handleRemoveProductFromCollection(col, pid)}
                                          className="text-gray-500 hover:text-red-400 text-xs font-bold font-mono px-0.5 hover:bg-gray-800 rounded"
                                          title="Remove from collection"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs text-gray-500 font-light font-mono">
                                    No products assigned yet. Use the dropdown above to add items.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* 4. ORDERS VIEW */}
        {activeMenu === "orders" && (
          <div className="space-y-8">
            <div className={`p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg`}>
              <div className="mb-6">
                <h3 className="font-serif text-lg font-medium text-white">Customer Orders Pipeline</h3>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block mt-0.5">Track, edit tracking numbers and process shipments</span>
              </div>

              {/* Grid or Kanban Pipeline */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-400">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      <th className="py-3">Order ID</th>
                      <th>Date Requested</th>
                      <th>Patron Client</th>
                      <th>DHL Shipping Destination</th>
                      <th>Total Amount</th>
                      <th>Order Pipeline Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/40">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-neutral-800/10 transition-colors">
                        <td className="py-3.5 font-mono text-white font-semibold">{o.id}</td>
                        <td className="font-mono text-gray-400">{new Date(o.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td>
                          <div className="font-medium text-gray-300">{o.customerName}</div>
                          <div className="text-[10px] text-gray-500">{o.customerEmail}</div>
                        </td>
                        <td className="max-w-xs truncate">{o.shippingAddress || "Complimentary Atelier Delivery"}</td>
                        <td className="font-mono text-white font-medium">{formatPrice(o.total, storeSettings.baseCurrency)}</td>
                        <td>
                          <select 
                            value={o.status || "New"}
                            onChange={(e) => handleUpdateOrderStatus(o.id, { status: e.target.value })}
                            className="bg-[#181818] border border-gray-800 rounded px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono font-bold text-gray-300 outline-none focus:border-[#C5A05A]"
                          >
                            <option value="New">New</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => setViewingOrder(o)}
                            className="bg-neutral-800 hover:bg-[#C5A05A]/10 hover:text-[#C5A05A] transition-colors rounded px-3 py-1.5 uppercase font-mono font-bold text-[9px] text-gray-300 border border-transparent"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 font-mono">
                          No orders registered inside database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Viewing detailed order modal pop up */}
            {viewingOrder && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#111111] text-white border border-[#C5A05A]/25 max-w-xl w-full rounded-xl shadow-2xl relative overflow-hidden p-6 space-y-6">
                  <button 
                    onClick={() => setViewingOrder(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-neutral-800 text-gray-400 hover:text-white rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="border-b border-gray-800 pb-4">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-amber-500">DHL Shipping Manifest</span>
                    <h3 className="font-serif text-xl font-medium mt-1">Order Inspection: {viewingOrder.id}</h3>
                  </div>

                  {/* Customer Spec */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Patron Client</span>
                      <p className="text-gray-200 mt-1">{viewingOrder.customerName}</p>
                      <p className="text-gray-400 font-mono text-[10px]">{viewingOrder.customerEmail}</p>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Escrow Gateway</span>
                      <p className="text-[#C5A05A] mt-1 font-mono uppercase text-[10px]">{viewingOrder.gateway || "Paystack"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Atelier Destination Address</span>
                      <p className="text-gray-300 mt-1">{viewingOrder.shippingAddress || "Complimentary Private Courier pickup"}</p>
                    </div>
                  </div>

                  {/* Ordered Items list */}
                  <div className="border-t border-b border-gray-850 py-4 space-y-3">
                    <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono mb-1">Purchased Masterpieces</span>
                    {viewingOrder.items && viewingOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-serif text-gray-200">{item.product?.name || item.productName}</p>
                          <span className="text-[10px] text-gray-500 font-mono">Color: {item.selectedColor || item.color || "Default"} • Qty: {item.quantity}</span>
                        </div>
                        <span className="font-mono text-white">{formatPrice((item.product?.price || item.price || 0) * item.quantity, storeSettings.baseCurrency)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing manifest summary */}
                  <div className="space-y-1.5 text-xs text-right font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-500">MSRP Subtotal:</span>
                      <span className="text-white">{formatPrice(viewingOrder.subtotal || viewingOrder.total, storeSettings.baseCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">DHL Express Shipping:</span>
                      <span className="text-white">{viewingOrder.shippingCost === 0 ? "FREE" : formatPrice(viewingOrder.shippingCost || 25, storeSettings.baseCurrency)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-800 pt-1.5 text-sm font-bold text-[#C5A05A]">
                      <span>Grand Escrow Total:</span>
                      <span>{formatPrice(viewingOrder.total, storeSettings.baseCurrency)}</span>
                    </div>
                  </div>

                  {/* Order tracking number edit */}
                  <div className="pt-2 border-t border-gray-850 flex items-center space-x-3 text-xs">
                    <div className="flex-grow">
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono mb-1">DHL Airway Bill Tracking Number</label>
                      <input 
                        type="text"
                        value={viewingOrder.trackingNumber || ""}
                        onChange={(e) => handleUpdateOrderStatus(viewingOrder.id, { trackingNumber: e.target.value })}
                        placeholder="e.g. DHL-9922883"
                        className="w-full bg-[#181818] border border-gray-850 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono mb-1">Payment Escrow status</label>
                      <select 
                        value={viewingOrder.paymentStatus || "Paid"}
                        onChange={(e) => handleUpdateOrderStatus(viewingOrder.id, { paymentStatus: e.target.value })}
                        className="bg-[#181818] border border-gray-850 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono font-bold"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Escrow">Escrow</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {/* PDF Receipt Export Action */}
                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        generatePDFReceipt({
                          orderRef: viewingOrder.id || "REF-ORDER",
                          customerName: viewingOrder.customerName || "Patron",
                          customerEmail: viewingOrder.customerEmail || "N/A",
                          customerPhone: viewingOrder.customerPhone || "N/A",
                          shippingAddress: viewingOrder.shippingAddress || "Complimentary DHL Hub Delivery",
                          gateway: viewingOrder.gateway || "Paystack",
                          cart: viewingOrder.items || [],
                          subtotalUSD: viewingOrder.subtotal || viewingOrder.total || 0,
                          shippingCostUSD: viewingOrder.shippingCost ?? 25,
                          totalUSD: viewingOrder.total || 0,
                          currency: storeSettings.baseCurrency,
                          date: viewingOrder.date || viewingOrder.createdAt
                        });
                      }}
                      className="px-3.5 py-2 bg-[#C5A05A]/20 hover:bg-[#C5A05A] text-[#C5A05A] hover:text-black border border-[#C5A05A]/40 rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewingOrder(null)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-mono transition-all cursor-pointer"
                    >
                      Close Inspection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. CLIENT RECORDS CUSTOMER MANAGEMENT */}
        {activeMenu === "customers" && (
          <div className="space-y-8">
            <div className={`p-6 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg`}>
              <div className="mb-6">
                <h3 className="font-serif text-lg font-medium text-white">Artisanal Patrons Profiles</h3>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block mt-0.5">Vetted VIP clients database and transaction history tracking</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-400">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      <th className="py-3">Patron Name</th>
                      <th>Verified Email Address</th>
                      <th>Contact Phone</th>
                      <th>Purchase Count</th>
                      <th>Gross Value Contribution</th>
                      <th>Vetting Status</th>
                      <th>Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/40">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-[#151515]/30 transition-colors">
                        <td className="py-3.5 font-medium text-white">{c.name}</td>
                        <td className="font-mono">{c.email}</td>
                        <td className="font-mono text-gray-400">{c.phone || "Not specified"}</td>
                        <td className="font-mono font-semibold text-gray-300">{c.totalOrders || 1} orders</td>
                        <td className="font-mono text-[#C5A05A] font-bold">{formatPrice(c.totalSpending || 420, storeSettings.baseCurrency)}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            c.accountStatus === "VIP" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                            c.accountStatus === "Suspended" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                            "bg-green-500/10 text-green-400 border border-green-500/20"
                          }`}>
                            {c.accountStatus || "Active"}
                          </span>
                        </td>
                        <td className="font-mono text-gray-500">{new Date(c.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. GLOBAL STORE SETTINGS */}
        {activeMenu === "settings" && (
          <div className="space-y-8">
            <div className={`p-8 rounded-xl border ${isAdminDark ? "bg-[#111111] border-gray-900" : "bg-white border-neutral-200"} shadow-lg relative`}>
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#A5673F] to-[#C5A05A]" />
              
              <div className="mb-6 border-b border-gray-850/50 pb-4">
                <h3 className="font-serif text-xl font-medium text-white">Global Storefront Parameters</h3>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5 block">Configure default brand values, base shipping settings and admin passcode</span>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Brand & Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Atelier Brand Name</label>
                    <input 
                      type="text"
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Corporate Logo URL</label>
                    <input 
                      type="text"
                      value={storeSettings.logoUrl}
                      onChange={(e) => setStoreSettings({ ...storeSettings, logoUrl: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Corporate Contact Email</label>
                    <input 
                      type="email"
                      value={storeSettings.contactEmail}
                      onChange={(e) => setStoreSettings({ ...storeSettings, contactEmail: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Private Line Phone</label>
                    <input 
                      type="text"
                      value={storeSettings.contactPhone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, contactPhone: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white"
                    />
                  </div>
                </div>

                {/* Shipping & Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Default Base Currency</label>
                    <select 
                      value={storeSettings.baseCurrency}
                      onChange={(e) => setStoreSettings({ ...storeSettings, baseCurrency: e.target.value as any })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="GHS">GHS (GH₵)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">DHL Flat Express Shipping Rate (USD)</label>
                    <input 
                      type="number"
                      value={storeSettings.defaultShippingCost}
                      onChange={(e) => setStoreSettings({ ...storeSettings, defaultShippingCost: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Social media links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Facebook Directory</label>
                    <input 
                      type="url"
                      value={storeSettings.socialFacebook}
                      onChange={(e) => setStoreSettings({ ...storeSettings, socialFacebook: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Instagram Atelier</label>
                    <input 
                      type="url"
                      value={storeSettings.socialInstagram}
                      onChange={(e) => setStoreSettings({ ...storeSettings, socialInstagram: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Twitter Account</label>
                    <input 
                      type="url"
                      value={storeSettings.socialTwitter}
                      onChange={(e) => setStoreSettings({ ...storeSettings, socialTwitter: e.target.value })}
                      className="w-full bg-[#181818] border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Secure Passcode Reset */}
                <div className="p-4 bg-amber-500/5 rounded border border-amber-500/20 max-w-sm">
                  <label className="block text-[10px] uppercase tracking-wider text-amber-500 font-bold mb-1">Desk Authentication Passcode</label>
                  <input 
                    type="text"
                    value={storeSettings.adminPassword}
                    onChange={(e) => setStoreSettings({ ...storeSettings, adminPassword: e.target.value })}
                    placeholder="aurelius2026"
                    className="w-full bg-[#181818] border border-gray-850 rounded px-3 py-2 outline-none focus:border-[#C5A05A] text-xs text-white font-mono tracking-wider"
                    required
                  />
                  <span className="text-[9px] text-gray-500 font-light block mt-1">This passcode authenticates control desk sessions globally.</span>
                </div>

                {/* Feedback flags */}
                {settingsSuccess && (
                  <div className="p-3 bg-green-950/20 border border-green-500/30 text-green-400 text-xs rounded flex items-center space-x-2 max-w-md">
                    <CheckCircle className="h-4 w-4" />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                {settingsError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded flex items-center space-x-2 max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>{settingsError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-6 py-3 rounded text-xs uppercase font-bold tracking-widest transition-colors cursor-pointer shadow border border-transparent"
                >
                  Commit Corporate Settings
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
