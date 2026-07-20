import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from "fs";
import path from "path";

let firebaseConfig = {
  projectId: "gen-lang-client-0344596829",
  appId: "1:456653500244:web:3f1302370d3ceffb07e2c1",
  apiKey: "AIzaSyCw4Eidq8qUeulyzzmY7jUEvEqn4QK8TJc",
  authDomain: "gen-lang-client-0344596829.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-aureliusluxuryme-9ad8fe47-375b-4b69-b619-f78892f3b5f8",
  storageBucket: "gen-lang-client-0344596829.firebasestorage.app",
  messagingSenderId: "456653500244"
};

try {
  const possiblePaths = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(process.cwd(), "../firebase-applet-config.json"),
    path.join(process.cwd(), "../../firebase-applet-config.json")
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      firebaseConfig = JSON.parse(fs.readFileSync(p, "utf-8"));
      break;
    }
  }
} catch (e) {
  console.warn("Failed to read dynamic firebase config, using fallback.", e);
}

// Initialize Firestore & Storage
const dbApp = initializeApp(firebaseConfig);
const db = getFirestore(dbApp, firebaseConfig.firestoreDatabaseId || "(default)");
const storage = getStorage(dbApp);

// Helper: Save Base64 file locally to /uploads and return its relative path
function saveBase64Locally(base64Str, folder, id, indexOrType) {
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
    console.log(`[Aurelius Netlify Fallback] Saved base64 file locally to /uploads/${filename}`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("[Aurelius Netlify Fallback Error] Failed to save file locally:", err);
    return base64Str;
  }
}

// Helper: Upload Base64 Image to Firebase Storage and get Download URL
async function uploadBase64ToStorage(base64Str, folder, id, index) {
  if (!base64Str || !base64Str.startsWith("data:")) {
    return base64Str;
  }
  if (!storage) {
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
    
    const storageRef = ref(storage, uniqueName);
    const snapshot = await uploadBytes(storageRef, buffer, { contentType: mimeType });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error("[Aurelius Server Storage Error] Failed to upload base64 image, falling back to local file:", err);
    return saveBase64Locally(base64Str, folder, id, index);
  }
}

// Helper: Upload Base64 Video to Firebase Storage and get Download URL
async function uploadVideoBase64ToStorage(base64Str, id) {
  if (!base64Str || !base64Str.startsWith("data:")) {
    return base64Str;
  }
  if (!storage) {
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
    
    const storageRef = ref(storage, uniqueName);
    const snapshot = await uploadBytes(storageRef, buffer, { contentType: mimeType });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error("[Aurelius Server Storage Error] Failed to upload base64 video, falling back to local file:", err);
    return saveBase64Locally(base64Str, "video", id, "main");
  }
}

