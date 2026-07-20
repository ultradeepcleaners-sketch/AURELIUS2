import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import multer from "multer";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Read Firebase config dynamically to avoid import assertions or ESM loading issues
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  } catch (e) {
    console.error("Error reading firebase-applet-config.json:", e);
  }
}

// Initialize Firestore on Backend
let db: any = null;
let fbStorage: any = null;
if (firebaseConfig) {
  try {
    const dbApp = initializeApp(firebaseConfig);
    db = getFirestore(dbApp, firebaseConfig.firestoreDatabaseId || "(default)");
    fbStorage = getStorage(dbApp);
    console.log("[Aurelius Server] Firestore Database and Firebase Storage connected successfully.");
  } catch (e) {
    console.error("Error initializing Firestore in backend:", e);
  }
}

// Helper: Save Base64 file locally to /uploads and return its relative path
function saveBase64Locally(base64Str: string, folder: string, id: string, indexOrType: string | number): string {
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    let extension = mimeType.split("/")[1] || "jpg";
    if (extension.includes("+")) {
      extension = extension.split("+")[0];
    }
    const cleanFolder = folder.replace(/\//g, "-");
    const filename = `${cleanFolder}-${id}-${indexOrType}-${Date.now()}.${extension}`;
    
    const uploadsPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    
    const filePath = path.join(uploadsPath, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`[Aurelius Server Storage Fallback] Saved base64 file locally to /uploads/${filename}`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("[Aurelius Server Storage Fallback Error] Failed to save file locally:", err);
    return base64Str;
  }
}

// Helper: Upload Base64 Image to Firebase Storage and get Download URL
async function uploadBase64ToStorage(base64Str: string, folder: string, id: string, index: number): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:")) {
    return base64Str;
  }
  if (!fbStorage) {
    console.warn("[Aurelius Server Storage] WARNING: Firebase Storage not initialized. Storing base64 fallback locally.");
    return saveBase64Locally(base64Str, folder, id, index);
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const extension = mimeType.split("/")[1] || "jpg";
    const uniqueName = `${folder}/${id}-${index}-${Date.now()}.${extension}`;
    
    const storageRef = ref(fbStorage, uniqueName);
    const snapshot = await uploadBytes(storageRef, buffer, { contentType: mimeType });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error("[Aurelius Server Storage Error] Failed to upload base64 image, falling back to local file:", err);
    return saveBase64Locally(base64Str, folder, id, index);
  }
}

// Helper: Upload Base64 Video to Firebase Storage and get Download URL
async function uploadVideoBase64ToStorage(base64Str: string, id: string): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:")) {
    return base64Str;
  }
  if (!fbStorage) {
    console.warn("[Aurelius Server Storage] WARNING: Firebase Storage not initialized. Storing base64 fallback locally.");
    return saveBase64Locally(base64Str, "video", id, "main");
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const extension = mimeType.split("/")[1] || "mp4";
    const uniqueName = `products/videos/${id}-${Date.now()}.${extension}`;
    
    const storageRef = ref(fbStorage, uniqueName);
    const snapshot = await uploadBytes(storageRef, buffer, { contentType: mimeType });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error("[Aurelius Server Storage Error] Failed to upload base64 video, falling back to local file:", err);
    return saveBase64Locally(base64Str, "video", id, "main");
  }
}

// Helper: Estimate Firestore Document Size
function getFirestoreDocSize(data: any): number {
  let size = 0;
  if (!data) return size;
  for (const [key, value] of Object.entries(data)) {
    size += Buffer.byteLength(key, "utf8");
    if (value === null || value === undefined) {
      size += 1;
    } else if (typeof value === "string") {
      size += Buffer.byteLength(value, "utf8");
    } else if (typeof value === "number") {
      size += 8;
    } else if (typeof value === "boolean") {
      size += 1;
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          size += Buffer.byteLength(item, "utf8");
        } else if (typeof item === "number") {
          size += 8;
        } else if (typeof item === "object" && item !== null) {
          size += Buffer.byteLength(JSON.stringify(item), "utf8");
        }
      }
    } else if (typeof value === "object") {
      size += Buffer.byteLength(JSON.stringify(value), "utf8");
    }
  }
  return size;
}

// Migration Function: Find and migrate products containing base64 images to Firebase Storage
async function migrateProducts() {
  if (!db || !fbStorage) {
    console.warn("[Aurelius Migration] DB or Storage not initialized. Skipping product migration.");
    return;
  }
  try {
    console.log("[Aurelius Migration] Checking products for base64 data to migrate...");
    const querySnapshot = await getDocs(collection(db, "products"));
    console.log(`[Aurelius Migration] Found ${querySnapshot.size} products to inspect.`);
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      let updated = false;
      const images = data.images || [];
      const newImages = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img && typeof img === "string" && img.startsWith("data:image/")) {
          console.log(`[Aurelius Migration] Migrating base64 image in product "${data.name || "Unnamed"}" (ID: ${docSnap.id})...`);
          const downloadUrl = await uploadBase64ToStorage(img, "products/migrated", docSnap.id, i);
          if (downloadUrl && downloadUrl !== img) {
            newImages.push(downloadUrl);
            updated = true;
          } else {
            newImages.push(img);
          }
        } else {
          newImages.push(img);
        }
      }

      let mainImage = data.image;
      if (mainImage && typeof mainImage === "string" && mainImage.startsWith("data:image/")) {
        if (newImages.length > 0 && newImages[0] && !newImages[0].startsWith("data:")) {
          mainImage = newImages[0];
          updated = true;
        } else {
          const downloadUrl = await uploadBase64ToStorage(mainImage, "products/migrated-main", docSnap.id, 99);
          if (downloadUrl && downloadUrl !== mainImage) {
            mainImage = downloadUrl;
            updated = true;
          }
        }
      }

      let thumbnail = data.thumbnail;
      if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("data:image/")) {
        if (newImages.length > 0 && newImages[0] && !newImages[0].startsWith("data:")) {
          thumbnail = newImages[0];
          updated = true;
        } else {
          const downloadUrl = await uploadBase64ToStorage(thumbnail, "products/migrated-thumb", docSnap.id, 98);
          if (downloadUrl && downloadUrl !== thumbnail) {
            thumbnail = downloadUrl;
            updated = true;
          }
        }
      }

      let video = data.video;
      if (video && typeof video === "string" && video.startsWith("data:video/")) {
        console.log(`[Aurelius Migration] Migrating base64 video in product "${data.name || "Unnamed"}" (ID: ${docSnap.id})...`);
        const downloadUrl = await uploadVideoBase64ToStorage(video, docSnap.id);
        if (downloadUrl && downloadUrl !== video) {
          video = downloadUrl;
          updated = true;
        }
      }

      if (updated) {
        await updateDoc(doc(db, "products", docSnap.id), {
          images: newImages,
          image: mainImage || (newImages[0] || ""),
          thumbnail: thumbnail || (newImages[0] || ""),
          video: video || null,
          updatedAt: new Date().toISOString()
        });
        console.log(`[Aurelius Migration] Successfully migrated and updated product "${data.name}" (ID: ${docSnap.id}) in Firestore.`);
      }
    }
    console.log("[Aurelius Migration] Product migration check completed successfully.");
  } catch (err) {
    console.error("[Aurelius Migration Error] Error during migration process:", err);
  }
}

