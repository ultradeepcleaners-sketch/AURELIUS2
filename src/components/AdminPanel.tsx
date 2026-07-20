import React, { useState, useEffect } from "react";
import { 
  DollarSign, ShoppingCart, Users, Sparkles, Flame, Copy, ClipboardCheck, 
  ArrowUpRight, AlertTriangle, RefreshCw, BarChart2, TrendingUp, Lock, 
  Unlock, Plus, Trash2, Database, Upload, FileCode, CheckCircle2, ChevronRight,
  Briefcase, Activity, Check, MapPin, Package, Clock, Edit, FileEdit,
  BookOpen, Wallet, Settings as SettingsIcon, Bell, Send, Globe, ShieldCheck, Eye
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell, CartesianGrid, PieChart, Pie, Legend 
} from "recharts";
import { Product } from "../types";
import { DEFAULT_USER } from "../data";
import { AureliusLogger } from "../utils/AureliusLogger";

// Mock static analytics datasets
const REVENUE_DATA = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5800 },
  { day: "Wed", revenue: 8100 },
  { day: "Thu", revenue: 7500 },
  { day: "Fri", revenue: 11200 },
  { day: "Sat", revenue: 15400 },
  { day: "Sun", revenue: 13900 }
];

const COLLECTION_SALES = [
  { name: "Travel Bags", sales: 24, fill: "#7A4E2D" },
  { name: "Shoes", sales: 18, fill: "#B98B5D" },
  { name: "Accessories", sales: 32, fill: "#C5A05A" }
];

// Compresses an image file on the client side using Canvas to prevent exceeding Firestore 1MB limits.
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
        // Save as jpeg to optimize size compression
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface AdminPanelProps {
  products?: Product[];
  onProductAdded?: (newProduct: Product) => void;
  onProductDeleted?: (id: string) => void;
  onProductUpdated?: (updatedProduct: Product) => void;
}