// Helper: Estimate Firestore Document Size
function getFirestoreDocSize(data) {
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

export async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }

  // Parse ID from the URL path if present
  // e.g., /api/products/some-id or /.netlify/functions/products/some-id
  const segments = event.path.split("/").filter(Boolean);
  const productsIndex = segments.indexOf("products");
  let id = null;
  let isSkuUpdate = false;
  if (productsIndex !== -1 && productsIndex < segments.length - 1) {
    id = segments[productsIndex + 1];
    if (segments[productsIndex + 2] === "skus") {
      isSkuUpdate = true;
    }
  }

  try {
    if (event.httpMethod === "PUT" && isSkuUpdate) {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing request body" })
        };
      }
      const body = JSON.parse(event.body);
      const { skus } = body;
      if (!skus || !Array.isArray(skus)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing or invalid skus array" })
        };
      }

      const totalInStock = skus.reduce((sum, item) => sum + (parseInt(item.inStock) || 0), 0);
      const updateData = {
        skus,
        inStock: totalInStock,
        inventory: totalInStock,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "products", id), updateData, { merge: true });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "SKUs stock updated successfully in database",
          data: updateData
        })
      };
    }

    if (event.httpMethod === "GET") {
      // GET: fetch products
      const querySnapshot = await getDocs(collection(db, "products"));
      const products = [];
      querySnapshot.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...docSnap.data() });
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Products retrieved successfully from Firestore",
          data: products
        })
      };
    }

    if (event.httpMethod === "POST") {
      // POST: create product
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing request body" })
        };
      }
      const body = JSON.parse(event.body);
      const { 
        name, price, originalPrice, description, category, subcategory, 
        features, laptopCompatibility, waterResistance, 
        dimensions, weight, capacity, careInstructions, inStock,
        variantColors, variantColorsHex, base64Images, base64Video, skus
      } = body;

      if (!name || !price || !description || !category) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Missing required product fields: name, price, description, category"
          })
        };
      }

      const parsedPrice = parseFloat(price);
      const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      const parsedStock = inStock ? parseInt(inStock) : 10;

      // Generate a document reference to get a secure id
      const docRef = doc(collection(db, "products"));
      const generatedId = docRef.id;

      // Upload base64 images and video to Firebase Storage
      const imagesToUpload = base64Images || [];
      const finalImages = await Promise.all(
        imagesToUpload.map((img, idx) => uploadBase64ToStorage(img, "products", generatedId, idx))
      );
      const finalVideo = base64Video ? await uploadVideoBase64ToStorage(base64Video, generatedId) : "";

      const productData = {
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
        features: features ? (Array.isArray(features) ? features : features.split(",").map(f => f.trim())) : ["Premium full-grain leather", "Meticulous artisan details"],
        variantColors: variantColors ? (Array.isArray(variantColors) ? variantColors : variantColors.split(",").map(c => c.trim())) : ["Classic Amber", "Saddle Tan", "Executive Black"],
        variantColorsHex: variantColorsHex ? (Array.isArray(variantColorsHex) ? variantColorsHex : variantColorsHex.split(",").map(h => h.trim())) : ["#C5A05A", "#8B5A2B", "#111111"],
        laptopCompatibility: laptopCompatibility || "Integrated slot fits up to 15-inch models",
        waterResistance: waterResistance || "Moderate splash protection",
        dimensions: dimensions || "45cm L x 22cm W x 25cm H",
        weight: weight || "1.4 kg",
        capacity: capacity || "28 Litres",
        careInstructions: careInstructions || "Apply organic leather balm and buff clean with a cotton cloth.",
        inStock: isNaN(parsedStock) ? 10 : parsedStock,
        inventory: isNaN(parsedStock) ? 10 : parsedStock,
        SKU: body.SKU || `AUR-MAN-${Math.floor(Math.random() * 900000 + 100000)}`,
        supplier: body.supplier || "Aurelius Studio",
        supplierURL: body.supplierURL || "",
        rating: 5.0,
        reviewsCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skus: skus ? (typeof skus === "string" ? JSON.parse(skus) : skus) : undefined
      };

      if (parsedOriginalPrice !== undefined && !isNaN(parsedOriginalPrice)) {
        productData.originalPrice = parsedOriginalPrice;
        productData.salePrice = parsedPrice;
      } else {
        productData.salePrice = parsedPrice;
      }

      if (finalVideo) {
        productData.video = finalVideo;
      }

      // Validation: Calculate document size. If above 900KB, return error
      const docSize = getFirestoreDocSize(productData);
      console.log(`[Aurelius Netlify Function] Calculated Firestore document size for creation of "${name}": ${docSize} bytes.`);
      if (docSize > 900 * 1024) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Product data too large"
          })
        };
      }

      await setDoc(docRef, productData);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Masterpiece "${name}" added successfully to database`,
          data: productData,
          product: productData
        })
      };
    }

    if (event.httpMethod === "PUT") {
      // PUT: edit product
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing product ID in URL path" })
        };
      }
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing request body" })
        };
      }
      const body = JSON.parse(event.body);
      const { 
        name, price, originalPrice, description, category, subcategory, 
        features, laptopCompatibility, waterResistance, 
        dimensions, weight, capacity, careInstructions, inStock,
        variantColors, variantColorsHex,
        existingImages, existingVideo, base64Images, base64Video, skus
      } = body;

      if (!name || !price || !description || !category) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Missing required product fields: name, price, description, category"
          })
        };
      }

      let preservedImages = [];
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
      const imagesToUpload = base64Images || [];
      const finalUploadedImages = await Promise.all(
        imagesToUpload.map((img, idx) => uploadBase64ToStorage(img, "products", id, idx))
      );

      // Also migrate preserved images if any of them are still base64
      const finalPreservedImages = await Promise.all(
        preservedImages.map((img, idx) => uploadBase64ToStorage(img, "products/existing", id, idx))
      );

      const finalImages = [...finalPreservedImages, ...finalUploadedImages];
      if (finalImages.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Product requires at least one image." })
        };
      }

      let finalVideo = base64Video ? await uploadVideoBase64ToStorage(base64Video, id) : "";
      if (!finalVideo && existingVideo) {
        finalVideo = await uploadVideoBase64ToStorage(existingVideo, id);
      }

      const parsedPrice = parseFloat(price);
      const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      const parsedStock = inStock ? parseInt(inStock) : 10;

      const productData = {
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
        features: features ? (Array.isArray(features) ? features : features.split(",").map(f => f.trim())) : ["Premium full-grain leather", "Meticulous artisan details"],
        variantColors: variantColors ? (Array.isArray(variantColors) ? variantColors : variantColors.split(",").map(c => c.trim())) : ["Classic Amber", "Saddle Tan", "Executive Black"],
        variantColorsHex: variantColorsHex ? (Array.isArray(variantColorsHex) ? variantColorsHex : variantColorsHex.split(",").map(h => h.trim())) : ["#C5A05A", "#8B5A2B", "#111111"],
        laptopCompatibility: laptopCompatibility || "Integrated slot fits up to 15-inch models",
        waterResistance: waterResistance || "Moderate splash protection",
        dimensions: dimensions || "45cm L x 22cm W x 25cm H",
        weight: weight || "1.4 kg",
        capacity: capacity || "28 Litres",
        careInstructions: careInstructions || "Apply organic leather balm and buff clean with a cotton cloth.",
        inStock: isNaN(parsedStock) ? 10 : parsedStock,
        inventory: isNaN(parsedStock) ? 10 : parsedStock,
        SKU: body.SKU || `AUR-UPD-${Math.floor(Math.random() * 900000 + 100000)}`,
        supplier: body.supplier || "Aurelius Studio",
        supplierURL: body.supplierURL || "",
        updatedAt: new Date().toISOString(),
        skus: skus ? (typeof skus === "string" ? JSON.parse(skus) : skus) : undefined
      };

      if (parsedOriginalPrice !== undefined && !isNaN(parsedOriginalPrice)) {
        productData.originalPrice = parsedOriginalPrice;
        productData.salePrice = parsedPrice;
      } else {
        productData.originalPrice = null;
        productData.salePrice = parsedPrice;
      }

      if (finalVideo) {
        productData.video = finalVideo;
      } else {
        productData.video = null;
      }

      // Validation: Calculate document size. If above 900KB, return error
      const docSize = getFirestoreDocSize(productData);
      console.log(`[Aurelius Netlify Function] Calculated Firestore document size for edit of "${name}": ${docSize} bytes.`);
      if (docSize > 900 * 1024) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Product data too large"
          })
        };
      }

      await setDoc(doc(db, "products", id), productData, { merge: true });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Product "${name}" updated successfully in database`,
          data: productData,
          product: productData
        })
      };
    }

    if (event.httpMethod === "DELETE") {
      // DELETE: delete product
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Missing product ID in URL path" })
        };
      }
      await deleteDoc(doc(db, "products", id));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Product deleted successfully from database",
          data: { id }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: `Method ${event.httpMethod} Not Allowed` })
    };

  } catch (error) {
    console.error("Error inside Netlify products function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || "Failed to complete transaction in database"
      })
    };
  }
}