// Ensure uploads folder exists in the workspace
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WEBP image formats are supported."));
    }
  }
});

const uploadMulti = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit to support videos
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/quicktime", "video/webm", "video/ogg"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Supported formats: JPEG, PNG, WEBP, GIF, MP4, MOV, WEBM, OGG."));
    }
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

// Initialize Google Gen AI client lazily to prevent startup crashes if GEMINI_API_KEY is not set yet
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust Gemini helper with automatic retry and exponential backoff
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0) {
      console.warn(`[Aurelius Gemini Retry] API call failed. Retrying in ${delay}ms... (${retries} retries left). Error:`, err.message || err);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

// Fallback Generators for robust offline/high-demand operations
function generateFallbackDescription(name: string, category: string, keyFeatures: string, tone: string): string {
  const materials = keyFeatures || "Premium full-grain leather, meticulous hand-stitching, brass hardware";
  const intro = `Crafted for the discerning connoisseur, the ${name} represents the absolute zenith of artisanal leather design. Meticulously sculpted to blend timeless vintage heritage with contemporary functional requirements, this masterpiece commands respect in any boardroom or airport terminal.`;
  const features = `• Solid Brass Accents: Heavy-gauge hardware selected for perpetual durability and elegant, classic style.\n• Full-Grain Patina Journey: Crafted from premium ${materials.toLowerCase()} which matures beautifully, reflecting the story of your travels.\n• Ergonomic Balance: Carefully distributed load points and reinforced leather handles ensure effortless, premium comfort.`;
  const legacy = `Legacy Note: As a testament to classical Italian craftsmanship, the ${name} breathes and adapts, inheriting a deeper, richer character over decades of travels.`;
  
  return `${intro}\n\n${features}\n\n${legacy}`;
}

function generateFallbackChatResponse(messages: any[], contextProduct?: any): string {
  const prodInfo = contextProduct ? `Regarding your interest in the exquisite ${contextProduct.name} ($${contextProduct.price}), it is one of our finest offerings, built with premium full-grain leather and exceptional detail.` : "";
  return `Welcome to the Aurelius Private Salon. Our Chief Concierge is currently attending to another VIP client in our Tuscan workshop. 

${prodInfo}

As you browse our heritage catalog, please note that all Aurelius travel bags and accessories are eligible for complimentary white-glove shipping. If you have any questions about leather care, we highly recommend our custom Leather Care Kit to preserve the beautiful character of your full-grain leather. How else may we assist you today?`;
}

function generateFallbackCareDiagnosis(material: string, issueType: string, description: string): string {
  return `### 1. 🔍 Damage Analysis & Fiber Diagnosis
The encounter between "${material}" and "${issueType}" has affected the natural open pores of the leather fibers. On a biological level, moisture or friction can deplete the protective oils and waxes, temporarily compressing the grain structure.

### 2. 🛠️ Bespoke Restoration Protocol (Step-by-Step)
1. **Gently Cleanse**: Lightly wipe the surface with a clean, slightly damp microfiber cloth. Do not soak the leather.
2. **Moisturize**: Once dry, apply a tiny amount of organic leather balm (or beeswax) in gentle circular motions.
3. **Buff & Revitalize**: Buff with a horsehair brush to restore the exquisite natural luster.
4. **Rest**: Keep the item in a cool, ventilated area away from direct heat or harsh sunlight.

### 3. 🎒 Suggested Tools & Care Kit
- **Aurelius Leather Care Kit**: Includes premium organic beeswax, a genuine horsehair polishing brush, and fine microfiber cloth.
- **Alternative**: A soft, dry cotton cloth and gentle ambient room drying.

### 4. 📜 Artisan's Heritage Note
Remember, fine leather is a living canvas. Minor scars, creases, and tone variations are not flaws, but rather the emerging patina of a beautifully lived, well-traveled life.`;
}

function generateFallbackImportProduct(url: string): any {
  let urlKeywords = "Classic Leather Duffel";
  let category: "bags" | "shoes" | "accessories" = "bags";
  let subcategory = "Atelier Classic";

  try {
    // Strip query parameters and hash first
    let cleanUrl = url.split("?")[0].split("#")[0];
    
    // Check category hints
    const lowerUrl = cleanUrl.toLowerCase();
    if (lowerUrl.includes("shoe") || lowerUrl.includes("boot") || lowerUrl.includes("sneaker") || lowerUrl.includes("loaf") || lowerUrl.includes("heel") || lowerUrl.includes("oxford") || lowerUrl.includes("footwear")) {
      category = "shoes";
      subcategory = "Luxury Footwear";
    } else if (lowerUrl.includes("belt") || lowerUrl.includes("wallet") || lowerUrl.includes("strap") || lowerUrl.includes("card") || lowerUrl.includes("key") || lowerUrl.includes("bracelet") || lowerUrl.includes("watch") || lowerUrl.includes("accessory")) {
      category = "accessories";
      subcategory = "Artisan Accessory";
    } else {
      category = "bags";
      subcategory = "Heritage Carry";
    }

    const parts = cleanUrl.split("/");
    let lastPart = parts[parts.length - 1] || "";
    if (lastPart.endsWith(".html")) {
      lastPart = lastPart.substring(0, lastPart.length - 5);
    }
    
    // Split by non-alphabetic characters (or hyphens/underscores) and clean up
    const words = lastPart
      .split(/[-_.]+/)
      .filter(w => isNaN(Number(w)) && w.length > 1 && !/^\d+$/.test(w));
      
    if (words.length > 0) {
      urlKeywords = words
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  } catch (e) {}

  return {
    name: `Aurelius ${urlKeywords || "Atelier Masterpiece"}`,
    title: `Aurelius ${urlKeywords || "Atelier Masterpiece"}`,
    price: 285.00,
    originalPrice: 340.00,
    category,
    subcategory,
    description: "An exquisite heritage piece translated from our international catalog. Sculpted with premium materials and completed with robust hardware, designed for the refined modern aesthetic.",
    images: [category === "shoes" 
      ? "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200"
      : category === "accessories"
      ? "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200"
      : "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=1200"
    ],
    thumbnail: category === "shoes" 
      ? "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200"
      : category === "accessories"
      ? "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200"
      : "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=1200",
    features: [
      "Individually hand-stitched leather panels",
      "Reinforced high-strain points",
      "Integrated secure storage slots",
      "Corrosion-resistant custom hardware"
    ],
    variantColors: ["Classic Amber", "Saddle Tan", "Executive Black"],
    variantColorsHex: ["#C5A05A", "#8B5A2B", "#111111"],
    dimensions: category === "shoes" ? "Standard Sizing" : "45cm L x 22cm W x 25cm H",
    weight: category === "accessories" ? "0.3 kg" : "1.3 kg",
    capacity: category === "bags" ? "26 Litres" : "N/A",
    laptopCompatibility: category === "bags" ? "Integrated slot fits up to 15.6-inch models" : "N/A",
    waterResistance: "Moderate splash protection",
    careInstructions: "Apply organic leather balm and buff clean with a cotton cloth.",
    inStock: 12,
    SKU: `AUR-ALI-${Math.floor(Math.random() * 900000 + 100000)}`,
    supplier: "AliExpress",
    supplierURL: url
  };
}

// Middleware for parsing JSON with increased size limits to allow posting large items/images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Custom Request/Response Tracing Middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const originalSend = res.send;
  const originalJson = res.json;
  const url = req.originalUrl || req.url;

  console.log(`[Aurelius Server Trace] >>> INCOMING REQUEST: ${req.method} ${url}`);
  console.log(`[Aurelius Server Trace] Request Headers:`, JSON.stringify(req.headers, null, 2));

  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = "********";
    
    // Safely truncate very large fields (e.g. base64 files/images) to prevent write EPIPE console crashes
    for (const key of Object.keys(safeBody)) {
      if (typeof safeBody[key] === "string" && safeBody[key].length > 500) {
        safeBody[key] = `[TRUNCATED: string of ${safeBody[key].length} chars]`;
      } else if (Array.isArray(safeBody[key])) {
        safeBody[key] = safeBody[key].map((item: any) => {
          if (typeof item === "string" && item.length > 500) {
            return `[TRUNCATED: string of ${item.length} chars]`;
          }
          return item;
        });
      }
    }
    console.log(`[Aurelius Server Trace] Request Payload:`, JSON.stringify(safeBody, null, 2));
  } else {
    console.log(`[Aurelius Server Trace] Request Payload: Empty`);
  }

  // Intercept json responses
  res.json = function (body): express.Response {
    console.log(`[Aurelius Server Trace] <<< OUTGOING JSON RESPONSE: ${req.method} ${url} | Status: ${res.statusCode}`);
    console.log(`[Aurelius Server Trace] Response Headers:`, JSON.stringify(res.getHeaders(), null, 2));
    
    // Ensure Content-Type is always application/json
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    try {
      let logBody = body;
      if (body && typeof body === "object") {
        logBody = { ...body };
        if (logBody.data && typeof logBody.data === "object") {
          logBody.data = { ...logBody.data };
          for (const k of Object.keys(logBody.data)) {
            if (typeof logBody.data[k] === "string" && logBody.data[k].length > 500) {
              logBody.data[k] = `[TRUNCATED: ${logBody.data[k].length} chars]`;
            }
          }
        }
        if (logBody.product && typeof logBody.product === "object") {
          logBody.product = { ...logBody.product };
          for (const k of Object.keys(logBody.product)) {
            if (typeof logBody.product[k] === "string" && logBody.product[k].length > 500) {
              logBody.product[k] = `[TRUNCATED: ${logBody.product[k].length} chars]`;
            }
          }
        }
      }
      console.log(`[Aurelius Server Trace] Response Body:`, JSON.stringify(logBody, null, 2).substring(0, 2000));
    } catch (e) {
      console.log(`[Aurelius Server Trace] Response Body: [Failed to stringify response body]`);
    }

    return originalJson.apply(res, arguments as any);
  };

  // Intercept send responses
  res.send = function (body): express.Response {
    console.log(`[Aurelius Server Trace] <<< OUTGOING SEND RESPONSE: ${req.method} ${url} | Status: ${res.statusCode}`);
    console.log(`[Aurelius Server Trace] Response Headers:`, JSON.stringify(res.getHeaders(), null, 2));

    if (url.startsWith("/api/")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }

    try {
      if (typeof body === "string") {
        console.log(`[Aurelius Server Trace] Response Body (String):`, body.substring(0, 1000));
      } else {
        console.log(`[Aurelius Server Trace] Response Body (Other):`, String(body).substring(0, 1000));
      }
    } catch (e) {
      console.log(`[Aurelius Server Trace] Response Body: [Failed to print]`);
    }

    return originalSend.apply(res, arguments as any);
  };

  next();
});

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// API: Get custom products from Firestore
app.get("/api/products", async (req, res) => {
  try {
    if (!db) {
      console.warn("[Aurelius Server] WARNING: Database not initialized. Returning empty product dataset.");
      return res.status(200).json({
        success: true,
        message: "Database not initialized yet. Returning empty catalog.",
        data: []
      });
    }
    const querySnapshot = await getDocs(collection(db, "products"));
    const products: any[] = [];
    querySnapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() });
    });
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully from Firestore",
      data: products
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error getting custom products. Stack trace:", error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve products."
    });
  }
});