export default function AdminPanel({ 
  products = [], 
  onProductAdded, 
  onProductDeleted,
  onProductUpdated 
}: AdminPanelProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Sub-navigation tabs
  const [activeTab, setActiveTab] = useState<"products" | "blog" | "reports" | "wallet" | "settings" | "notifications">("products");
  const [activeProductSubTab, setActiveProductSubTab] = useState<"inventory" | "skus" | "importer" | "deployment">("inventory");

  // State variables for Blog Hub
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [isFetchingBlogs, setIsFetchingBlogs] = useState(false);
  const [blogFormTitle, setBlogFormTitle] = useState("");
  const [blogFormCategory, setBlogFormCategory] = useState("Lifestyle");
  const [blogFormContent, setBlogFormContent] = useState("");
  const [blogFormImage, setBlogFormImage] = useState("");
  const [blogFormTags, setBlogFormTags] = useState("");
  const [blogFormExcerpt, setBlogFormExcerpt] = useState("");
  const [blogFormReadTime, setBlogFormReadTime] = useState("");
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogSubmitError, setBlogSubmitError] = useState<string | null>(null);
  const [blogSubmitSuccess, setBlogSubmitSuccess] = useState<string | null>(null);

  // State variables for Settings panel
  const [settingsTaxRate, setSettingsTaxRate] = useState<number>(12);
  const [settingsShippingCost, setSettingsShippingCost] = useState<number>(25);
  const [settingsVatThreshold, setSettingsVatThreshold] = useState<number>(150);
  const [settingsShowStockAlerts, setSettingsShowStockAlerts] = useState<boolean>(true);
  const [settingsGeminiModel, setSettingsGeminiModel] = useState<string>("gemini-2.5-pro");
  const [settingsVipMultiplier, setSettingsVipMultiplier] = useState<number>(1.5);
  const [settingsApiToken, setSettingsApiToken] = useState<string>("aur-live-9ad8fe47-375b-4b69");
  const [settingsWebhookUrl, setSettingsWebhookUrl] = useState<string>("https://api.aurelius.it/webhooks/orders");

  // State variables for Notifications panel
  const [adminNotifications, setAdminNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("aurelius_admin_notifications");
    return saved ? JSON.parse(saved) : [
      { id: "notif-1", title: "Tannery Stock Warning", text: "Aurelius Overlander Weekend Bag is below critical threshold (5 remaining).", level: "warning", date: "July 19, 2026", read: false },
      { id: "notif-2", title: "Sovereign Series Backorder", text: "Sovereign Oxford size 42 has 4 active VIP client requests on waitlist.", level: "info", date: "July 18, 2026", read: false },
      { id: "notif-3", title: "AliExpress Sync Succeeded", text: "AI Translation model synchronized Heritage Wallet. Imported 12 stock units.", level: "success", date: "July 17, 2026", read: true },
      { id: "notif-4", title: "Google Cloud Spanner Active", text: "Durable database synchronization is healthy. Sync latency: 12ms.", level: "success", date: "July 16, 2026", read: true }
    ];
  });
  const [newNotifTitle, setNewNotifTitle] = useState("");
  const [newNotifText, setNewNotifText] = useState("");
  const [newNotifLevel, setNewNotifLevel] = useState<"info" | "warning" | "success">("info");

  // Wallet Treasury states
  const [walletBalance, setWalletBalance] = useState<number>(142580.00);
  const [walletEscrow, setWalletEscrow] = useState<number>(12400.00);
  const [walletCurrency, setWalletCurrency] = useState<string>("USD");
  const [walletPayouts, setWalletPayouts] = useState<any[]>([
    { id: "payout-1", date: "July 15, 2026", amount: 45000, status: "Settled", destination: "Florence Craftsmanship Cooperatives" },
    { id: "payout-2", date: "July 10, 2026", amount: 28500, status: "Settled", destination: "Siena Luxury Leather Co." },
    { id: "payout-3", date: "July 01, 2026", amount: 32000, status: "Settled", destination: "Pisa Hardware Casting s.r.l" },
    { id: "payout-4", date: "July 19, 2026", amount: 15200, status: "Processing", destination: "Rome Logistics Spedizioni" }
  ]);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [withdrawalRecipient, setWithdrawalRecipient] = useState<string>("");

  // Dynamic order pipeline tracking
  const [activeOrderStages, setActiveOrderStages] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("aurelius_active_stages");
    return saved ? JSON.parse(saved) : { "AUR-3022": 1, "AUR-9204": 4, "AUR-8113": 4 };
  });

  const handleUpdateOrderStage = (orderId: string, stageNum: number) => {
    const nextStages = { ...activeOrderStages, [orderId]: stageNum };
    setActiveOrderStages(nextStages);
    localStorage.setItem("aurelius_active_stages", JSON.stringify(nextStages));
  };

  // AI Copywriter states
  const [prodName, setProdName] = useState("");
  const [prodCat, setProdCat] = useState("Travel Bags");
  const [prodFeatures, setProdFeatures] = useState("");
  const [prodTone, setProdTone] = useState("luxurious");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [copiedAI, setCopiedAI] = useState(false);

  // Form states for creating / editing products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formCategory, setFormCategory] = useState<"bags" | "shoes" | "accessories">("bags");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInStock, setFormInStock] = useState("10");
  const [formDimensions, setFormDimensions] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formCare, setFormCare] = useState("");
  const [formFeatures, setFormFeatures] = useState("");
  const [formVariantColors, setFormVariantColors] = useState("");
  const [formVariantColorsHex, setFormVariantColorsHex] = useState("");

  // SKU Management states inside the form
  interface SkuFormState {
    sku: string;
    color: string;
    inStock: number;
  }
  const [formSkus, setFormSkus] = useState<SkuFormState[]>([]);

  // SKU view search and filter states
  const [skuSearch, setSkuSearch] = useState("");
  const [skuCategoryFilter, setSkuCategoryFilter] = useState<"all" | "bags" | "shoes" | "accessories">("all");
  const [skuStockFilter, setSkuStockFilter] = useState<"all" | "low" | "out">("all");
  
  // Tracking status of active SKU updates
  const [skuSaveStatus, setSkuSaveStatus] = useState<Record<string, "saved" | "error" | "saving">>({});

  // Multi-image upload states (up to 10 files)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Single video upload states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Preservation states for existing assets when editing
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideo, setExistingVideo] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Product Hub / AliExpress Importer states
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importedProduct, setImportedProduct] = useState<Product | null>(null);

  // Copy to clipboard helpers
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedPHP, setCopiedPHP] = useState(false);

  // Low stock mock items
  const lowStockItems = [
    { id: "overlander-weekend", name: "Aurelius Overlander Weekend Bag", qty: 5 },
    { id: "aviator-watch", name: "Aurelius Aviator Watch", qty: 8 },
    { id: "chelsea-boot", name: "Aurelius Chelsea Boot", qty: 9 }
  ];

  // SQL code to export
  const SQL_CODE = `CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`image_path\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  // Secure PHP upload code to export
  const PHP_CODE = `<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'your_cpanel_db_user');
define('DB_PASS', 'your_cpanel_db_password');
define('DB_NAME', 'your_cpanel_db_name');

$message = '';
$messageType = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Secure input sanitization and validation
    $title = filter_input(INPUT_POST, 'title', FILTER_SANITIZE_SPECIAL_CHARS);
    $price = filter_input(INPUT_POST, 'price', FILTER_VALIDATE_FLOAT);
    $description = filter_input(INPUT_POST, 'description', FILTER_SANITIZE_SPECIAL_CHARS);

    if (empty($title) || $price === false || empty($description)) {
        $message = "Error: Invalid or missing text fields.";
        $messageType = "error";
    } else {
        // 2. Secure file upload handling
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['image']['tmp_name'];
            $fileName = $_FILES['image']['name'];
            $fileSize = $_FILES['image']['size'];
            $fileType = $_FILES['image']['type'];
            
            // Extract file extension and validate
            $fileNameCmps = explode(".", $fileName);
            $fileExtension = strtolower(end($fileNameCmps));
            
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
            $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            
            // Verify extension and real mime type (prevents PHP shell upload)
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $fileTmpPath);
            finfo_close($finfo);

            if (in_array($fileExtension, $allowedExtensions) && in_array($mimeType, $allowedMimeTypes)) {
                // Limit file size to 5MB
                if ($fileSize < 5 * 1024 * 1024) {
                    // Create unique file name to prevent collision
                    $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
                    
                    // Create upload directory if not exists
                    $uploadFileDir = './uploads/';
                    if (!is_dir($uploadFileDir)) {
                        mkdir($uploadFileDir, 0755, true);
                    }
                    
                    $dest_path = $uploadFileDir . $newFileName;
                    
                    if (move_uploaded_file($fileTmpPath, $dest_path)) {
                        // 3. Insert securely using PDO with prepared statements
                        try {
                            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                            $options = [
                                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                                PDO::ATTR_EMULATE_PREPARES   => false,
                            ];
                            
                            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                            
                            $sql = "INSERT INTO products (title, price, description, image_path) VALUES (:title, :price, :description, :image_path)";
                            $stmt = $pdo->prepare($sql);
                            
                            $stmt->execute([
                                ':title' => $title,
                                ':price' => $price,
                                ':description' => $description,
                                ':image_path' => $dest_path
                            ]);
                            
                            $message = "Masterpiece successfully uploaded and saved into cPanel MySQL Database!";
                            $messageType = "success";
                        } catch (PDOException $e) {
                            $message = "Database Error: " . $e->getMessage();
                            $messageType = "error";
                        }
                    } else {
                        $message = "Error: There was an issue moving the file to the uploads directory.";
                        $messageType = "error";
                    }
                } else {
                    $message = "Error: File size exceeds the 5MB limit.";
                    $messageType = "error";
                }
            } else {
                $message = "Error: Uploaded file is not a valid image. Only JPG, PNG, and WEBP allowed.";
                $messageType = "error";
            }
        } else {
            $message = "Error: Image file is required or upload error occurred.";
            $messageType = "error";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurelius Atelier - cPanel Upload Portal</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #111; color: #fff; padding: 40px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 30px; border-radius: 8px; border: 1px solid #c5a05a; }
        h1 { font-size: 24px; color: #c5a05a; text-transform: uppercase; margin-top: 0; text-align: center; }
        .alert { padding: 15px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
        .alert-success { background: #1b4332; border: 1px solid #2d6a4f; color: #d8f3dc; }
        .alert-error { background: #5c1e1e; border: 1px solid #7c2d2d; color: #fcd5d5; }
        label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #aaa; text-transform: uppercase; }
        input[type="text"], input[type="number"], textarea, input[type="file"] {
            width: 100%; padding: 10px; margin-bottom: 20px; background: #111; border: 1px solid #333; border-radius: 4px; color: #fff; box-sizing: border-box;
        }
        button { width: 100%; padding: 12px; background: #c5a05a; border: none; color: #000; font-weight: bold; border-radius: 4px; cursor: pointer; text-transform: uppercase; }
        button:hover { background: #a5673f; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Inventory Upload Portal</h1>
        <?php if (!empty($message)): ?>
            <div class="alert alert-<?php echo $messageType; ?>"><?php echo $message; ?></div>
        <?php endif; ?>
        <form action="" method="POST" enctype="multipart/form-data">
            <label for="title">Product Title</label>
            <input type="text" id="title" name="title" required placeholder="e.g. Aurelius Sovereign Duffel">

            <label for="price">Price ($)</label>
            <input type="number" step="0.01" id="price" name="price" required placeholder="e.g. 295.00">

            <label for="description">Description</label>
            <textarea id="description" name="description" rows="5" required placeholder="Describe materials, leather type, and care..."></textarea>

            <label for="image">Product Image File</label>
            <input type="file" id="image" name="image" accept="image/*" required>

            <button type="submit">Submit Masterpiece</button>
        </form>
    </div>
</body>
</html>`;

  // Authenticate password
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "aurelius2026") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid Security Key. Please verify corporate access credentials.");
    }
  };

  // Call the server-side API to generate copywriting via Gemini
  const handleGenerateDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    setIsGenerating(true);
    setGeneratedDescription("");
    try {
      const response = await fetch("/api/ai/describe-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prodName,
          category: prodCat,
          keyFeatures: prodFeatures,
          tone: prodTone
        })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedDescription(data.description);
      } else {
        throw new Error(data.error || "Failed to generate");
      }
    } catch (err: any) {
      console.error("AI descrip failure:", err);
      setGeneratedDescription(`Atelier Error: Failed to invoke our digital leather scribe.\n\nDetails: ${err.message || "Endpoint error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAI = () => {
    navigator.clipboard.writeText(generatedDescription);
    setCopiedAI(true);
    setTimeout(() => setCopiedAI(false), 3000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_CODE);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const handleCopyPHP = () => {
    navigator.clipboard.writeText(PHP_CODE);
    setCopiedPHP(true);
    setTimeout(() => setCopiedPHP(false), 3000);
  };

  const handleImportAliExpress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) {
      setImportError("Please provide a valid product URL to initiate the AI Catalog Translation.");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    setImportedProduct(null);

    try {
      const response = await fetch("/api/products/import-aliexpress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: importUrl })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportSuccess(result.message || "Product translated and added to catalog successfully!");
        setImportedProduct(result.product || result.data);
        if (onProductAdded && (result.product || result.data)) {
          onProductAdded(result.product || result.data);
        }
        setImportUrl("");
      } else {
        setImportError(result.error || "The AI translation encountered a transient network interruption. Please verify the URL or try again.");
      }
    } catch (err: any) {
      setImportError(err.message || "An unexpected error occurred during import. The catalog core remains secure.");
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch blogs from API or default to static BLOGS
  const fetchBlogs = async () => {
    setIsFetchingBlogs(true);
    try {
      const response = await fetch("/api/blogs");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setBlogsList(result.data);
        } else {
          // If Firestore collection is empty, load static BLOGS as fallback
          const { BLOGS } = await import("../data");
          setBlogsList(BLOGS);
        }
      } else {
        const { BLOGS } = await import("../data");
        setBlogsList(BLOGS);
      }
    } catch (err) {
      console.error("[Aurelius Client Trace] Failed to fetch blogs, using local cache:", err);
      try {
        const { BLOGS } = await import("../data");
        setBlogsList(BLOGS);
      } catch (e) {}
    } finally {
      setIsFetchingBlogs(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Publish or Edit Blog post
  const handlePublishBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlogSubmitError(null);
    setBlogSubmitSuccess(null);

    if (!blogFormTitle || !blogFormCategory || !blogFormContent) {
      setBlogSubmitError("Please fill out all required editorial fields.");
      return;
    }

    const payload = {
      title: blogFormTitle,
      category: blogFormCategory,
      content: blogFormContent,
      excerpt: blogFormExcerpt || blogFormContent.substring(0, 150) + "...",
      image: blogFormImage || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
      readTime: blogFormReadTime || `${Math.max(2, Math.ceil(blogFormContent.split(" ").length / 200))} min read`,
      tags: blogFormTags ? blogFormTags.split(",").map(t => t.trim()) : ["Atelier", "Leathercraft"],
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    };

    try {
      if (editingBlogId) {
        // Edit mode
        const response = await fetch(`/api/blogs/${editingBlogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setBlogSubmitSuccess("Editorial volume updated successfully in the digital archives.");
          setEditingBlogId(null);
          // Refresh
          await fetchBlogs();
          // Reset form
          resetBlogForm();
        } else {
          setBlogSubmitError(result.error || "Failed to update the blog volume.");
        }
      } else {
        // Create mode
        const response = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setBlogSubmitSuccess("New editorial volume published successfully inside the Aurelius Journal.");
          // Refresh
          await fetchBlogs();
          // Reset form
          resetBlogForm();
        } else {
          setBlogSubmitError(result.error || "Failed to publish the blog volume.");
        }
      }
    } catch (err: any) {
      setBlogSubmitError(err.message || "An unexpected error interrupted database communication.");
    }
  };

  const resetBlogForm = () => {
    setBlogFormTitle("");
    setBlogFormCategory("Lifestyle");
    setBlogFormContent("");
    setBlogFormImage("");
    setBlogFormTags("");
    setBlogFormExcerpt("");
    setBlogFormReadTime("");
    setEditingBlogId(null);
  };

  const handleEditBlog = (blog: any) => {
    setBlogFormTitle(blog.title || "");
    setBlogFormCategory(blog.category || "Lifestyle");
    setBlogFormContent(blog.content || "");
    setBlogFormImage(blog.image || "");
    setBlogFormTags(Array.isArray(blog.tags) ? blog.tags.join(", ") : "");
    setBlogFormExcerpt(blog.excerpt || "");
    setBlogFormReadTime(blog.readTime || "");
    setEditingBlogId(blog.id);
    setBlogSubmitError(null);
    setBlogSubmitSuccess(null);

    // Scroll to form anchor
    const formAnchor = document.getElementById("blog-editor-anchor");
    if (formAnchor) {
      formAnchor.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to delete this editorial volume from the Aurelius archives?")) {
      return;
    }
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert("Editorial article purged successfully.");
        await fetchBlogs();
      } else {
        alert(result.error || "Failed to purge the article.");
      }
    } catch (err: any) {
      alert(`Purge failed: ${err.message || "Network error"}`);
    }
  };

  // Create mock broadcast notification
  const handlePublishNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifTitle || !newNotifText) {
      alert("Please supply a notification title and description.");
      return;
    }
    const nextNotif = {
      id: `notif-${Date.now()}`,
      title: newNotifTitle,
      text: newNotifText,
      level: newNotifLevel,
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      read: false
    };

    const updated = [nextNotif, ...adminNotifications];
    setAdminNotifications(updated);
    localStorage.setItem("aurelius_admin_notifications", JSON.stringify(updated));
    setNewNotifTitle("");
    setNewNotifText("");
    alert("Administrative alert broadcasted to the controller system.");
  };

  const handleToggleReadNotification = (id: string) => {
    const updated = adminNotifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    setAdminNotifications(updated);
    localStorage.setItem("aurelius_admin_notifications", JSON.stringify(updated));
  };

  const handleDeleteNotification = (id: string) => {
    const updated = adminNotifications.filter(n => n.id !== id);
    setAdminNotifications(updated);
    localStorage.setItem("aurelius_admin_notifications", JSON.stringify(updated));
  };

  // Settings Save handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Storefront parameters successfully updated and committed to production environment.");
  };

  // Wallet Treasury Transfer
  const handleWalletTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please supply a valid numeric payout amount.");
      return;
    }
    if (amount > walletBalance) {
      alert("Requested payout exceeds the active treasury balance.");
      return;
    }
    if (!withdrawalRecipient) {
      alert("Please specify a verified recipient address or craft cooperative name.");
      return;
    }

    setWalletBalance(prev => prev - amount);
    const nextPayouts = [
      {
        id: `payout-${Date.now()}`,
        date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
        amount,
        status: "Processing",
        destination: withdrawalRecipient
      },
      ...walletPayouts
    ];
    setWalletPayouts(nextPayouts);
    setWithdrawalAmount("");
    setWithdrawalRecipient("");
    alert(`Treasury payout of $${amount.toLocaleString()} has been dispatched to "${withdrawalRecipient}".`);
  };

  // Handle multi-image selection and generate previews (max 10)
  const handleMultiImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      const totalImagesCount = filesArray.length + imageFiles.length + existingImages.length;
      if (totalImagesCount > 10) {
        alert("A luxury catalog entry may display up to 10 masterpiece photographs concurrently.");
        return;
      }

      const nextFiles = [...imageFiles, ...filesArray];
      setImageFiles(nextFiles);

      const nextPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...nextPreviews]);
    }
  };

  const handleRemoveNewImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle single video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleRemoveExistingImage = (imgSrc: string) => {
    setExistingImages(prev => prev.filter(src => src !== imgSrc));
  };

  // Switch form to EDIT mode for a specific product
  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setUploadError(null);
    setUploadSuccess(null);

    // Populate form fields
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormOriginalPrice(p.originalPrice ? p.originalPrice.toString() : "");
    setFormCategory(p.category);
    setFormSubcategory(p.subcategory || "");
    setFormDescription(p.description);
    setFormInStock(p.inStock.toString());
    setFormDimensions(p.dimensions || "");
    setFormWeight(p.weight || "");
    setFormCapacity(p.capacity || "");
    setFormCare(p.careInstructions || "");
    setFormFeatures(p.features ? p.features.join(", ") : "");
    setFormVariantColors(p.variantColors ? p.variantColors.join(", ") : "");
    setFormVariantColorsHex(p.variantColorsHex ? p.variantColorsHex.join(", ") : "");

    // Populate form SKUs
    if (p.skus && p.skus.length > 0) {
      setFormSkus(p.skus);
    } else {
      const colors = p.variantColors && p.variantColors.length > 0 
        ? p.variantColors 
        : ["Classic Amber", "Saddle Tan", "Executive Black"];
      const generated = colors.map((color) => {
        const colorSlug = color.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 3).toUpperCase();
        const prodSlug = p.name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 3).toUpperCase();
        return {
          sku: `AUR-${p.category.toUpperCase().substring(0, 3)}-${prodSlug}-${colorSlug}`,
          color,
          inStock: Math.round(p.inStock / colors.length) || 5
        };
      });
      setFormSkus(generated);
    }

    // Populate existing assets
    setExistingImages(p.images || [p.image]);
    setExistingVideo(p.video || "");

    // Reset newly-selected files
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
    setVideoPreview(null);

    // Scroll up to the form smoothly
    const formEl = document.getElementById("admin-form-anchor");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Cancel edit mode and reset form
  const handleCancelEdit = () => {
    setEditingProduct(null);
    
    // Clear all fields
    setFormName("");
    setFormPrice("");
    setFormOriginalPrice("");
    setFormCategory("bags");
    setFormSubcategory("");
    setFormDescription("");
    setFormInStock("10");
    setFormDimensions("");
    setFormWeight("");
    setFormCapacity("");
    setFormCare("");
    setFormFeatures("");
    setFormVariantColors("");
    setFormVariantColorsHex("");
    setFormSkus([]);

    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
    setVideoPreview(null);
    setExistingImages([]);
    setExistingVideo("");
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleGenerateSkusFromColors = () => {
    const colors = formVariantColors
      ? formVariantColors.split(",").map(c => c.trim()).filter(Boolean)
      : ["Classic Amber", "Saddle Tan", "Executive Black"];
    
    const prodSlug = (formName || "Product").toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 3).toUpperCase();
    const catSlug = formCategory.substring(0, 3).toUpperCase();

    const generated = colors.map((color) => {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 3).toUpperCase();
      return {
        sku: `AUR-${catSlug}-${prodSlug}-${colorSlug}`,
        color,
        inStock: 5
      };
    });
    setFormSkus(generated);
  };

  const handleUpdateSkuStock = async (productId: string, skuCode: string, newQty: number) => {
    const parentProduct = products.find(p => p.id === productId);
    if (!parentProduct) return;

    setSkuSaveStatus(prev => ({ ...prev, [skuCode]: "saving" }));

    // Prepare the updated skus array
    let currentSkus = parentProduct.skus && parentProduct.skus.length > 0 
      ? [...parentProduct.skus] 
      : [];

    if (currentSkus.length === 0) {
      // Build skus array for the first time
      const colors = parentProduct.variantColors && parentProduct.variantColors.length > 0 
        ? parentProduct.variantColors 
        : ["Classic Amber", "Saddle Tan", "Executive Black"];
      currentSkus = colors.map((color) => {
        const colorSlug = color.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 3).toUpperCase();
        const prodSlug = parentProduct.name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 3).toUpperCase();
        const generatedSku = `AUR-${parentProduct.category.toUpperCase().substring(0, 3)}-${prodSlug}-${colorSlug}`;
        return {
          sku: generatedSku,
          color,
          inStock: generatedSku === skuCode ? newQty : 5
        };
      });
    } else {
      // Find and update the existing SKU stock
      currentSkus = currentSkus.map(s => s.sku === skuCode ? { ...s, inStock: newQty } : s);
    }

    try {
      const response = await fetch(`/api/products/${productId}/skus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: currentSkus })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setSkuSaveStatus(prev => ({ ...prev, [skuCode]: "saved" }));
        
        // Construct the updated product object to update local state in React
        const updatedProduct = {
          ...parentProduct,
          skus: currentSkus,
          inStock: currentSkus.reduce((sum, item) => sum + (item.inStock || 0), 0)
        };
        
        if (onProductUpdated) {
          onProductUpdated(updatedProduct);
        }

        // Reset saved status badge after 2 seconds
        setTimeout(() => {
          setSkuSaveStatus(prev => {
            const copy = { ...prev };
            delete copy[skuCode];
            return copy;
          });
        }, 2000);
      } else {
        setSkuSaveStatus(prev => ({ ...prev, [skuCode]: "error" }));
      }
    } catch (err) {
      console.error("Failed to update SKU stock level:", err);
      setSkuSaveStatus(prev => ({ ...prev, [skuCode]: "error" }));
    }
  };

  // Handle uploading or editing product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formName || !formPrice || !formDescription || !formCategory) {
      setUploadError("Please supply all required fields: Name, Price, Description, and Category.");
      return;
    }

    if (!editingProduct && imageFiles.length === 0) {
      setUploadError("Please upload at least one product image to publish your masterpiece.");
      return;
    }

    if (editingProduct && existingImages.length === 0 && imageFiles.length === 0) {
      setUploadError("An active listing requires at least one product image.");
      return;
    }

    setIsUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      // Compress and convert selected files to base64
      const base64Images = await Promise.all(
        imageFiles.map((file) => compressImage(file, 800, 800, 0.7))
      );

      let base64Video = "";
      if (videoFile) {
        if (videoFile.size > 600 * 1024) {
          throw new Error("Video file is too large. Due to database size limits, videos must be under 600 KB.");
        }
        base64Video = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(videoFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      }

      // Compute correct stock as sum of SKU stocks if present
      const finalStock = formSkus.length > 0 
        ? formSkus.reduce((sum, item) => sum + (item.inStock || 0), 0).toString()
        : formInStock;

      // Build payload matching exact database and server expectations
      const payload: Record<string, any> = {
        name: formName,
        price: formPrice,
        category: formCategory,
        subcategory: formSubcategory || "Heritage Craft",
        description: formDescription,
        inStock: finalStock,
        dimensions: formDimensions || "Standard Size",
        weight: formWeight || "1.2 kg",
        capacity: formCapacity || "N/A",
        careInstructions: formCare || "Apply beeswax conditioner annually.",
        features: formFeatures || "Genuine Vegetable-Tanned Full Grain Hide",
        variantColors: formVariantColors,
        variantColorsHex: formVariantColorsHex,
        base64Images,
        base64Video,
        skus: formSkus
      };

      if (formOriginalPrice) {
        payload.originalPrice = formOriginalPrice;
      }

      let reqMethod = "POST";
      let reqUrl = "/api/products";

      if (editingProduct) {
        reqMethod = "PUT";
        reqUrl = `/api/products/${editingProduct.id}`;
        payload.existingImages = existingImages;
        payload.existingVideo = existingVideo;
      }

      // Check and automatically reduce payload size to stay safely under Firestore's 1MB limit
      let payloadSize = JSON.stringify(payload).length;
      console.log(`[Aurelius Client Trace] Initial payload size: ${payloadSize} bytes.`);

      if (payloadSize > 920000) {
        if (imageFiles.length > 0) {
          console.warn(`[Aurelius Client Trace] Payload size exceeds safe Firestore threshold. Re-compressing newly uploaded images at lower resolution...`);
          const superCompressedImages = await Promise.all(
            imageFiles.map((file) => compressImage(file, 500, 500, 0.4))
          );
          payload.base64Images = superCompressedImages;
          payloadSize = JSON.stringify(payload).length;
        }
      }

      if (payloadSize > 920000) {
        if (payload.base64Video) {
          console.warn(`[Aurelius Client Trace] Payload is still too large. Dropping uploaded video to fit database limits.`);
          payload.base64Video = "";
          payloadSize = JSON.stringify(payload).length;
          setUploadError("The video file was automatically removed to keep the product page under cloud database storage limits.");
        }
      }

      if (payloadSize > 920000) {
        if (payload.existingImages && payload.existingImages.length > 4) {
          console.warn(`[Aurelius Client Trace] Payload is still too large. Pruning existing images list to fit database limits.`);
          payload.existingImages = payload.existingImages.slice(0, 4);
          payloadSize = JSON.stringify(payload).length;
        }
      }

      // Since images are uploaded to GCS or local disk and saved as tiny URLs, the Firestore entry remains under 2KB.
      // We allow transit payload up to 15MB for the base64 uploading process.
      if (payloadSize > 15000000) {
        throw new Error(`The listing files are too large (${Math.round(payloadSize / (1024 * 1024))} MB). Please reduce the number of images or upload smaller files.`);
      }

      const response = await fetch(reqUrl, {
        method: reqMethod,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await safeParseJSON(response, { url: reqUrl, method: reqMethod, payload });

      if (response.ok && data.success) {
        if (editingProduct) {
          setUploadSuccess(`Masterpiece "${formName}" updated successfully in Firestore!`);
          if (onProductUpdated) {
            onProductUpdated(data.product);
          }
        } else {
          setUploadSuccess(`Masterpiece "${formName}" added successfully to Firestore Database!`);
          if (onProductAdded) {
            onProductAdded(data.product);
          }
        }

        // Clean up and reset form fields
        handleCancelEdit();
      } else {
        throw new Error(data.error || "Failed to commit product changes to backend.");
      }
    } catch (err: any) {
      console.error("[Aurelius Client Trace] Failed to upload/edit product. Stack trace:", err.stack || err);
      setUploadError(err.message || "An unexpected error occurred during database writing.");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to safely parse and log server response
  const safeParseJSON = async (response: Response, requestDetails?: { url: string; method: string; payload?: any }) => {
    const url = requestDetails?.url || response.url;
    const method = requestDetails?.method || "UNKNOWN";
    const status = response.status;
    const contentType = response.headers.get("content-type") || "";

    console.log(`[Aurelius Client Trace] >>> REQUEST OUTGOING: ${method} ${url}`);
    if (requestDetails?.payload) {
      console.log(`[Aurelius Client Trace] REQUEST PAYLOAD:`, JSON.stringify(requestDetails.payload, null, 2));
    }

    console.log(`[Aurelius Client Trace] <<< RESPONSE INCOMING: ${method} ${url} | Status: ${status} | Content-Type: ${contentType}`);
    
    // Log response headers
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log(`[Aurelius Client Trace] RESPONSE HEADERS:`, JSON.stringify(headersObj, null, 2));

    if (status === 204) {
      console.warn(`[Aurelius Client Trace] Warning: Received 204 No Content. Returning empty success object.`);
      AureliusLogger.logRequestSuccess({
        url,
        method,
        status,
        payload: requestDetails?.payload,
        headers: headersObj,
        responseBody: { success: true, message: "Transaction succeeded with no content." }
      });
      return { success: true, message: "Transaction succeeded with no content." };
    }

    let rawText = "";
    try {
      rawText = await response.text();
      console.log(`[Aurelius Client Trace] RESPONSE BODY (Raw, up to 2000 chars):`, rawText.substring(0, 2000));
    } catch (textErr: any) {
      console.error(`[Aurelius Client Trace] Failed to read response text:`, textErr);
      const errMsg = `Failed to read response body text: ${textErr.message}`;
      AureliusLogger.logRequestError({
        url,
        method,
        status,
        payload: requestDetails?.payload,
        headers: headersObj,
        error: errMsg,
        stack: textErr.stack
      });
      throw textErr;
    }

    if (!rawText || rawText.trim() === "") {
      const errMsg = `Server returned an empty response (Status: ${status}).`;
      AureliusLogger.logRequestError({
        url,
        method,
        status,
        payload: requestDetails?.payload,
        headers: headersObj,
        error: errMsg,
        responseBody: ""
      });
      throw new Error(errMsg);
    }

    if (!contentType.includes("application/json")) {
      const errMsg = `Server returned non-JSON content: "${contentType}" (Status: ${status}).`;
      AureliusLogger.logRequestError({
        url,
        method,
        status,
        payload: requestDetails?.payload,
        headers: headersObj,
        error: errMsg,
        responseBody: rawText
      });
      throw new Error(`${errMsg} Body preview: ${rawText.substring(0, 250)}`);
    }

    try {
      const parsed = JSON.parse(rawText);
      if (status >= 400 || (parsed && parsed.success === false)) {
        AureliusLogger.logRequestError({
          url,
          method,
          status,
          payload: requestDetails?.payload,
          headers: headersObj,
          error: parsed.error || `Server responded with status ${status}`,
          responseBody: parsed
        });
      } else {
        AureliusLogger.logRequestSuccess({
          url,
          method,
          status,
          payload: requestDetails?.payload,
          headers: headersObj,
          responseBody: parsed
        });
      }
      return parsed;
    } catch (err: any) {
      console.error(`[Aurelius Client Trace] JSON Parsing Failed. Stack trace:`, err.stack || err);
      const errMsg = `Failed to parse response as JSON: ${err.message}`;
      AureliusLogger.logRequestError({
        url,
        method,
        status,
        payload: requestDetails?.payload,
        headers: headersObj,
        error: errMsg,
        stack: err.stack,
        responseBody: rawText
      });
      throw new Error(`${errMsg}. Raw body preview: ${rawText.substring(0, 250)}`);
    }
  };

  // Handle deleting a dynamic product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you certain you wish to decommission "${name}"? This action permanently purges it from Firestore.`)) {
      return;
    }

    try {
      const reqUrl = `/api/products/${id}`;
      const response = await fetch(reqUrl, {
        method: "DELETE"
      });

      const data = await safeParseJSON(response, { url: reqUrl, method: "DELETE" });
      if (response.ok && data.success) {
        alert("Masterpiece purged successfully from the digital vault.");
        if (onProductDeleted) {
          onProductDeleted(id);
        }
      } else {
        throw new Error(data.error || "Failed to delete product.");
      }
    } catch (err: any) {
      console.error("[Aurelius Client Trace] Deletion error. Stack trace:", err.stack || err);
      alert(`Purging error: ${err.message || "Failed to complete transaction."}`);
    }
  };

  // Filter custom added products (any product that is not part of the static default catalog)
  const staticCatalogIds = new Set([
    "leathfocus-duffle", "nav-duffle", "overlander-weekend", "exec-briefcase",
    "sovereign-oxford", "nomad-sneaker", "chelsea-boot", "heritage-wallet",
    "aviator-watch", "care-kit"
  ]);
  const customProducts = products.filter((p) => !staticCatalogIds.has(p.id));

  // Lock screen UI
  if (!isAuthenticated) {
    return (
      <div id="admin-security-lock" className="min-h-[80vh] flex items-center justify-center bg-[#111111] px-4 font-sans">
        <div className="max-w-md w-full bg-[#1A1A1A] rounded border border-[#C5A05A]/40 p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/30 flex items-center justify-center text-[#C5A05A]">
            <Lock className="h-7 w-7 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[9px] tracking-[0.35em] text-[#C5A05A] uppercase block">Aurelius Heritage Atelier</span>
            <h1 className="font-serif text-2xl font-medium text-white tracking-tight">OPERATIONAL SECURITY GATEWAY</h1>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              This is a private, password-protected admin terminal. Please supply the corporate key to unlock the inventory ledger, marketing studio, and deployment hub.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter Access Password..."
                className="w-full bg-[#111111] border border-gray-800 rounded px-4 py-3 outline-none text-white focus:border-[#C5A05A] text-center text-sm font-mono tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="absolute right-3.5 top-3 text-gray-600 text-[10px] font-mono select-none">
                Hint: aurelius2026
              </span>
            </div>

            {authError && (
              <p className="text-[11px] text-red-400 font-medium font-mono bg-red-950/20 border border-red-900/30 p-2 rounded">
                ⚠️ {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-3 uppercase tracking-widest font-semibold rounded text-[10.5px] transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Unlock Operational Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPassword("aurelius2026");
                setIsAuthenticated(true);
              }}
              className="w-full bg-[#222222] hover:bg-[#2F241F] text-[#C5A05A] border border-[#C5A05A]/35 py-3 uppercase tracking-widest font-semibold rounded text-[10.5px] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C5A05A] animate-pulse" />
              <span>Instant Demo Bypass Access</span>
            </button>
          </form>

          <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">
            ESTABLISHED Florence, Italy • SECURED SSL 256
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-panel-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans text-xs sm:text-sm">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6 mb-8">
        <div>
          <span className="font-mono text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block mb-1">Administrative Master Suite</span>
          <h1 className="font-serif text-2xl sm:text-3.5xl font-medium tracking-tight text-white uppercase">Atelier Controller Portal</h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-[#111111]/90 border border-gray-800 rounded p-1 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3 py-1.5 rounded uppercase font-mono text-[10px] tracking-wider transition-colors ${
              activeTab === "products" ? "bg-[#C5A05A] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => {
              setActiveTab("blog");
              fetchBlogs();
            }}
            className={`px-3 py-1.5 rounded uppercase font-mono text-[10px] tracking-wider transition-colors ${
              activeTab === "blog" ? "bg-[#C5A05A] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Blog
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1.5 rounded uppercase font-mono text-[10px] tracking-wider transition-colors ${
              activeTab === "reports" ? "bg-[#C5A05A] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`px-3 py-1.5 rounded uppercase font-mono text-[10px] tracking-wider transition-colors ${
              activeTab === "wallet" ? "bg-[#C5A05A] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded uppercase font-mono text-[10px] tracking-wider transition-colors ${
              activeTab === "settings" ? "bg-[#C5A05A] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3 py-1.5 rounded uppercase font-mono text-[10px] tracking-wider transition-colors relative ${
              activeTab === "notifications" ? "bg-[#C5A05A] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Notifications
            {adminNotifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* RENDER ANALYTICS TAB AS REPORTS */}
      {activeTab === "reports" && (
        <>
          {/* Grid: High-level KPI widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            
            {/* Revenue */}
            <div className="bg-[#111111] text-white border border-[#C5A05A]/25 p-5 rounded flex justify-between items-center relative overflow-hidden">
              <div>
                <span className="text-[10px] tracking-widest text-[#C5A05A] uppercase block mb-1">Weekly Gross Revenue</span>
                <span className="font-mono text-xl sm:text-2xl font-bold">$71,800.00</span>
                <p className="text-[10.5px] text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +14.8% from last week
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-white/10" />
            </div>

            {/* Orders */}
            <div className="bg-[#1A1A1A] border border-gray-800 p-5 rounded flex justify-between items-center shadow-md text-white">
              <div>
                <span className="text-[10px] tracking-widest text-gray-400 uppercase block mb-1">Unboxed Orders</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#FCFCFA]">158 Units</span>
                <p className="text-[10.5px] text-gray-400 mt-1">Pending allocation: 4 bags</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-neutral-700" />
            </div>

            {/* Active VIP client count */}
            <div className="bg-[#1A1A1A] border border-gray-800 p-5 rounded flex justify-between items-center shadow-md text-white">
              <div>
                <span className="text-[10px] tracking-widest text-gray-400 uppercase block mb-1">Registered VIP Clients</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#FCFCFA]">1,420 Executive</span>
                <p className="text-[10.5px] text-[#C5A05A] mt-1">94 Platinum status tier</p>
              </div>
              <Users className="h-10 w-10 text-neutral-700" />
            </div>

            {/* Active conversion checks */}
            <div className="bg-red-950/20 border border-red-900/40 p-5 rounded flex justify-between items-center">
              <div>
                <span className="text-[10px] tracking-widest text-red-400 uppercase block mb-1">Critical Stock Warnings</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-red-200">{lowStockItems.length} SKUs</span>
                <p className="text-[10.5px] text-red-300 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires rapid tannery restocking
                </p>
              </div>
              <Flame className="h-10 w-10 text-red-900/40" />
            </div>
          </div>

          {/* Brand Health & Dynamic Operations Console */}
          <div className="bg-[#151515] border border-gray-850 rounded-lg p-6 mb-10 space-y-8">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-[#C5A05A] animate-pulse" />
                <span className="font-mono text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block">Operations Center</span>
              </div>
              <h2 className="font-serif text-lg font-medium text-white uppercase mt-1">Brand Health & Executive Metrics</h2>
              <p className="text-xs text-gray-400 mt-1 font-light">
                Monitor asset capital allocation, consumer category interest, and active workshop bottlenecks.
              </p>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Metric 1: Total Stock Value */}
              <div className="bg-[#1A1A1A] border border-gray-800 p-5 rounded relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] tracking-widest text-gray-400 uppercase block mb-1">Total Stock Value</span>
                  <span className="font-mono text-2xl font-bold text-white block mt-1">
                    ${products.reduce((acc, p) => acc + (p.price * (p.inStock !== undefined ? p.inStock : 10)), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">Based on {products.length} registered SKUs</span>
                  <span className="text-[9px] bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/35 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                    Active Capital
                  </span>
                </div>
              </div>

              {/* Metric 2: Most Popular Category */}
              <div className="bg-[#1A1A1A] border border-gray-800 p-5 rounded relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] tracking-widest text-gray-400 uppercase block mb-1">Most Popular Category</span>
                  <span className="font-serif text-lg font-semibold text-[#C5A05A] block mt-1">
                    {COLLECTION_SALES.reduce((prev, current) => (prev.sales > current.sales) ? prev : current).name}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Top share: {COLLECTION_SALES.reduce((prev, current) => (prev.sales > current.sales) ? prev : current).sales} premium sales
                  </span>
                  <span className="text-[9px] bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/35 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                    Highest Volume
                  </span>
                </div>
              </div>

              {/* Metric 3: Pending Order Count */}
              <div className="bg-[#1A1A1A] border border-gray-800 p-5 rounded relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="text-[10px] tracking-widest text-gray-400 uppercase block mb-1">Pending Order Count</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-2xl font-bold text-white">
                      {["AUR-3022", "AUR-9204", "AUR-8113"].filter(id => (activeOrderStages[id] !== undefined ? activeOrderStages[id] : 1) < 4).length}
                    </span>
                    {["AUR-3022", "AUR-9204", "AUR-8113"].filter(id => (activeOrderStages[id] !== undefined ? activeOrderStages[id] : 1) < 4).length > 0 && (
                      <span className="h-2.5 w-2.5 bg-amber-500 rounded-full animate-pulse animate-duration-1000" />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">Active commissions in workshop</span>
                  <span className="text-[9px] bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/35 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                    In Production
                  </span>
                </div>
              </div>

            </div>

            {/* Simple Bar & Pie Charts Grid for Brand Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Asset Capital allocation by Category (Bar Chart) (Span 6) */}
              <div className="lg:col-span-6 bg-[#111111] border border-gray-800 rounded p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-xs font-semibold text-white uppercase tracking-wider">Asset Capital Allocation (Stock Value)</h3>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Live catalog data</span>
                </div>
                
                <div className="h-48 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { 
                          name: "Bags", 
                          value: products.filter(p => p.category === "bags").reduce((sum, p) => sum + (p.price * (p.inStock !== undefined ? p.inStock : 10)), 0),
                          fill: "#7A4E2D" 
                        },
                        { 
                          name: "Shoes", 
                          value: products.filter(p => p.category === "shoes").reduce((sum, p) => sum + (p.price * (p.inStock !== undefined ? p.inStock : 10)), 0),
                          fill: "#B98B5D" 
                        },
                        { 
                          name: "Accessories", 
                          value: products.filter(p => p.category === "accessories").reduce((sum, p) => sum + (p.price * (p.inStock !== undefined ? p.inStock : 10)), 0),
                          fill: "#C5A05A" 
                        },
                      ]} 
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke="#555" fontSize={10} />
                      <YAxis stroke="#555" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#111", borderColor: "#C5A05A", color: "#fff" }} 
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, "Stock Capital Value"]} 
                      />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {[
                          { name: "Bags", fill: "#7A4E2D" },
                          { name: "Shoes", fill: "#B98B5D" },
                          { name: "Accessories", fill: "#C5A05A" }
                        ].map((entry, idx) => (
                          <Cell key={`cell-dyn-${idx}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: Category Demand Share (Pie Chart) (Span 6) */}
              <div className="lg:col-span-6 bg-[#111111] border border-gray-800 rounded p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-xs font-semibold text-white uppercase tracking-wider">Category Sales Demand Share</h3>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Volume distribution</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                  <div className="h-40 w-40 text-xs relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={COLLECTION_SALES.map(item => ({
                            name: item.name,
                            value: item.sales,
                            fill: item.fill
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {COLLECTION_SALES.map((entry, index) => (
                            <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#111", borderColor: "#C5A05A", color: "#fff" }} 
                          formatter={(value) => [`${value} items sold`, "Popularity Share"]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Total Sales</span>
                      <span className="font-mono text-base font-bold text-white">
                        {COLLECTION_SALES.reduce((sum, item) => sum + item.sales, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-[10px] font-mono text-gray-400 w-full sm:w-auto">
                    {COLLECTION_SALES.map((item, idx) => {
                      const totalSales = COLLECTION_SALES.reduce((sum, i) => sum + i.sales, 0);
                      const percentage = Math.round((item.sales / totalSales) * 100);
                      return (
                        <div key={idx} className="flex items-center justify-between sm:justify-start sm:space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-white font-medium">{item.name}</span>
                          </div>
                          <span>{percentage}% ({item.sales} sold)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive Operations Pipeline Steward */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-5">
              <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-[#C5A05A]" />
                  <h3 className="font-serif text-sm font-semibold text-white">Workshop Tracking Pipeline Control</h3>
                </div>
                <span className="text-[10px] font-mono text-[#C5A05A] uppercase tracking-wider">Live Simulator</span>
              </div>

              <p className="text-xs text-gray-400 mb-5 leading-relaxed font-light font-sans">
                As an administrator, you have permission to advance active custom commissions through the five stages of production and delivery. Changing these values instantly updates the client's private dashboard.
              </p>

              <div className="space-y-4">
                {[
                  { id: "AUR-3022", name: "Aurelius Travel Bag Commission", defaultVal: "Vintage Brown" },
                  { id: "AUR-9204", name: "Aurelius Navigator Duffel", defaultVal: "Saddle Brown" },
                  { id: "AUR-8113", name: "Aurelius Leather Nomad Sneakers", defaultVal: "Warm White" }
                ].map((order, idx) => {
                  const currentStage = activeOrderStages[order.id] !== undefined ? activeOrderStages[order.id] : 1;
                  const stagesList = [
                    "Tannery Processing",
                    "Artisan Stitching",
                    "Quality Inspection",
                    "Out for Delivery",
                    "Sovereign Handover (Completed)"
                  ];

                  return (
                    <div key={idx} className="bg-[#111] border border-gray-850 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans">
                      <div>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-xs font-bold text-[#C5A05A]">{order.id}</span>
                          <span className="text-[9px] text-gray-500">• {order.defaultVal}</span>
                        </div>
                        <p className="text-xs font-serif font-medium text-white mt-1">{order.name}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <span className="text-[10px] font-mono text-gray-400">Current Pipeline Phase:</span>
                        <select
                          value={currentStage}
                          onChange={(e) => handleUpdateOrderStage(order.id, parseInt(e.target.value))}
                          className="bg-[#222] text-xs text-white border border-gray-800 rounded px-3 py-1.5 focus:outline-none cursor-pointer focus:border-[#C5A05A] font-semibold"
                        >
                          {stagesList.map((stg, i) => (
                            <option key={i} value={i} className="bg-[#111] text-white">
                              Phase {i + 1}: {stg}
                            </option>
                          ))}
                        </select>
                        <span className={`h-2 w-2 rounded-full ${currentStage === 4 ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Grid: Charts (using recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            
            {/* Weekly sales Line chart (Span 8) */}
            <div className="lg:col-span-8 bg-[#1A1A1A] border border-gray-800 rounded p-5 sm:p-6 shadow-md text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-base font-semibold text-white">Weekly Revenue Trajectory ($)</h3>
                <span className="text-[10px] bg-[#111111]/80 border border-gray-800 rounded px-2.5 py-0.5 text-gray-400 font-mono">
                  Live Feed
                </span>
              </div>

              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.6} />
                    <XAxis dataKey="day" stroke="#777" />
                    <YAxis stroke="#777" />
                    <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#C5A05A", color: "#fff" }} formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#C5A05A" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by collection Bar Chart (Span 4) */}
            <div className="lg:col-span-4 bg-[#1A1A1A] border border-gray-800 rounded p-5 sm:p-6 shadow-md text-white">
              <h3 className="font-serif text-base font-semibold text-white mb-6">Collection Performance (SKUs sold)</h3>
              
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={COLLECTION_SALES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#777" />
                    <YAxis stroke="#777" />
                    <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#C5A05A", color: "#fff" }} formatter={(value) => [value, "Items Sold"]} />
                    <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                      {COLLECTION_SALES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Grid: Low Stock Alert & AI product Copywriting Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Low stock alerts & supplier list (Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Stock warnings */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded p-5 shadow-md">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-[#C5A05A]" />
                  <h3 className="font-serif text-base font-semibold text-white">Critical Hide Stock Logs</h3>
                </div>
                
                <div className="space-y-3 font-sans">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-red-950/20 rounded border border-red-900/30">
                      <div>
                        <p className="font-semibold text-white text-xs">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {item.id}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-red-950/50 text-red-300 border border-red-900/40 text-[10px] px-2 py-0.5 rounded font-bold font-mono">
                          {item.qty} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier sync logs */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded p-5 shadow-md">
                <h3 className="font-serif text-base font-semibold text-white mb-3.5">Atelier Supplier Synchronization</h3>
                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Tuscany Vegetable Tannery</span>
                    <span className="text-green-400 font-bold">● Synchronized</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Northampton Cobbler Atelier</span>
                    <span className="text-green-400 font-bold">● Synchronized</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Milan Luxury Leather Accessories</span>
                    <span className="text-[#C5A05A] font-bold animate-pulse">↻ Syncing Drafts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: AI product description studio (Span 7) */}
            <div className="lg:col-span-7 bg-[#222222]/30 border border-[#C5A05A]/30 rounded p-6 shadow-md text-white font-sans">
              
              <div className="flex items-center space-x-2.5 mb-4">
                <Sparkles className="h-5 w-5 text-[#C5A05A]" />
                <h3 className="font-serif text-base font-semibold text-white">AI Copywriting Studio</h3>
              </div>
              
              <p className="text-gray-400 text-xs mb-6 leading-relaxed font-light font-sans">
                Drafting a new product introduction? Provide minimal details to consult our AI copywriter. It outputs luxury, magazine-level marketing copy instantly.
              </p>

              <form onSubmit={handleGenerateDescription} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Leather Item Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                      placeholder="e.g. Aurelius Sovereign Duffel"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Catalog Category</label>
                    <select
                      className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                    >
                      <option value="Travel Bags">Travel Bags</option>
                      <option value="Handmade Shoes">Handmade Shoes</option>
                      <option value="Premium Accessories">Premium Accessories</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Key Hide Features</label>
                    <input
                      type="text"
                      className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                      placeholder="e.g. 2mm Crazy Horse hide, pure brass details"
                      value={prodFeatures}
                      onChange={(e) => setProdFeatures(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Copywriting Voice Tone</label>
                    <select
                      className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                      value={prodTone}
                      onChange={(e) => setProdTone(e.target.value)}
                    >
                      <option value="luxurious">Luxurious & Editorial</option>
                      <option value="heritage">Heritage & Classic</option>
                      <option value="rugged">Rugged Executive</option>
                      <option value="minimalist">Apple-Level Simplicity</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || !prodName.trim()}
                  className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3 uppercase tracking-widest font-semibold rounded text-[10px] transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer border border-transparent font-sans"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isGenerating ? "Drafting Editorial Legacy..." : "Inscribe Luxury Description"}</span>
                </button>
              </form>

              {/* Result Output Card */}
              {generatedDescription && (
                <div className="mt-6 bg-[#111111] border border-[#C5A05A]/40 rounded p-4 relative">
                  <button
                    onClick={handleCopyAI}
                    className="absolute top-4 right-4 p-1.5 rounded bg-[#222222] hover:bg-[#333333] border border-gray-800 text-gray-300 transition-all flex items-center space-x-1"
                    title="Copy to clipboard"
                  >
                    {copiedAI ? (
                      <>
                        <ClipboardCheck className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-[9px] text-green-400 font-bold font-mono">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-mono">Copy Draft</span>
                      </>
                    )}
                  </button>

                  <span className="text-[9px] text-[#C5A05A] font-mono tracking-widest uppercase block mb-3 font-semibold">Generated Copywriting</span>
                  
                  <div className="text-xs text-gray-300 leading-relaxed max-h-56 overflow-y-auto pr-2 whitespace-pre-wrap font-sans">
                    {generatedDescription}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* RENDER PRODUCTS TAB WITH NESTED SUB-TABS */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex border-b border-gray-800 pb-3 mb-6 gap-2 flex-wrap">
            <button
              onClick={() => setActiveProductSubTab("inventory")}
              className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all border-b-2 ${
                activeProductSubTab === "inventory" ? "border-[#C5A05A] text-white font-bold" : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Inventory Management
            </button>
            <button
              onClick={() => setActiveProductSubTab("skus")}
              className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all border-b-2 ${
                activeProductSubTab === "skus" ? "border-[#C5A05A] text-white font-bold" : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              SKU Stock Ledger
            </button>
            <button
              onClick={() => setActiveProductSubTab("importer")}
              className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all border-b-2 ${
                activeProductSubTab === "importer" ? "border-[#C5A05A] text-white font-bold" : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              AI Product Hub
            </button>
            <button
              onClick={() => setActiveProductSubTab("deployment")}
              className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider transition-all border-b-2 ${
                activeProductSubTab === "deployment" ? "border-[#C5A05A] text-white font-bold" : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Deployment & Backups
            </button>
          </div>

          {/* Sub-tab: Inventory Management */}
          {activeProductSubTab === "inventory" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add / Edit Product Form (Span 5) */}
          <div id="admin-form-anchor" className="lg:col-span-5 bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-md text-white font-sans scroll-mt-6">
            <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2.5">
                {editingProduct ? (
                  <FileEdit className="h-5 w-5 text-[#C5A05A]" />
                ) : (
                  <Plus className="h-5 w-5 text-[#C5A05A]" />
                )}
                <h2 className="font-serif text-lg font-medium tracking-tight text-white uppercase">
                  {editingProduct ? "Edit Masterpiece" : "Insert Custom Masterpiece"}
                </h2>
              </div>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#333333] text-[9.5px] tracking-wider uppercase font-mono text-gray-400 hover:text-white transition-all border border-gray-850"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-sans">
              
              <div>
                <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aurelius Valerius Travel Duffel"
                  className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 295.00"
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A] font-mono"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Original Price (Strikeout)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 395.00 (Blank if none)"
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A] font-mono"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A] font-mono"
                    value={formInStock}
                    onChange={(e) => setFormInStock(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Subcategory Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Heritage Briefcase"
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Category Folder *</label>
                  <select
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="bags">Travel Bags Collection</option>
                    <option value="shoes">Handmade Shoes Collection</option>
                    <option value="accessories">Premium Accessories Collection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[9px] font-mono">Product Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Inscribe product materials, leather tanning method, and care details..."
                  className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 outline-none text-white focus:border-[#C5A05A]"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* TECHNICAL SPECS */}
              <div className="bg-[#111111] p-3 rounded border border-gray-800 space-y-3">
                <span className="font-mono text-[9px] tracking-widest uppercase text-[#C5A05A] block">Technical Ledger Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Dimensions (e.g. 45 x 22 x 25 cm)"
                    className="bg-[#1A1A1A] border border-gray-800 rounded p-1.5 outline-none text-white focus:border-[#C5A05A] text-[11px]"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Weight (e.g. 1.5 kg)"
                    className="bg-[#1A1A1A] border border-gray-800 rounded p-1.5 outline-none text-white focus:border-[#C5A05A] text-[11px]"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Capacity (e.g. 30 Litres)"
                    className="bg-[#1A1A1A] border border-gray-800 rounded p-1.5 outline-none text-white focus:border-[#C5A05A] text-[11px]"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Key features (comma separated)"
                    className="bg-[#1A1A1A] border border-gray-800 rounded p-1.5 outline-none text-white focus:border-[#C5A05A] text-[11px]"
                    value={formFeatures}
                    onChange={(e) => setFormFeatures(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Colors (e.g. Classic Amber, Black)"
                    className="bg-[#1A1A1A] border border-gray-800 rounded p-1.5 outline-none text-white focus:border-[#C5A05A] text-[11px]"
                    value={formVariantColors}
                    onChange={(e) => setFormVariantColors(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Colors HEX (e.g. #C5A05A, #111111)"
                    className="bg-[#1A1A1A] border border-gray-800 rounded p-1.5 outline-none text-white focus:border-[#C5A05A] text-[11px]"
                    value={formVariantColorsHex}
                    onChange={(e) => setFormVariantColorsHex(e.target.value)}
                  />
                </div>
              </div>

              {/* INDIVIDUAL SKU MANAGEMENT SECTION */}
              <div className="bg-[#111111] p-3 rounded border border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#C5A05A] block">Individual SKU Ledger</span>
                  <button
                    type="button"
                    onClick={handleGenerateSkusFromColors}
                    className="text-[9px] font-mono tracking-wider text-[#C5A05A] hover:text-white bg-[#C5A05A]/10 border border-[#C5A05A]/25 rounded px-2 py-0.5 uppercase hover:bg-[#C5A05A]/20 transition-all"
                  >
                    Auto-Generate SKUs
                  </button>
                </div>
                
                {formSkus.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-gray-800 rounded bg-[#1A1A1A]/50 text-gray-500 text-[10px]">
                    No SKUs mapped yet. Click "Auto-Generate SKUs" to create variants based on your colors.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formSkus.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-[#1A1A1A] border border-gray-850 rounded">
                        <div className="flex flex-col shrink-0">
                          <span className="text-[10px] font-bold text-white truncate max-w-[110px]">{item.color}</span>
                          <span className="text-[8px] font-mono text-gray-500 uppercase">Variant</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            placeholder="SKU (e.g. AUR-BAG-AMB)"
                            className="w-full bg-[#111111] border border-gray-800 rounded px-2 py-1 text-[10px] outline-none text-white focus:border-[#C5A05A] font-mono"
                            value={item.sku}
                            onChange={(e) => {
                              const updated = [...formSkus];
                              updated[idx] = { ...updated[idx], sku: e.target.value.toUpperCase() };
                              setFormSkus(updated);
                            }}
                          />
                        </div>
                        <div className="w-16 shrink-0 flex items-center bg-[#111111] border border-gray-800 rounded px-1.5 py-0.5">
                          <input
                            type="number"
                            required
                            placeholder="Qty"
                            className="w-full bg-transparent text-[10px] outline-none text-white font-mono text-center"
                            value={item.inStock}
                            onChange={(e) => {
                              const updated = [...formSkus];
                              updated[idx] = { ...updated[idx], inStock: parseInt(e.target.value) || 0 };
                              setFormSkus(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-[9px] text-gray-500 font-mono text-center">
                      Combined total stock: <span className="text-white font-bold">{formSkus.reduce((sum, item) => sum + (item.inStock || 0), 0)} units</span>
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC MULTI-IMAGE UPLOAD (MAX 10) */}
              <div className="bg-[#111111] p-3 rounded border border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[#C5A05A] font-mono text-[9px] tracking-widest uppercase">Masterpiece Photographs (Up to 10) *</label>
                  <span className="text-[9px] font-mono text-gray-500">
                    {existingImages.length + imageFiles.length}/10 selected
                  </span>
                </div>

                {/* Previews of Existing Images when Editing */}
                {existingImages.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-gray-500 uppercase font-mono">Preserved Catalog Assets:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {existingImages.map((src, index) => (
                        <div key={index} className="relative group aspect-square rounded overflow-hidden border border-gray-800 bg-[#1A1A1A]">
                          <img src={src} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(src)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previews of Newly Selected Images */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-green-400 uppercase font-mono">Staged to upload:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="relative group aspect-square rounded overflow-hidden border border-gray-800 bg-[#1A1A1A]">
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Drop/Input Trigger */}
                {(existingImages.length + imageFiles.length < 10) && (
                  <div className="border border-dashed border-gray-800 hover:border-[#C5A05A]/50 rounded bg-[#1A1A1A] p-3 text-center cursor-pointer transition-all relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultiImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="py-1">
                      <Upload className="mx-auto h-5 w-5 text-gray-500" />
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Click to select product photos</p>
                      <p className="text-[8px] text-gray-600 font-mono">JPEG, PNG, WEBP • Max 10 images concurrently</p>
                    </div>
                  </div>
                )}
              </div>

              {/* MASTERPIECE VIDEO PREVIEW */}
              <div className="bg-[#111111] p-3 rounded border border-gray-800 space-y-3">
                <label className="block text-[#C5A05A] font-mono text-[9px] tracking-widest uppercase">Artisan Studio Video Preview</label>
                
                {/* Existing Video asset representation */}
                {!videoPreview && existingVideo && (
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-gray-850">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-[#C5A05A] animate-pulse" />
                      <span className="text-[10px] text-gray-300 font-mono">Preserved: Video loop active</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExistingVideo("")}
                      className="text-red-400 hover:text-red-300 uppercase tracking-wider text-[9px] font-mono font-bold"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {/* Newly selected video preview */}
                {videoPreview && (
                  <div className="space-y-2">
                    <video src={videoPreview} controls className="w-full h-24 rounded border border-gray-850 bg-black" />
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] text-green-400 font-mono truncate max-w-[70%]">{videoFile?.name}</p>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="text-red-400 hover:text-red-300 font-mono text-[9px] uppercase font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Video Selection Input */}
                {!videoPreview && !existingVideo && (
                  <div className="border border-dashed border-gray-800 hover:border-[#C5A05A]/50 rounded bg-[#1A1A1A] p-3 text-center cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="py-1">
                      <Upload className="mx-auto h-5 w-5 text-gray-500" />
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Click to select showcase video</p>
                      <p className="text-[8px] text-gray-600 font-mono">MP4, MOV, WEBM (Max 50MB limits)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status feedback */}
              {uploadError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 rounded font-mono text-[10px]">
                  ⚠️ Error: {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-900/30 text-green-300 rounded font-mono text-[10px] flex items-start space-x-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3 uppercase tracking-widest font-semibold rounded text-[10px] transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer border border-transparent font-sans"
              >
                {editingProduct ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    <span>{isUploading ? "Updating catalog entries..." : "Apply Masterpiece Changes"}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>{isUploading ? "Uploading & Writing to Firestore..." : "Log Product to Database"}</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Manage Products List (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-md text-white font-sans">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-[#C5A05A]" />
                  <h2 className="font-serif text-lg font-medium tracking-tight text-white uppercase">Vault-Stored Products</h2>
                </div>
                <span className="font-mono text-[10px] bg-[#111111]/80 border border-gray-800 rounded px-2.5 py-0.5 text-[#C5A05A]">
                  {customProducts.length} custom SKUs
                </span>
              </div>

              {customProducts.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-800 rounded bg-[#111111]/50 font-sans">
                  <Database className="mx-auto h-8 w-8 text-neutral-600 mb-3" />
                  <p className="font-serif text-sm font-semibold text-gray-400">No dynamic database items logged yet</p>
                  <p className="text-[10px] text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Insert products via the form on the left. They will be saved securely to Firestore and live-inserted into the catalog!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] uppercase text-gray-400 font-mono">
                        <th className="pb-3">Masterpiece</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 font-sans">
                      {customProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-900/40">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center space-x-3">
                              <img src={p.image} className="w-9 h-9 object-cover rounded border border-gray-800 shadow" alt={p.name} referrerPolicy="no-referrer" />
                              <div className="max-w-44 sm:max-w-xs truncate">
                                <span className="font-semibold text-white text-[12px] block truncate">{p.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono truncate block">ID: {p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 capitalize text-gray-300 font-mono text-[10.5px]">
                            {p.category}
                          </td>
                          <td className="py-3.5 text-white font-mono font-semibold">
                            ${p.price.toFixed(2)}
                          </td>
                          <td className="py-3.5 text-right space-x-1">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="p-1.5 text-[#C5A05A] hover:text-white hover:bg-[#C5A05A]/10 rounded border border-transparent hover:border-[#C5A05A]/35 transition-all cursor-pointer inline-flex items-center"
                              title="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 text-red-400 hover:text-white hover:bg-red-950/60 rounded border border-transparent hover:border-red-900/30 transition-all cursor-pointer inline-flex items-center"
                              title="Delete product from database"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* General Database Sync info box */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-5 flex items-start space-x-4">
              <div className="p-2.5 rounded bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/20 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1 font-sans">
                <h4 className="font-semibold text-white text-xs">Live Synchronization Engine Active</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                  Aurelius database controllers are listening live on Firestore. Adding products through this secure terminal automatically updates the catalog, lookbooks, search queries, and inventory grids for all active visitors worldwide in under 200 milliseconds.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sub-tab: SKU Stock Ledger */}
      {activeProductSubTab === "skus" && (
        <div className="space-y-6 text-white">
          <div className="bg-[#111111] border border-gray-800 rounded p-6 shadow-md">
            <h2 className="font-serif text-lg text-white uppercase tracking-tight mb-2">SKU STOCK LEDGER</h2>
            <p className="text-gray-400 text-xs font-light max-w-3xl mb-6">
              Manage product variations and SKU-level inventory directly inside the Firestore real-time ledger. Click Save to dispatch a PUT request to synchronise physical inventory across all digital channels.
            </p>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-[10px] tracking-wider font-mono text-[#C5A05A] uppercase block mb-1">Search Products / SKUs</label>
                <input
                  type="text"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder="e.g. Overlander, AUR-BAG..."
                  className="w-full bg-[#1A1A1A] border border-gray-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C5A05A] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-wider font-mono text-[#C5A05A] uppercase block mb-1">Category Filter</label>
                <select
                  value={skuCategoryFilter}
                  onChange={(e: any) => setSkuCategoryFilter(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C5A05A]"
                >
                  <option value="all">All Curated Categories</option>
                  <option value="Travel Bags">Travel Bags</option>
                  <option value="Shoes">Curated Shoes</option>
                  <option value="Accessories">Heritage Accessories</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] tracking-wider font-mono text-[#C5A05A] uppercase block mb-1">Stock Level Alert</label>
                <select
                  value={skuStockFilter}
                  onChange={(e: any) => setSkuStockFilter(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C5A05A]"
                >
                  <option value="all">All Variations</option>
                  <option value="low">Critical Low Stock (&lt; 10 units)</option>
                  <option value="out">Depleted / Sold Out (0 units)</option>
                </select>
              </div>
            </div>

            {/* Ledger Listing */}
            <div className="space-y-6">
              {products
                .filter(p => {
                  if (skuCategoryFilter !== "all" && p.category !== skuCategoryFilter) return false;
                  
                  // Filter by search query
                  const matchesSearch = p.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(skuSearch.toLowerCase()) ||
                    (p.skus && p.skus.some((s: any) => s.sku.toLowerCase().includes(skuSearch.toLowerCase())));
                  
                  if (!matchesSearch) return false;

                  // Filter by stock level
                  if (skuStockFilter === "low") {
                    return p.skus && p.skus.some((s: any) => s.inStock < 10);
                  }
                  if (skuStockFilter === "out") {
                    return p.skus && p.skus.some((s: any) => s.inStock === 0);
                  }

                  return true;
                })
                .map((product) => {
                  const pSkus = product.skus || [];
                  return (
                    <div key={product.id} className="border border-gray-850 rounded bg-[#161616] p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-850 pb-3 mb-4">
                        <div>
                          <span className="font-mono text-[9px] tracking-widest text-[#C5A05A] uppercase block">{product.category}</span>
                          <h3 className="font-serif text-sm text-white font-medium uppercase tracking-tight">{product.name}</h3>
                        </div>
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="text-gray-400 font-light">
                            Total Units: <strong className="text-white font-mono">{product.inStock || 0}</strong>
                          </span>
                        </div>
                      </div>

                      {pSkus.length === 0 ? (
                        <div className="py-4 text-center">
                          <p className="text-gray-500 text-xs mb-3 font-light">No SKU variation records found for this masterpiece.</p>
                          <button
                            onClick={async () => {
                              // Auto-generate SKUs
                              const catSlug = product.category.toUpperCase().substring(0, 3);
                              const prodSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 10);
                              const colors = product.variantColors && product.variantColors.length > 0 
                                ? product.variantColors 
                                : ["Masterpiece Black"];
                              
                              const generated = colors.map((color: string) => {
                                const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 10);
                                return {
                                  sku: `AUR-${catSlug}-${prodSlug}-${colorSlug}`,
                                  color,
                                  inStock: 15
                                };
                              });

                              try {
                                const response = await fetch(`/api/products/${product.id}/skus`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ skus: generated })
                                });
                                const result = await response.json();
                                if (response.ok && result.success) {
                                  alert(`Successfully auto-generated and saved ${generated.length} SKU nodes for this entry.`);
                                  if (onProductUpdated) onProductUpdated(result.data || result.product);
                                } else {
                                  alert(result.error || "Failed to save SKU configurations.");
                                }
                              } catch (err: any) {
                                alert(`Failed to configure SKUs: ${err.message}`);
                              }
                            }}
                            className="px-3 py-1.5 rounded bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/30 hover:bg-[#C5A05A] hover:text-black transition-all text-[10px] tracking-wider uppercase font-mono"
                          >
                            Auto-Generate SKU Nodes
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-850">
                                <th className="pb-2 text-[9px] tracking-widest text-gray-500 uppercase font-mono">SKU Code</th>
                                <th className="pb-2 text-[9px] tracking-widest text-gray-500 uppercase font-mono">Attributes</th>
                                <th className="pb-2 text-[9px] tracking-widest text-gray-500 uppercase font-mono">Stock Level</th>
                                <th className="pb-2 text-[9px] tracking-widest text-gray-500 uppercase font-mono text-right">Ledger Adjustments</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pSkus.map((skuItem: any, index: number) => {
                                const saveStatus = skuSaveStatus[skuItem.sku];
                                return (
                                  <tr key={index} className="border-b border-gray-900/50 hover:bg-white/[0.01]">
                                    <td className="py-3 font-mono text-[11px] text-[#C5A05A] tracking-wider font-bold">
                                      {skuItem.sku}
                                    </td>
                                    <td className="py-3 text-xs text-gray-300 font-light font-mono">
                                      {skuItem.color || "Default"}
                                    </td>
                                    <td className="py-3">
                                      <div className="flex items-center space-x-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${skuItem.inStock === 0 ? "bg-red-500 animate-pulse" : skuItem.inStock < 10 ? "bg-yellow-500" : "bg-emerald-500"}`} />
                                        <span className="text-xs font-mono">{skuItem.inStock} units</span>
                                      </div>
                                    </td>
                                    <td className="py-3 text-right">
                                      <div className="inline-flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            const updatedSkus = pSkus.map((sk: any) => sk.sku === skuItem.sku ? { ...sk, inStock: Math.max(0, sk.inStock - 1) } : sk);
                                            handleUpdateSkuStock(product.id, skuItem.sku, Math.max(0, skuItem.inStock - 1));
                                            product.skus = updatedSkus;
                                          }}
                                          className="w-6 h-6 rounded bg-[#222] hover:bg-[#333] border border-gray-800 text-xs flex items-center justify-center font-mono font-bold"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          value={skuItem.inStock}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const updatedSkus = pSkus.map((sk: any) => sk.sku === skuItem.sku ? { ...sk, inStock: val } : sk);
                                            handleUpdateSkuStock(product.id, skuItem.sku, val);
                                            product.skus = updatedSkus;
                                          }}
                                          className="w-12 bg-black border border-gray-850 rounded text-center text-xs py-0.5 focus:outline-none focus:border-[#C5A05A] font-mono"
                                        />
                                        <button
                                          onClick={() => {
                                            const updatedSkus = pSkus.map((sk: any) => sk.sku === skuItem.sku ? { ...sk, inStock: sk.inStock + 1 } : sk);
                                            handleUpdateSkuStock(product.id, skuItem.sku, skuItem.inStock + 1);
                                            product.skus = updatedSkus;
                                          }}
                                          className="w-6 h-6 rounded bg-[#222] hover:bg-[#333] border border-gray-800 text-xs flex items-center justify-center font-mono font-bold"
                                        >
                                          +
                                        </button>
                                        <button
                                          onClick={() => handleUpdateSkuStock(product.id, skuItem.sku, skuItem.inStock)}
                                          className={`ml-2 px-2.5 py-1 rounded text-[9px] font-mono tracking-wider uppercase border transition-all ${
                                            saveStatus === "saving"
                                              ? "bg-[#C5A05A]/10 border-[#C5A05A] text-yellow-500 animate-pulse"
                                              : saveStatus === "saved"
                                              ? "bg-emerald-950/20 border-emerald-800 text-emerald-400"
                                              : "bg-[#C5A05A] border-transparent text-black font-bold hover:bg-[#b98b5d]"
                                          }`}
                                          disabled={saveStatus === "saving"}
                                        >
                                          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: cPanel Deployment Hub */}
      {activeProductSubTab === "deployment" && (
        <div className="space-y-8 font-sans">
          
          <div className="bg-[#1A1A1A] border border-[#C5A05A]/35 rounded p-6 shadow-md text-white">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/25 shrink-0">
                <Database className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#C5A05A] uppercase block">cPanel Server Deployment</span>
                <h2 className="font-serif text-lg sm:text-xl font-medium tracking-tight text-white uppercase">Namecheap Hosting Migration Hub</h2>
                <p className="text-xs text-gray-400 leading-relaxed font-light max-w-4xl">
                  Are you hosting your website on Namecheap cPanel with standard PHP and MySQL? Below are the secure, customized scripts needed to build your inventory table and handle image uploads. Copied code is instantly ready to run in your cPanel environment.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* SQL Table Creation */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileCode className="h-5 w-5 text-[#C5A05A]" />
                    <h3 className="font-serif text-base font-semibold text-white">MySQL Table Structure</h3>
                  </div>
                  
                  <button
                    onClick={handleCopySQL}
                    className="p-1.5 rounded bg-[#111111] hover:bg-[#222222] border border-gray-800 text-[#C5A05A] transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedSQL ? (
                      <>
                        <ClipboardCheck className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-[10px] text-green-400 font-bold font-mono">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono">Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-gray-400 text-xs mb-4 leading-relaxed font-light">
                  Execute this SQL block in your cPanel <strong>phpMyAdmin</strong> SQL query panel to securely generate the <code>products</code> table. It defines optimal column lengths and safety variables.
                </p>

                <pre className="bg-[#111111] border border-gray-800 rounded p-4 text-[11px] font-mono text-gray-300 overflow-x-auto max-h-72">
                  {SQL_CODE}
                </pre>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>Engines: InnoDB</span>
                <span>Charset: utf8mb4</span>
              </div>
            </div>

            {/* PHP Secure upload.php */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileCode className="h-5 w-5 text-[#C5A05A]" />
                    <h3 className="font-serif text-base font-semibold text-white">Secure php Upload Portal</h3>
                  </div>
                  
                  <button
                    onClick={handleCopyPHP}
                    className="p-1.5 rounded bg-[#111111] hover:bg-[#222222] border border-gray-800 text-[#C5A05A] transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedPHP ? (
                      <>
                        <ClipboardCheck className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-[10px] text-green-400 font-bold font-mono">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono">Copy PHP</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-gray-400 text-xs mb-4 leading-relaxed font-light">
                  Save this code block as <code>upload.php</code> in your server's root. Make sure to replace your database user, password, and db name inside the credentials zone. Features multi-level protection:
                </p>

                <ul className="text-[11px] text-gray-400 space-y-1 mb-4 list-disc pl-4 font-light">
                  <li>Explicit Mime-Type check via <code>finfo_file()</code> (blocks executable script injects).</li>
                  <li>PDO-Prepared queries (safeguarded against standard SQL Injections).</li>
                  <li>Collision protection via unique hashing filename generators.</li>
                  <li>Sleek custom dashboard view matching Aurelius' color palette.</li>
                </ul>

                <pre className="bg-[#111111] border border-gray-800 rounded p-4 text-[11px] font-mono text-gray-300 overflow-x-auto max-h-72">
                  {PHP_CODE}
                </pre>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>File Size Limit: 5MB</span>
                <span>Type: PDO MySQL Connection</span>
              </div>
            </div>

          </div>

          {/* Setup instruction card */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 space-y-4 text-xs">
            <h3 className="font-serif text-base font-semibold text-white">cPanel Setup Instructions (Namecheap Setup Step-by-Step)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-gray-400 leading-relaxed font-light">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#C5A05A] text-black font-mono font-bold flex items-center justify-center text-[10px]">1</span>
                  <h4 className="font-semibold text-white text-[12px]">Database Setup</h4>
                </div>
                <p>Log in to Namecheap cPanel, open "MySQL Database Wizard". Create a database named <code>aurelius_db</code>, assign a user, grant "ALL PRIVILEGES", and save credentials.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#C5A05A] text-black font-mono font-bold flex items-center justify-center text-[10px]">2</span>
                  <h4 className="font-semibold text-white text-[12px]">Create Table</h4>
                </div>
                <p>Open "phpMyAdmin" in cPanel, select your database. Go to the "SQL" query editor, copy-paste the MySQL code block from above, and hit "Go" to spin up the products table.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#C5A05A] text-black font-mono font-bold flex items-center justify-center text-[10px]">3</span>
                  <h4 className="font-semibold text-white text-[12px]">Upload Scripts</h4>
                </div>
                <p>Open cPanel "File Manager" and go to <code>public_html</code>. Create a file named <code>upload.php</code>, paste the PHP block above, and replace lines 3 to 6 with your database credentials. Done!</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Sub-tab: AI Product Hub */}
      {activeProductSubTab === "importer" && (
        <div className="space-y-8 font-sans">
          
          <div className="bg-[#1A1A1A] border border-[#C5A05A]/35 rounded p-6 shadow-md text-white">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/25 shrink-0">
                <Sparkles className="h-6 w-6 animate-pulse animate-duration-[3000ms]" />
              </div>
              <div className="space-y-2">
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#C5A05A] uppercase block">AI-Powered Catalog Ingestion</span>
                <h2 className="font-serif text-lg sm:text-xl font-medium tracking-tight text-white uppercase">AI Product Hub</h2>
                <p className="text-xs text-gray-400 leading-relaxed font-light max-w-4xl">
                  Synchronize international marketplace listings directly into Aurelius' high-fidelity luxury database. Enter any valid AliExpress URL below, and our advanced catalog model will scrape, analyze, translate, and enrich the product with premium copywriting, SKU stock mapping, and elegant imagery.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Input Form Column */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-md lg:col-span-1 space-y-6">
              <div>
                <h3 className="font-serif text-base font-semibold text-white mb-2">Artisan Catalog Importer</h3>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Input the direct web link of an international masterpiece to translate it into the Aurelius collection.
                </p>
              </div>

              <form onSubmit={handleImportAliExpress} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">AliExpress Listing URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.aliexpress.com/item/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#C5A05A] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isImporting}
                  className="w-full py-2.5 rounded bg-[#C5A05A] hover:bg-[#B98B5D] disabled:bg-gray-800 text-black font-semibold font-serif text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-black" />
                      <span>Translating Catalog...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-black" />
                      <span>Import Masterpiece</span>
                    </>
                  )}
                </button>
              </form>

              {importError && (
                <div className="p-4 bg-red-950/40 border border-red-900/50 rounded flex items-start space-x-3 text-xs text-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold font-mono text-[10px] tracking-wider uppercase text-red-400">Import Fault Identified</p>
                    <p className="font-light leading-relaxed">{importError}</p>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="p-4 bg-green-950/40 border border-green-900/50 rounded flex items-start space-x-3 text-xs text-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold font-mono text-[10px] tracking-wider uppercase text-green-400">Success Committed</p>
                    <p className="font-light leading-relaxed">{importSuccess}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Implemented/Scraped Product Preview Column */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-md lg:col-span-2 space-y-6">
              <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold text-white">Live Ingestion Preview</h3>
                <span className="font-mono text-[9px] tracking-widest uppercase text-gray-500">
                  {importedProduct ? "Catalog Synced" : "Awaiting Ingestion"}
                </span>
              </div>

              {importedProduct ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Left Section: Photo & Identity */}
                  <div className="space-y-4">
                    <div className="aspect-square w-full rounded overflow-hidden border border-gray-800 bg-[#111111] relative group">
                      <img
                        src={importedProduct.images?.[0] || importedProduct.image || "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=1200"}
                        alt={importedProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-[#C5A05A]/40 rounded text-[9px] font-mono uppercase text-[#C5A05A] tracking-wider">
                        {importedProduct.category}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-mono text-[9px] text-[#C5A05A] tracking-wider uppercase block">{importedProduct.subcategory}</span>
                      <h4 className="font-serif text-lg font-bold text-white tracking-tight">{importedProduct.name}</h4>
                      <div className="flex items-center space-x-3">
                        <span className="text-base font-serif font-semibold text-[#C5A05A]">${importedProduct.price}</span>
                        {importedProduct.originalPrice && (
                          <span className="text-xs font-light text-gray-500 line-through">${importedProduct.originalPrice}</span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/50 border border-green-900/50 text-green-400 font-mono">
                          {importedProduct.inStock} In Stock
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Right Section: Specifications & Copywriting */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-gray-500 block mb-1">Bespoke Copywriting</span>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">{importedProduct.description}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-gray-500 block">Enriched Features</span>
                        <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4 font-light">
                          {importedProduct.features?.slice(0, 4).map((feat, index) => (
                            <li key={index}>{feat}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-900">
                        <div>
                          <span className="text-[8px] uppercase font-mono tracking-wider text-gray-500 block">SKU Identity</span>
                          <span className="text-xs font-mono text-gray-300">{importedProduct.SKU}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-mono tracking-wider text-gray-500 block">Dimensions</span>
                          <span className="text-xs text-gray-300 font-light">{importedProduct.dimensions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-900 flex items-center justify-between">
                      <div className="flex space-x-1.5">
                        {importedProduct.variantColorsHex?.slice(0, 3).map((hex, index) => (
                          <span
                            key={index}
                            title={importedProduct.variantColors?.[index]}
                            className="w-4 h-4 rounded-full border border-gray-800"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">Source: {importedProduct.supplier || "AliExpress"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-80 border border-dashed border-gray-800 rounded flex flex-col items-center justify-center text-center p-8 text-gray-500">
                  <Sparkles className="h-10 w-10 text-gray-700 mb-3 animate-pulse" />
                  <p className="font-serif text-sm font-medium text-gray-400 mb-1">Awaiting Ingestion Stream</p>
                  <p className="text-xs text-gray-600 max-w-sm leading-relaxed font-light">
                    Supply a valid AliExpress product listing URL on the left panel to translate and view the enriched masterpiece preview in real time.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
        </div>
      )}

      {/* RENDER BLOG TAB */}
      {activeTab === "blog" && (
        <div id="blog-editor-anchor" className="space-y-8 font-sans scroll-mt-6 text-white">
          <div className="bg-[#111111] border border-gray-800 rounded p-6 shadow-md">
            <h2 className="font-serif text-lg text-white uppercase tracking-tight mb-2">AURELIUS EDITORIAL HUB</h2>
            <p className="text-gray-400 text-xs font-light max-w-3xl mb-6">
              Create, curate, and publish high-fidelity editorial logs directly to the Aurelius Digital Library. Content published here is stored in your Firestore database and serves as lookbook logs for VIP patrons.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Blog Form Column */}
              <div className="lg:col-span-5 bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-sm">
                <h3 className="font-serif text-sm text-[#C5A05A] uppercase tracking-wider mb-4 pb-2 border-b border-gray-850">
                  {editingBlogId ? "Modify Editorial Volume" : "Compose New Volume"}
                </h3>

                {blogSubmitSuccess && (
                  <div className="p-3 mb-4 bg-emerald-950/30 border border-emerald-800 text-emerald-400 rounded text-xs flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{blogSubmitSuccess}</span>
                  </div>
                )}

                {blogSubmitError && (
                  <div className="p-3 mb-4 bg-red-950/30 border border-red-800 text-red-400 rounded text-xs flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{blogSubmitError}</span>
                  </div>
                )}

                <form onSubmit={handlePublishBlog} className="space-y-4">
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Article Title *</label>
                    <input
                      type="text"
                      value={blogFormTitle}
                      onChange={(e) => setBlogFormTitle(e.target.value)}
                      placeholder="e.g. The Scent of Florentine Workshops"
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Category *</label>
                      <select
                        value={blogFormCategory}
                        onChange={(e) => setBlogFormCategory(e.target.value)}
                        className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                      >
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Heritage">Heritage</option>
                        <option value="Artistry">Artistry</option>
                        <option value="Atelier">Atelier</option>
                        <option value="Curation">Curation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Read Time</label>
                      <input
                        type="text"
                        value={blogFormReadTime}
                        onChange={(e) => setBlogFormReadTime(e.target.value)}
                        placeholder="e.g. 4 min read"
                        className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Hero Image URL</label>
                    <input
                      type="text"
                      value={blogFormImage}
                      onChange={(e) => setBlogFormImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={blogFormTags}
                      onChange={(e) => setBlogFormTags(e.target.value)}
                      placeholder="Tannery, Heritage, Florence"
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Brief Excerpt</label>
                    <textarea
                      value={blogFormExcerpt}
                      onChange={(e) => setBlogFormExcerpt(e.target.value)}
                      rows={2}
                      placeholder="Brief meta description summarizing this curation..."
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A] font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Editorial Content (Markdown Supported) *</label>
                    <textarea
                      value={blogFormContent}
                      onChange={(e) => setBlogFormContent(e.target.value)}
                      rows={8}
                      placeholder="Deeply describe the exquisite details, stories, and history of this masterpiece selection..."
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A] font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-[#C5A05A] text-black font-mono font-bold text-xs tracking-wider uppercase rounded hover:bg-[#b98b5d] transition-all flex items-center justify-center space-x-2"
                    >
                      <Send className="h-3 w-3" />
                      <span>{editingBlogId ? "Apply Edits" : "Publish to Library"}</span>
                    </button>
                    {editingBlogId && (
                      <button
                        type="button"
                        onClick={resetBlogForm}
                        className="px-3 py-2 bg-gray-800 text-white font-mono text-xs uppercase rounded hover:bg-gray-700 transition-all border border-gray-700"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Blog List Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-850">
                  <h3 className="font-serif text-sm text-[#C5A05A] uppercase tracking-wider">
                    Published Curation Logs ({blogsList.length})
                  </h3>
                  <button
                    onClick={fetchBlogs}
                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    title="Force Database Synchronisation"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>

                {isFetchingBlogs ? (
                  <div className="py-12 text-center text-gray-500 font-light">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-[#C5A05A]" />
                    <span>Synchronising curation archives...</span>
                  </div>
                ) : blogsList.length === 0 ? (
                  <div className="py-12 border border-dashed border-gray-800 rounded text-center text-gray-500 font-light">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-750" />
                    <p>No published articles exist in this digital archive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blogsList.map((blog) => (
                      <div key={blog.id} className="bg-[#161616] border border-gray-850 rounded overflow-hidden flex flex-col h-full hover:border-[#C5A05A]/30 transition-all">
                        <div className="h-36 bg-gray-900 relative">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 bg-[#C5A05A] text-black font-mono text-[8px] font-bold tracking-widest px-1.5 py-0.5 uppercase rounded-sm shadow">
                            {blog.category}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col flex-1 space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                            <span>{blog.date}</span>
                            <span>{blog.readTime || "5 min read"}</span>
                          </div>
                          <h4 className="font-serif text-sm font-medium uppercase text-white line-clamp-1">{blog.title}</h4>
                          <p className="text-gray-400 text-xs font-light line-clamp-3 leading-relaxed flex-1">
                            {blog.excerpt || blog.content?.substring(0, 100) + "..."}
                          </p>

                          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-850/50 mt-auto">
                            <button
                              onClick={() => handleEditBlog(blog)}
                              className="px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase rounded bg-[#222] border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center space-x-1"
                            >
                              <Edit className="h-2.5 w-2.5 text-[#C5A05A]" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase rounded bg-red-950/10 border border-red-900/30 text-red-400 hover:bg-red-950/30 transition-all flex items-center space-x-1"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                              <span>Purge</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER WALLET TAB */}
      {activeTab === "wallet" && (
        <div className="space-y-8 font-sans text-white">
          <div className="bg-[#111111] border border-gray-800 rounded p-6 shadow-md">
            <h2 className="font-serif text-lg text-white uppercase tracking-tight mb-2">TREASURY & LEDGER HUB</h2>
            <p className="text-gray-400 text-xs font-light max-w-3xl mb-6">
              Track capital allocation pipelines, settled client wire transfers, active logistics payouts, and sovereign reserves in real time.
            </p>

            {/* Balances Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#1A1A1A] border border-[#C5A05A]/25 rounded p-5 relative overflow-hidden flex flex-col justify-between h-32">
                <span className="text-[9px] font-mono text-[#C5A05A] tracking-wider uppercase">Active Liquid Treasury</span>
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl sm:text-3.5xl font-bold tracking-tight text-white font-mono">
                    ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-light">Fully settled and ready for operational disbursement</p>
                </div>
                <div className="absolute right-3 bottom-3 text-white/5 font-mono text-6xl select-none font-bold">USD</div>
              </div>

              <div className="bg-[#1A1A1A] border border-gray-850 rounded p-5 relative overflow-hidden flex flex-col justify-between h-32">
                <span className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">Patron Escrow Reserves</span>
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl sm:text-3.5xl font-bold tracking-tight text-[#C5A05A] font-mono">
                    ${walletEscrow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-light">Committed pre-order reserves secured under Smart Escrow</p>
                </div>
                <div className="absolute right-3 bottom-3 text-white/5 font-mono text-6xl select-none font-bold">ESC</div>
              </div>

              <div className="bg-[#1A1A1A] border border-gray-850 rounded p-5 relative overflow-hidden flex flex-col justify-between h-32">
                <span className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">Treasury Currency Config</span>
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {["USD", "EUR", "GBP", "JPY"].map((curr) => (
                      <button
                        key={curr}
                        onClick={() => {
                          if (curr === walletCurrency) return;
                          let mult = 1;
                          if (curr === "EUR") mult = 0.92;
                          else if (curr === "GBP") mult = 0.78;
                          else if (curr === "JPY") mult = 158.2;
                          
                          let baseVal = 142580.00;
                          setWalletBalance(baseVal * mult);
                          setWalletCurrency(curr);
                        }}
                        className={`px-3 py-1 text-[10px] font-mono uppercase rounded transition-all border ${
                          walletCurrency === curr
                            ? "bg-[#C5A05A] text-black border-[#C5A05A] font-bold"
                            : "bg-black text-gray-400 border-gray-800 hover:text-white"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 font-light">Current system reference currency. Values scale dynamically.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Dispatch Payout */}
              <div className="lg:col-span-5 bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-sm">
                <h3 className="font-serif text-sm text-[#C5A05A] uppercase tracking-wider mb-4 pb-2 border-b border-gray-850">
                  Dispatch Capital Payout
                </h3>
                <form onSubmit={handleWalletTransfer} className="space-y-4">
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Select Cooperative / Recipient *</label>
                    <input
                      type="text"
                      required
                      value={withdrawalRecipient}
                      onChange={(e) => setWithdrawalRecipient(e.target.value)}
                      placeholder="e.g. Florence Craftsmanship Cooperatives"
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Disbursement Amount ({walletCurrency}) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-mono text-xs">{walletCurrency === "JPY" ? "¥" : "$"}</span>
                      <input
                        type="number"
                        required
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full bg-black border border-gray-850 rounded pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A] font-mono font-bold text-yellow-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Disbursement Memo</label>
                    <input
                      type="text"
                      placeholder="Settlement for Masterpiece Leather hide shipment"
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-[#C5A05A] text-black font-mono font-bold text-xs tracking-wider uppercase rounded hover:bg-[#b98b5d] transition-all flex items-center justify-center space-x-2"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Authorize Wire disbursement</span>
                  </button>
                </form>
              </div>

              {/* Historic Ledger Payouts */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-serif text-sm text-[#C5A05A] uppercase tracking-wider pb-2 border-b border-gray-850">
                  Treasury Ledger Transactions History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-850 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="pb-2">Disbursement ID</th>
                        <th className="pb-2">Valuation Date</th>
                        <th className="pb-2">Destination / Guild</th>
                        <th className="pb-2">Debit Amount</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletPayouts.map((pay) => (
                        <tr key={pay.id} className="border-b border-gray-900 text-xs font-light">
                          <td className="py-3 font-mono text-[10px] text-[#C5A05A]">{pay.id.substring(0, 12)}</td>
                          <td className="py-3 text-gray-400 font-mono text-[10px]">{pay.date}</td>
                          <td className="py-3 text-white uppercase font-mono text-[10px] tracking-tight">{pay.destination}</td>
                          <td className="py-3 font-mono font-bold text-[#C5A05A]">
                            -{walletCurrency === "JPY" ? "¥" : "$"}{pay.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-mono font-bold ${
                              pay.status === "Settled"
                                ? "bg-emerald-950/20 border border-emerald-800 text-emerald-400"
                                : "bg-yellow-950/20 border border-yellow-800 text-yellow-500 animate-pulse"
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-8 font-sans text-white">
          <div className="bg-[#111111] border border-gray-800 rounded p-6 shadow-md">
            <h2 className="font-serif text-lg text-white uppercase tracking-tight mb-2">SYSTEM PARAMETERS & SETTINGS</h2>
            <p className="text-gray-400 text-xs font-light max-w-3xl mb-6">
              Configure fine-grained storefront tax valuations, shipping tariffs, AI translator architectures, and external ERP integration channels.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Tariff Configuration */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 space-y-4">
                  <h3 className="font-serif text-xs text-[#C5A05A] uppercase tracking-wider mb-2 pb-1 border-b border-gray-850">
                    Storefront Fiscal Tariffs
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Standard VAT Tax Rate (%)</label>
                      <input
                        type="number"
                        value={settingsTaxRate}
                        onChange={(e) => setSettingsTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C5A05A]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Shipping Cost Flat (USD)</label>
                      <input
                        type="number"
                        value={settingsShippingCost}
                        onChange={(e) => setSettingsShippingCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C5A05A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">VAT Free Shipping Threshold (USD)</label>
                    <input
                      type="number"
                      value={settingsVatThreshold}
                      onChange={(e) => setSettingsVatThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C5A05A]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-white uppercase font-mono tracking-wider block">Low Stock Alerts</span>
                      <span className="text-[10px] text-gray-400 font-light">Show warnings in panel when stock dips below 10</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsShowStockAlerts(!settingsShowStockAlerts)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${settingsShowStockAlerts ? "bg-[#C5A05A]" : "bg-gray-800"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${settingsShowStockAlerts ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* AI & Integration Channels */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 space-y-4">
                  <h3 className="font-serif text-xs text-[#C5A05A] uppercase tracking-wider mb-2 pb-1 border-b border-gray-850">
                    AI Translation & Integrations
                  </h3>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-[#C5A05A] uppercase block mb-1">Master Translation Engine</label>
                    <select
                      value={settingsGeminiModel}
                      onChange={(e) => setSettingsGeminiModel(e.target.value)}
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A] font-mono"
                    >
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Precision Curation)</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra High Latency)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">VIP Luxury Price Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settingsVipMultiplier}
                        onChange={(e) => setSettingsVipMultiplier(parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C5A05A]"
                      />
                      <span className="text-[9px] text-gray-500 block mt-1">Multiplies wholesale supplier values to fit bespoke lookbook margins</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Administrative Integration Token</label>
                    <div className="flex">
                      <input
                        type="password"
                        readOnly
                        value={settingsApiToken}
                        className="flex-1 bg-black border border-gray-850 rounded-l px-3 py-2 text-xs font-mono text-gray-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settingsApiToken);
                          alert("System API token copied to clipboard securely.");
                        }}
                        className="px-3 bg-gray-850 border border-l-0 border-gray-850 text-[#C5A05A] hover:bg-gray-800 rounded-r text-xs font-mono transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C5A05A] text-black font-mono font-bold text-xs tracking-wider uppercase rounded hover:bg-[#b98b5d] transition-all flex items-center space-x-2 shadow-md"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Commit System Parameters</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="space-y-8 font-sans text-white">
          <div className="bg-[#111111] border border-gray-800 rounded p-6 shadow-md">
            <h2 className="font-serif text-lg text-white uppercase tracking-tight mb-2">ADMINISTRATIVE BROADCAST & ALERTS</h2>
            <p className="text-gray-400 text-xs font-light max-w-3xl mb-6">
              Broadcast high-priority alerts across administrative channels, track system heartbeats, and check low-stock reports.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form to dispatch notifications */}
              <div className="lg:col-span-5 bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-sm">
                <h3 className="font-serif text-sm text-[#C5A05A] uppercase tracking-wider mb-4 pb-2 border-b border-gray-850">
                  Broadcast Custom Alert
                </h3>
                <form onSubmit={handlePublishNotification} className="space-y-4">
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Alert Title *</label>
                    <input
                      type="text"
                      required
                      value={newNotifTitle}
                      onChange={(e) => setNewNotifTitle(e.target.value)}
                      placeholder="e.g. Tannery Outage"
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Alert Category / Priority *</label>
                    <select
                      value={newNotifLevel}
                      onChange={(e: any) => setNewNotifLevel(e.target.value)}
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A]"
                    >
                      <option value="info">Patron Information (Info)</option>
                      <option value="success">Completed Event (Success)</option>
                      <option value="warning">Immediate Hardware Action (Warning)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] tracking-widest font-mono text-gray-500 uppercase block mb-1">Alert Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={newNotifText}
                      onChange={(e) => setNewNotifText(e.target.value)}
                      placeholder="Supply complete administrative logs or visitor details..."
                      className="w-full bg-black border border-gray-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A05A] font-sans"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-[#C5A05A] text-black font-mono font-bold text-xs tracking-wider uppercase rounded hover:bg-[#b98b5d] transition-all flex items-center justify-center space-x-2"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Broadcast Active Alert</span>
                  </button>
                </form>
              </div>

              {/* Feed List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-850">
                  <h3 className="font-serif text-sm text-[#C5A05A] uppercase tracking-wider">
                    Administrative Notifications Stream
                  </h3>
                  <button
                    onClick={() => {
                      const cleared = adminNotifications.map(n => ({ ...n, read: true }));
                      setAdminNotifications(cleared);
                      localStorage.setItem("aurelius_admin_notifications", JSON.stringify(cleared));
                    }}
                    className="text-[9px] font-mono uppercase text-gray-400 hover:text-white transition-colors"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="space-y-3">
                  {adminNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded border transition-all flex items-start justify-between space-x-3 ${
                        notif.read ? "bg-[#141414] border-gray-900 opacity-60" : "bg-[#1A1A1A] border-gray-850"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${
                          notif.level === "warning"
                            ? "bg-red-950/20 text-red-400"
                            : notif.level === "success"
                            ? "bg-emerald-950/20 text-emerald-400"
                            : "bg-blue-950/20 text-blue-400"
                        }`}>
                          {notif.level === "warning" ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : notif.level === "success" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Activity className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-serif text-xs font-bold text-white uppercase tracking-tight">{notif.title}</h4>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A05A] animate-pulse" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-300 font-light leading-relaxed">{notif.text}</p>
                          <span className="font-mono text-[8px] text-gray-500 block">{notif.date}</span>
                        </div>
                      </div>

                      <div className="flex space-x-1 shrink-0">
                        <button
                          onClick={() => handleToggleReadNotification(notif.id)}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                          title={notif.read ? "Mark Unread" : "Mark Read"}
                        >
                          <Check className={`h-3 w-3 ${notif.read ? "text-[#C5A05A]" : "text-gray-500"}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-1 rounded hover:bg-red-950/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Purge alert"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