// API: Add a new custom product with uploaded images and video
app.post("/api/products", uploadMulti.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      name, price, originalPrice, description, category, subcategory, 
      features, laptopCompatibility, waterResistance, 
      dimensions, weight, capacity, careInstructions, inStock,
      variantColors, variantColorsHex, base64Images, base64Video, skus
    } = req.body;

    if (!name || !price || !description || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required product fields: name, price, description, category"
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    let uploadedImages: string[] = [];
    let uploadedVideo: string = "";

    if (files) {
      if (files["images"]) {
        uploadedImages = files["images"].map(f => `/uploads/${f.filename}`);
      }
      if (files["video"] && files["video"].length > 0) {
        uploadedVideo = `/uploads/${files["video"][0].filename}`;
      }
    }

    // Support JSON base64 uploads
    if (base64Images && Array.isArray(base64Images)) {
      uploadedImages = [...uploadedImages, ...base64Images];
    }
    if (base64Video) {
      uploadedVideo = base64Video;
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one product image is required."
      });
    }

    const parsedPrice = parseFloat(price);
    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    const parsedStock = inStock ? parseInt(inStock) : 10;

    const docRef = doc(collection(db, "products"));
    const generatedId = docRef.id;

    // Upload base64 images and video to Firebase Storage
    const finalImages = await Promise.all(
      uploadedImages.map((img, idx) => uploadBase64ToStorage(img, "products", generatedId, idx))
    );
    const finalVideo = uploadedVideo ? await uploadVideoBase64ToStorage(uploadedVideo, generatedId) : "";

    const productData: any = {
      id: generatedId,
      name,
      title: name,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      description,
      category,
      subcategory: subcategory || "Heritage Craft",
      image: finalImages[0] || "",
      images: finalImages,
      thumbnail: finalImages[0] || "",
      features: features ? (Array.isArray(features) ? features : features.split(",").map((f: string) => f.trim())) : ["Premium full-grain leather", "Meticulous artisan details"],
      variantColors: variantColors ? (Array.isArray(variantColors) ? variantColors : variantColors.split(",").map((c: string) => c.trim())) : ["Classic Amber", "Saddle Tan", "Executive Black"],
      variantColorsHex: variantColorsHex ? (Array.isArray(variantColorsHex) ? variantColorsHex : variantColorsHex.split(",").map((h: string) => h.trim())) : ["#C5A05A", "#8B5A2B", "#111111"],
      laptopCompatibility: laptopCompatibility || "Integrated slot fits up to 15-inch models",
      waterResistance: waterResistance || "Moderate splash protection",
      dimensions: dimensions || "45cm L x 22cm W x 25cm H",
      weight: weight || "1.4 kg",
      capacity: capacity || "28 Litres",
      careInstructions: careInstructions || "Apply organic leather balm and buff clean with a cotton cloth.",
      inStock: isNaN(parsedStock) ? 10 : parsedStock,
      inventory: isNaN(parsedStock) ? 10 : parsedStock,
      SKU: req.body.SKU || `AUR-MAN-${Math.floor(Math.random() * 900000 + 100000)}`,
      supplier: req.body.supplier || "Aurelius Studio",
      supplierURL: req.body.supplierURL || "",
      rating: 5.0,
      reviewsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skus: skus ? (typeof skus === "string" ? JSON.parse(skus) : skus) : undefined
    };

    if (parsedOriginalPrice !== undefined && !isNaN(parsedOriginalPrice)) {
      productData.originalPrice = parsedOriginalPrice;
      productData.salePrice = parsedPrice; // Map for schema compliance
    } else {
      productData.salePrice = parsedPrice;
    }

    if (finalVideo) {
      productData.video = finalVideo;
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    // Clean undefined fields to prevent Firestore serialization crash
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });

    // Validation: Calculate document size. If above 900KB, return error
    const docSize = getFirestoreDocSize(productData);
    console.log(`[Aurelius Server] Calculated Firestore document size for creation of "${name}": ${docSize} bytes.`);
    if (docSize > 900 * 1024) {
      return res.status(400).json({
        success: false,
        error: "Product data too large"
      });
    }

    await setDoc(docRef, productData);
    const addedProduct = productData;
    
    res.status(201).json({
      success: true,
      message: `Masterpiece "${name}" added successfully to database`,
      data: addedProduct,
      product: addedProduct // keeping product field for front-end compatibility
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error creating custom product. Stack trace:", error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create product."
    });
  }
});

// API: Edit/Update an existing custom product in Firestore
app.put("/api/products/:id", uploadMulti.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, price, originalPrice, description, category, subcategory, 
      features, laptopCompatibility, waterResistance, 
      dimensions, weight, capacity, careInstructions, inStock,
      variantColors, variantColorsHex,
      existingImages, existingVideo, base64Images, base64Video, skus // arrays or string lists representing existing images/video to preserve
    } = req.body;

    if (!name || !price || !description || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required product fields: name, price, description, category"
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    let uploadedImages: string[] = [];
    let uploadedVideo: string = "";

    if (files) {
      if (files["images"]) {
        uploadedImages = files["images"].map(f => `/uploads/${f.filename}`);
      }
      if (files["video"] && files["video"].length > 0) {
        uploadedVideo = `/uploads/${files["video"][0].filename}`;
      }
    }

    // Support JSON base64 uploads
    if (base64Images && Array.isArray(base64Images)) {
      uploadedImages = [...uploadedImages, ...base64Images];
    }
    if (base64Video) {
      uploadedVideo = base64Video;
    }

    // Process existing images
    let preservedImages: string[] = [];
    if (existingImages) {
      if (Array.isArray(existingImages)) {
        preservedImages = existingImages;
      } else if (typeof existingImages === "string") {
        try {
          preservedImages = JSON.parse(existingImages);
        } catch {
          preservedImages = existingImages.split(",").map(i => i.trim()).filter(Boolean);
        }
      }
    }

    // Upload base64 images and video to Firebase Storage
    const finalUploadedImages = await Promise.all(
      uploadedImages.map((img, idx) => uploadBase64ToStorage(img, "products", id, idx))
    );

    // Also migrate preserved images if any of them are still base64
    const finalPreservedImages = await Promise.all(
      preservedImages.map((img, idx) => uploadBase64ToStorage(img, "products/existing", id, idx))
    );

    const finalImages = [...finalPreservedImages, ...finalUploadedImages];

    if (finalImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Product requires at least one image."
      });
    }

    let finalVideo = uploadedVideo ? await uploadVideoBase64ToStorage(uploadedVideo, id) : "";
    if (!finalVideo && existingVideo) {
      finalVideo = await uploadVideoBase64ToStorage(existingVideo, id);
    }

    const parsedPrice = parseFloat(price);
    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    const parsedStock = inStock ? parseInt(inStock) : 10;

    const productData: any = {
      id,
      name,
      title: name,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      description,
      category,
      subcategory: subcategory || "Heritage Craft",
      image: finalImages[0] || "",
      images: finalImages,
      thumbnail: finalImages[0] || "",
      features: features ? (Array.isArray(features) ? features : features.split(",").map((f: string) => f.trim())) : ["Premium full-grain leather", "Meticulous artisan details"],
      variantColors: variantColors ? (Array.isArray(variantColors) ? variantColors : variantColors.split(",").map((c: string) => c.trim())) : ["Classic Amber", "Saddle Tan", "Executive Black"],
      variantColorsHex: variantColorsHex ? (Array.isArray(variantColorsHex) ? variantColorsHex : variantColorsHex.split(",").map((h: string) => h.trim())) : ["#C5A05A", "#8B5A2B", "#111111"],
      laptopCompatibility: laptopCompatibility || "Integrated slot fits up to 15-inch models",
      waterResistance: waterResistance || "Moderate splash protection",
      dimensions: dimensions || "45cm L x 22cm W x 25cm H",
      weight: weight || "1.4 kg",
      capacity: capacity || "28 Litres",
      careInstructions: careInstructions || "Apply organic leather balm and buff clean with a cotton cloth.",
      inStock: isNaN(parsedStock) ? 10 : parsedStock,
      inventory: isNaN(parsedStock) ? 10 : parsedStock,
      SKU: req.body.SKU || `AUR-UPD-${Math.floor(Math.random() * 900000 + 100000)}`,
      supplier: req.body.supplier || "Aurelius Studio",
      supplierURL: req.body.supplierURL || "",
      updatedAt: new Date().toISOString(),
      skus: skus ? (typeof skus === "string" ? JSON.parse(skus) : skus) : undefined
    };

    if (parsedOriginalPrice !== undefined && !isNaN(parsedOriginalPrice)) {
      productData.originalPrice = parsedOriginalPrice;
      productData.salePrice = parsedPrice; // Map for schema compliance
    } else {
      productData.originalPrice = null;
      productData.salePrice = parsedPrice;
    }

    if (finalVideo) {
      productData.video = finalVideo;
    } else {
      productData.video = null;
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    // Clean undefined fields to prevent Firestore serialization crash
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });

    // Validation: Calculate document size. If above 900KB, return error
    const docSize = getFirestoreDocSize(productData);
    console.log(`[Aurelius Server] Calculated Firestore document size for edit of "${name}": ${docSize} bytes.`);
    if (docSize > 900 * 1024) {
      return res.status(400).json({
        success: false,
        error: "Product data too large"
      });
    }

    await setDoc(doc(db, "products", id), productData, { merge: true });
    const updatedProduct = { id, ...productData };

    res.status(200).json({
      success: true,
      message: `Masterpiece "${name}" updated successfully in database`,
      data: updatedProduct,
      product: updatedProduct // keeping product field for front-end compatibility
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error editing custom product. Stack trace:", error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to edit product."
    });
  }
});

// API: Get blog articles from Firestore or default data
app.get("/api/blogs", async (req, res) => {
  try {
    if (!db) {
      return res.status(200).json({
        success: true,
        message: "Database not initialized yet. Returning empty array.",
        data: []
      });
    }
    const querySnapshot = await getDocs(collection(db, "blogs"));
    const blogs: any[] = [];
    querySnapshot.forEach((docSnap) => {
      blogs.push({ id: docSnap.id, ...docSnap.data() });
    });
    res.status(200).json({
      success: true,
      message: "Blog articles retrieved successfully from Firestore",
      data: blogs
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error getting blogs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve blog articles."
    });
  }
});

// API: Add a new blog article to Firestore
app.post("/api/blogs", async (req, res) => {
  try {
    const { title, category, readTime, date, excerpt, content, image, tags } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, category, content"
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    const blogData = {
      title,
      category,
      readTime: readTime || "5 min read",
      date: date || new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      excerpt: excerpt || content.substring(0, 150) + "...",
      content,
      image: image || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "blogs"), blogData);

    res.status(201).json({
      success: true,
      message: "Blog article published successfully inside the digital library",
      data: { id: docRef.id, ...blogData }
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error adding blog:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create blog article."
    });
  }
});

// API: Update a blog article in Firestore
app.put("/api/blogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, readTime, date, excerpt, content, image, tags } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (date !== undefined) updateData.date = date;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (image !== undefined) updateData.image = image;
    if (tags !== undefined) updateData.tags = tags;
    updateData.updatedAt = new Date().toISOString();

    await setDoc(doc(db, "blogs", id), updateData, { merge: true });

    res.status(200).json({
      success: true,
      message: "Blog article updated successfully in the digital archives",
      data: { id, ...updateData }
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error updating blog:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update blog article."
    });
  }
});

// API: Delete a blog article from Firestore
app.delete("/api/blogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    await deleteDoc(doc(db, "blogs", id));

    res.status(200).json({
      success: true,
      message: "Blog article deleted successfully"
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error deleting blog:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete blog article."
    });
  }
});

// API: Lightweight endpoint to update SKUs stock for a product directly
app.put("/api/products/:id/skus", async (req, res) => {
  try {
    const { id } = req.params;
    const { skus } = req.body;

    if (!skus || !Array.isArray(skus)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid skus array"
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    const totalInStock = skus.reduce((sum: number, item: any) => sum + (parseInt(item.inStock) || 0), 0);

    const updateData = {
      skus,
      inStock: totalInStock,
      inventory: totalInStock,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "products", id), updateData, { merge: true });

    res.status(200).json({
      success: true,
      message: "SKUs stock updated successfully in database",
      data: updateData
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error updating SKUs stock:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update SKUs stock."
    });
  }
});

// API: Import product details from AliExpress URL
app.post("/api/products/import-aliexpress", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "AliExpress URL is required." });
    }

    console.log(`[Aurelius AliExpress Importer] Importing URL: ${url}`);

    let html = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      if (response.ok) {
        html = await response.text();
      } else {
        console.warn(`[Aurelius AliExpress Importer] HTTP status ${response.status} when fetching URL.`);
      }
    } catch (fetchErr: any) {
      console.error("[Aurelius AliExpress Importer] Direct fetch failed:", fetchErr);
    }

    let pageContext = "";
    if (html) {
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const metaMatches = [...html.matchAll(/<meta[^>]+(?:name|property)=["']([^"']+)["'][^>]+content=["']([^"']+)["']/gi)];
      const metaTags = metaMatches.map(m => `${m[1]}: ${m[2]}`).join("\n");
      const titleText = titleMatch ? titleMatch[1].trim() : "";
      
      const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      let imageString = "";
      for (const script of scripts) {
        const content = script[1];
        if (content.includes("image") && content.includes(".jpg") && content.length < 50000) {
          imageString += content.substring(0, 1000);
        }
      }

      pageContext = `Title: ${titleText}\nMeta Tags:\n${metaTags}\nImage Hints:\n${imageString.substring(0, 1000)}`;
    }

    const prompt = `You are the Aurelius Master Catalog Integration Expert. 
Analyze the following AliExpress product page details (or the URL keywords if page details are sparse/blocked) and translate them into our elite luxury brand format.

AliExpress URL: "${url}"
Scraped Page Details:
"""
${pageContext || "Scraping was blocked. Please generate a luxury product based on keywords in the URL path."}
"""

You MUST return a JSON object representing a completed, high-end product in the exact structure.
The fields to map are:
- "name": An editorial, elegant, and concise product title (e.g., "Aurelius Tuscan Suede Weekender" instead of a long spammy title).
- "title": (same as name)
- "price": A retail price in USD (suggest a premium price between $100 and $500 based on item category).
- "originalPrice": A slightly higher original price to simulate exclusive discount (e.g. price * 1.2).
- "category": Must be one of: "bags", "shoes", "accessories".
- "subcategory": A specific style (e.g. "Travel Duffel", "Suede Boot", "Leather Wallet").
- "description": An exquisite, three-sentence copywriting narrative describing the material choice (Crazy Horse full-grain, Tuscan calfskin, etc.), hand-stitching, and the elite lifestyle it serves.
- "images": An array of high-quality image URLs. If we scraped image URLs from og:image (usually matching strings like "https://ae01.alicdn.com/kf/...jpg"), include them! Otherwise, use professional, high-resolution Unsplash image URLs of matching luxury leather items.
- "thumbnail": (same as images[0])
- "features": A list of 4 refined technical bullet points (e.g., "Meticulous German high-tension stitched seams").
- "variantColors": An array of 3 sophisticated luxury colors (e.g., ["Classic Amber", "Saddle Tan", "Executive Black"]).
- "variantColorsHex": Matching hex values for colors (e.g., ["#C5A05A", "#8B5A2B", "#111111"]).
- "dimensions": e.g., "48cm L x 22cm W x 24cm H"
- "weight": e.g., "1.5 kg"
- "capacity": e.g., "30 Litres" (or null if not bags)
- "laptopCompatibility": (for bags, e.g. "Integrated sleeve fits up to 15.6-inch laptops", otherwise null)
- "waterResistance": "Moderate moisture protection"
- "careInstructions": A detailed, luxury care tip (e.g., "Moisturize with organic beeswax conditioner once every six months").
- "inStock": 12 (or a random integer between 5 and 20)
- "SKU": A unique code like "AUR-ALI-XXXXXX"
- "supplier": "AliExpress"
- "supplierURL": "${url}"

Ensure the output is STRICTLY valid JSON inside a codeblock, conforming to the requested schema.`;

    let parsedProduct: any = null;
    try {
      const response = await callGeminiWithRetry(() => getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              price: { type: Type.NUMBER },
              originalPrice: { type: Type.NUMBER },
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              description: { type: Type.STRING },
              images: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              thumbnail: { type: Type.STRING },
              features: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              variantColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              variantColorsHex: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              dimensions: { type: Type.STRING },
              weight: { type: Type.STRING },
              capacity: { type: Type.STRING },
              laptopCompatibility: { type: Type.STRING },
              waterResistance: { type: Type.STRING },
              careInstructions: { type: Type.STRING },
              inStock: { type: Type.NUMBER },
              SKU: { type: Type.STRING },
              supplier: { type: Type.STRING },
              supplierURL: { type: Type.STRING }
            },
            required: [
              "name", "title", "price", "category", "subcategory", 
              "description", "images", "thumbnail", "features", 
              "variantColors", "variantColorsHex", "dimensions", 
              "weight", "careInstructions", "inStock", "SKU", 
              "supplier", "supplierURL"
            ]
          }
        }
      }));
      parsedProduct = JSON.parse(response.text || "{}");
    } catch (apiErr: any) {
      console.warn("[Aurelius Server AliExpress Import Fallback Triggered]:", apiErr.message || apiErr);
      parsedProduct = generateFallbackImportProduct(url);
    }

    // Ensure all properties are safely populated and prevent any undefined crashes
    if (!parsedProduct || typeof parsedProduct !== "object") {
      parsedProduct = generateFallbackImportProduct(url);
    }
    
    // Normalize fields
    parsedProduct.name = parsedProduct.name || parsedProduct.title || "Aurelius Handcrafted Masterpiece";
    parsedProduct.title = parsedProduct.name;
    parsedProduct.price = parseFloat(parsedProduct.price) || 245.00;
    parsedProduct.originalPrice = parseFloat(parsedProduct.originalPrice) || parseFloat((parsedProduct.price * 1.25).toFixed(2));
    parsedProduct.category = ["bags", "shoes", "accessories"].includes(parsedProduct.category) ? parsedProduct.category : "bags";
    parsedProduct.subcategory = parsedProduct.subcategory || "Heritage Craft";
    parsedProduct.description = parsedProduct.description || "An exquisite piece sculpted from premium materials, embodying timeless character and uncompromised sophistication.";
    
    if (!Array.isArray(parsedProduct.images) || parsedProduct.images.length === 0) {
      parsedProduct.images = ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=1200"];
    }
    parsedProduct.thumbnail = parsedProduct.thumbnail || parsedProduct.images[0];
    parsedProduct.image = parsedProduct.images[0];
    
    if (!Array.isArray(parsedProduct.features) || parsedProduct.features.length === 0) {
      parsedProduct.features = [
        "Individually hand-stitched leather panels",
        "Reinforced high-strain handle points",
        "Integrated secure interior passport pocket",
        "Corrosion-resistant custom zinc zippers"
      ];
    }
    
    if (!Array.isArray(parsedProduct.variantColors) || parsedProduct.variantColors.length === 0) {
      parsedProduct.variantColors = ["Classic Amber", "Saddle Tan", "Executive Black"];
    }
    
    if (!Array.isArray(parsedProduct.variantColorsHex) || parsedProduct.variantColorsHex.length === 0) {
      parsedProduct.variantColorsHex = ["#C5A05A", "#8B5A2B", "#111111"];
    }
    
    parsedProduct.dimensions = parsedProduct.dimensions || "45cm L x 22cm W x 25cm H";
    parsedProduct.weight = parsedProduct.weight || "1.3 kg";
    parsedProduct.capacity = parsedProduct.capacity || (parsedProduct.category === "bags" ? "26 Litres" : "N/A");
    parsedProduct.laptopCompatibility = parsedProduct.laptopCompatibility || (parsedProduct.category === "bags" ? "Integrated slot fits up to 15.6-inch models" : "N/A");
    parsedProduct.waterResistance = parsedProduct.waterResistance || "Moderate splash protection";
    parsedProduct.careInstructions = parsedProduct.careInstructions || "Apply organic leather balm and buff clean with a cotton cloth.";
    
    const stock = parseInt(parsedProduct.inStock) || parseInt(parsedProduct.inventory) || 12;
    parsedProduct.inStock = stock;
    parsedProduct.inventory = stock;
    
    parsedProduct.SKU = parsedProduct.SKU || `AUR-ALI-${Math.floor(Math.random() * 900000 + 100000)}`;
    parsedProduct.supplier = parsedProduct.supplier || "AliExpress";
    parsedProduct.supplierURL = parsedProduct.supplierURL || url;
    parsedProduct.salePrice = parsedProduct.price;
    parsedProduct.rating = parseFloat(parsedProduct.rating) || 4.8;
    parsedProduct.reviewsCount = parseInt(parsedProduct.reviewsCount) || Math.floor(10 + Math.random() * 50);
    parsedProduct.createdAt = parsedProduct.createdAt || new Date().toISOString();
    parsedProduct.updatedAt = new Date().toISOString();

    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized yet."
      });
    }

    // Save to Firestore
    const docRef = doc(collection(db, "products"));
    parsedProduct.id = docRef.id;
    await setDoc(docRef, parsedProduct);
    const addedProduct = parsedProduct;

    console.log(`[Aurelius AliExpress Importer] Product successfully imported and committed to Firestore: ID ${docRef.id}`);

    res.status(201).json({
      success: true,
      message: `Product "${parsedProduct.name}" successfully imported from AliExpress!`,
      data: addedProduct,
      product: addedProduct
    });

  } catch (error: any) {
    console.error("[Aurelius AliExpress Importer Error]:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to import product from AliExpress."
    });
  }
});

// API: Delete a custom product from Firestore
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not initialized"
      });
    }
    await deleteDoc(doc(db, "products", id));
    res.status(200).json({
      success: true,
      message: "Product deleted successfully from database",
      data: { id }
    });
  } catch (error: any) {
    console.error("[Aurelius Server Error] Error deleting custom product. Stack trace:", error.stack || error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete product."
    });
  }
});

// API: AI Personal Shopper (Luxury Concierge Chat)
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, contextProduct } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid or missing messages array." });
    }

    // Format chat history for Gemini
    // Limit to last 15 messages for token economy
    const recentMessages = messages.slice(-15);
    
    // We can compile history into a standard single prompt context or run as chats.sendMessage.
    // To make it highly reliable and robust, we format a single system instruction + combined history.
    let systemInstruction = `You are the Aurelius Luxury Concierge, an elite personal shopper and leather heritage advisor for "Aurelius" — a world-class luxury leather brand competing with the finest Italian ateliers and heritage houses. 
Your personality is:
- Extremely sophisticated, polished, refined, and confident.
- Warm, helpful, and highly professional (like an estate manager, private club host, or premium leather artisan).
- Knowledgeable about leather materials (Crazy Horse leather, Full-grain veg-tan, Suede), leather preservation (protecting from water, conditioning with natural oils, avoiding direct high heat), and lifestyle travel packing.
- Avoid low-quality sales pitches or generic promotional speak. Instead, offer timeless, poetic yet highly practical advice.

Aurelius Collections details:
1. Crazy Horse Leather Travel Bags:
   - "Leathfocus Cowhide Travel Bag" ($245): Crazy Horse natural leather, large capacity duffle bag with soft zipper closure and vintage style, integrated sleeve fits 15.6" laptops.
   - "Aurelius Navigator Duffel" ($420): Rich Crazy Horse leather, 45L capacity, perfect cabin carry-on with solid brass hardware.
   - "Aurelius Overlander Weekend Bag" ($480): Deep Espresso Brown full-grain leather, shoe compartment, luxurious canvas lining.
   - "Aurelius Executive Briefcase" ($350): Designed for 16-inch laptops, brushed gold buckles, rear luggage strap.
2. Handmade Leather Shoes:
   - "Aurelius Sovereign Oxford" ($280): British classic brogues, Goodyear welted, vegetable-tanned premium leather.
   - "Aurelius Nomad Leather Sneaker" ($190): Matte black and tan variants, high-density comfort memory insoles, Italian leather.
   - "Aurelius Chelsea Boot" ($310): Rich cognac suede, double elastic gusset, durable rubber-injected leather outsole.
3. Premium Accessories:
   - "Aurelius Heritage Wallet" ($85): Bifold, RFID-blocking, 8 card slots, slim profile.
   - "Aurelius Aviator Watch" ($380): Chronograph, brushed copper bezel, crazy horse tan leather strap, sapphire crystal glass.
   - "Aurelius Leather Care Kit" ($35): Premium organic beeswax conditioner, horsehair brush, microfibre polishing cloth.

When recommending products, guide them to these specific Aurelius models. Include their exquisite features and price points. If the user asks about care, recommend the Aurelius Leather Care Kit.`;

    if (contextProduct) {
      systemInstruction += `\n\nThe user is currently viewing: "${contextProduct.name}" (${contextProduct.category}, $${contextProduct.price}). Tailor your response or welcome to mention this magnificent piece first!`;
    }

    // Format the history for model input
    const formattedContents = recentMessages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    let content = "";
    try {
      const response = await callGeminiWithRetry(() => getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      }));
      content = response.text || generateFallbackChatResponse(messages, contextProduct);
    } catch (apiErr: any) {
      console.warn("[Aurelius Server AI Chat Fallback Triggered]:", apiErr.message || apiErr);
      content = generateFallbackChatResponse(messages, contextProduct);
    }

    res.json({ content });
  } catch (error: any) {
    console.error("Fatal Error in AI Chat:", error);
    res.json({ content: generateFallbackChatResponse(req.body.messages || [], req.body.contextProduct) });
  }
});

// API: AI Product Description Generator (Admin Panel Feature)
app.post("/api/ai/describe-product", async (req, res) => {
  try {
    const { name, category, keyFeatures, tone = "luxurious" } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "Product Name and Category are required." });
    }

    const prompt = `Write an exquisite, high-end editorial product description for a premium leather item.
Product Name: "${name}"
Category: "${category}"
Key Materials/Features: "${keyFeatures || 'Premium full-grain leather, meticulous hand-stitching, brass hardware'}"
Tone: "${tone}"

Format the output as a beautiful piece of copywriting:
1. An elegant, narrative intro paragraph describing the spirit of the item (timeless craftsmanship, confidence, luxury lifestyle).
2. A bulleted list of 3-4 meticulously described luxurious technical features (e.g. "Solid Brass Accents", "Crazy Horse Patina Journey", "Ergonomic Balance").
3. A closing "Legacy Note" stating how this product inherits character over decades of travel.

Do not use overly dramatic marketing phrases (e.g., "Revolutionize your wardrobe"). Keep it grounded in Rolls-Royce class and Apple-level clarity.`;

    let description = "";
    try {
      const response = await callGeminiWithRetry(() => getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      }));
      description = response.text || generateFallbackDescription(name, category, keyFeatures, tone);
    } catch (apiErr: any) {
      console.warn("[Aurelius Server AI Describe Fallback Triggered]:", apiErr.message || apiErr);
      description = generateFallbackDescription(name, category, keyFeatures, tone);
    }

    res.json({ description });
  } catch (error: any) {
    console.error("Fatal Error in AI Describe Product:", error);
    res.json({ description: generateFallbackDescription(req.body.name || "Aurelius Masterpiece", req.body.category || "Travel Bags", req.body.keyFeatures || "", req.body.tone || "luxurious") });
  }
});

// API: AI Smart Search (Extracting categories, keywords, and tags to enable typo correction and smart suggestion)
app.post("/api/ai/smart-search", async (req, res) => {
  const { query } = req.body;
  try {
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const prompt = `Analyze the following search query from a customer on a luxury leather boutique: "${query}".
Categorize it, extract keywords, and predict intention. Provide synonyms and correct minor typos to match our collections: "bags", "shoes", "wallets", "watches", "care".

Return the result strictly as a JSON object with this exact schema:
{
  "correctedQuery": "corrected text or original if perfect",
  "category": "travel bags" | "shoes" | "accessories" | "care" | "all",
  "tags": ["travel", "business", "minimalist", "gift", "premium", "formal", "casual", etc. list up to 4 tags],
  "intent": "purchase" | "browse" | "care_advice" | "gift_finding",
  "suggestedColors": ["saddle brown", "matte black", "espresso", "cognac", "tan", "any"]
}`;

    const response = await getAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedQuery: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            intent: { type: Type.STRING },
            suggestedColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["correctedQuery", "category", "tags", "intent", "suggestedColors"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in AI Smart Search:", error);
    // Graceful fallback with standard search matching if Gemini is offline
    res.json({
      correctedQuery: query,
      category: "all",
      tags: [],
      intent: "browse",
      suggestedColors: ["any"]
    });
  }
});

// API: Leather Care Diagnosis Tool
app.post("/api/ai/diagnose-care", async (req, res) => {
  try {
    const { material, issueType, description } = req.body;

    if (!material || !issueType || !description) {
      return res.status(400).json({ error: "Material, Issue Type, and Description are required." });
    }

    const prompt = `You are the Aurelius Chief Restoration Officer and Master Leather Artisan at our flagship sun-drenched Tuscan workshop in Florence.
    A client has approached you with a distress call regarding their luxury item. 
    
    Item Material: "${material}"
    Type of Damage/Issue: "${issueType}"
    Client's Description: "${description}"
    
    Analyze the situation and provide an expert, specific, reassuring, and step-by-step restoration plan.
    Keep your tone sophisticated, warm, professional, and authoritative—reflecting centuries of luxury leather mastery.
    
    Structure your answer in beautiful Markdown with the following distinct sections:
    
    ### 1. 🔍 Damage Analysis & Fiber Diagnosis
    Explain what happened on a physical/biological level to this specific type of leather (e.g. how the liquid affected aniline pores, how a scratch shifted pull-up waxes, or how a stain flattened suede nap).
    
    ### 2. 🛠️ Bespoke Restoration Protocol (Step-by-Step)
    Provide 3 to 5 clear, numbered, easy-to-follow restoration steps. Make them specific to the material and damage. Include warnings of what NOT to do.
    
    ### 3. 🎒 Suggested Tools & Care Kit
    List the essential tools needed for this treatment (recommend the "Aurelius Leather Care Kit" featuring organic beeswax, horsehair brush, and microfiber cloth if applicable, or highly specific home safe remedies like clean warm moisture, cornstarch for grease, steam for suede).
    
    ### 4. 📜 Artisan's Heritage Note
    Conclude with an elegant, poetic note of comfort about how leather lives, breathes, and carries the scars of a well-traveled life as an emerging unique patina, rather than a defect.
    
    Ensure your advice is extremely safe. NEVER suggest harsh chemicals, alcohol, or wire brushes on delicate smooth surfaces.`;

    let diagnosis = "";
    try {
      const response = await callGeminiWithRetry(() => getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      }));
      diagnosis = response.text || generateFallbackCareDiagnosis(material, issueType, description);
    } catch (apiErr: any) {
      console.warn("[Aurelius Server AI Care Diagnosis Fallback Triggered]:", apiErr.message || apiErr);
      diagnosis = generateFallbackCareDiagnosis(material, issueType, description);
    }

    res.json({ diagnosis });
  } catch (error: any) {
    console.error("Fatal Error in AI Leather Care Diagnosis:", error);
    res.json({ diagnosis: generateFallbackCareDiagnosis(req.body.material || "smooth leather", req.body.issueType || "wear", req.body.description || "General conditioning request") });
  }
});

// Global API 404 handler: Catch any unhandled request starting with /api/ and return JSON only
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API Route Not Found: ${req.method} ${req.url}`
  });
});

// Global Error Handler for API routes to always return JSON instead of HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Aurelius Server Error]:", err);
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: err.message || "An unexpected server-side error occurred."
  });
});

// Vite Middleware for development mode, otherwise serve static files
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all non-API GET requests in production (Express v4)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aurelius Server] Luxury eCommerce backend running on http://localhost:${PORT}`);
    // Run the existing products migration in the background
    migrateProducts().catch(err => {
      console.error("[Aurelius Server] Migration on startup failed:", err);
    });
  });
};

startServer();
