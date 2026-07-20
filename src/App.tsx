import React, { useState, useEffect } from "react";
import { 
  Sparkles, Star, ChevronRight, Lock, ShieldCheck, Mail, Check, 
  RefreshCw, Heart, Eye, ArrowRight, Trash2, ArrowUpRight, Award, MapPin 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import ProductDetailModal from "./components/ProductDetailModal";
import CartDrawer from "./components/CartDrawer";
import AIConcierge from "./components/AIConcierge";
import AccountDashboard from "./components/AccountDashboard";
import BlogAtelier from "./components/BlogAtelier";
import AdminPanel from "./components/AdminPanel";
import CraftJourney from "./components/CraftJourney";
import AtelierLookbook from "./components/AtelierLookbook";
import CareManualModal from "./components/CareManualModal";
import CheckoutModal from "./components/CheckoutModal";
import OrderTracker from "./components/OrderTracker";
import AureliusDebugConsole from "./components/AureliusDebugConsole";
import { AureliusLogger } from "./utils/AureliusLogger";

import { Product, CartItem, Review, CurrencyCode, formatPrice, CURRENCY_MAP } from "./types";
import { PRODUCTS } from "./data";

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { OperationType, handleFirestoreFault } from "./utils/firestoreDbHandler";

function detectCurrencyFromLocale(): CurrencyCode {
  try {
    const locales = navigator.languages ? [...navigator.languages] : [];
    if (navigator.language) {
      locales.unshift(navigator.language);
    }
    
    for (const locale of locales) {
      if (!locale) continue;
      const cleanLocale = locale.toLowerCase();
      
      // Check for country suffixes or language codes
      if (cleanLocale.endsWith("-gb") || cleanLocale.endsWith("-uk") || cleanLocale === "en-gb" || cleanLocale === "gb" || cleanLocale.includes("en-gb")) {
        return "GBP";
      }
      if (cleanLocale.endsWith("-jp") || cleanLocale === "ja" || cleanLocale === "ja-jp" || cleanLocale === "jp" || cleanLocale.includes("ja-jp")) {
        return "JPY";
      }
      if (cleanLocale.endsWith("-ca") || cleanLocale === "en-ca" || cleanLocale === "ca" || cleanLocale.includes("en-ca")) {
        return "CAD";
      }
      if (cleanLocale.endsWith("-au") || cleanLocale === "en-au" || cleanLocale === "au" || cleanLocale.includes("en-au")) {
        return "AUD";
      }
      if (cleanLocale.endsWith("-gh") || cleanLocale === "en-gh" || cleanLocale === "gh" || cleanLocale === "ak" || cleanLocale === "ee" || cleanLocale === "fat" || cleanLocale === "ga" || cleanLocale === "ha" || cleanLocale.includes("en-gh")) {
        return "GHS";
      }
      
      // European countries using Euro
      const euroCountries = ["-de", "-fr", "-it", "-es", "-nl", "-be", "-at", "-fi", "-gr", "-ie", "-pt", "-lu", "-sk", "-si", "-cy", "-ee", "-lv", "-lt", "-mt", "de-", "fr-", "it-", "es-", "nl-"];
      if (euroCountries.some(suffix => cleanLocale.includes(suffix)) || 
          ["de", "fr", "it", "es", "nl", "be", "at", "fi", "gr", "ie", "pt", "lu", "sk", "si", "cy", "ee", "lv", "lt", "mt"].includes(cleanLocale)) {
        return "EUR";
      }
    }
  } catch (e) {
    console.warn("Failed to detect browser locale currency:", e);
  }
  return "USD";
}

export default function App() {
  // Global States
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem("aurelius_currency");
    if (saved) return saved as CurrencyCode;
    return detectCurrencyFromLocale();
  });

  const [suggestedCurrency, setSuggestedCurrency] = useState<CurrencyCode | null>(() => {
    const saved = localStorage.getItem("aurelius_currency");
    if (saved) return null;
    const detected = detectCurrencyFromLocale();
    return detected !== "USD" ? detected : null;
  });

  const [rateTrigger, setRateTrigger] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    localStorage.setItem("aurelius_currency", currency);
  }, [currency]);

  // Sync Live Exchange Rates from public API
  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        console.log("[Aurelius Ledger] Synchronizing live exchange rates...");
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates) {
            // Dynamically override cached rate configs in types.ts
            (Object.keys(CURRENCY_MAP) as CurrencyCode[]).forEach((code) => {
              if (data.rates[code] && CURRENCY_MAP[code]) {
                CURRENCY_MAP[code].rate = data.rates[code];
              }
            });
            console.log("[Aurelius Ledger] Exchange rates synchronized successfully with open financial API:", {
              EUR: CURRENCY_MAP.EUR.rate,
              GBP: CURRENCY_MAP.GBP.rate,
              JPY: CURRENCY_MAP.JPY.rate,
              CAD: CURRENCY_MAP.CAD.rate,
              AUD: CURRENCY_MAP.AUD.rate,
              GHS: CURRENCY_MAP.GHS.rate,
            });
            // Update last synchronized timestamp
            setLastSynced(new Date());
            // Trigger state change to force a clean re-render of prices
            setRateTrigger(prev => prev + 1);
          }
        } else {
          console.warn("[Aurelius Ledger] Failed to fetch live rates from public API, using default high-fidelity offsets.");
        }
      } catch (err) {
        console.error("[Aurelius Ledger] Failed to fetch live exchange rates due to a network disruption:", err);
      }
    };

    fetchLiveRates();
    // Refresh every 10 minutes to maintain consistency without spamming the public API
    const interval = setInterval(fetchLiveRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("aurelius_cart");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("aurelius_wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const [compareList, setCompareList] = useState<Product[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>("shop");
  const [currentCategory, setCurrentCategory] = useState<"all" | "bags" | "shoes" | "accessories">("all");
  
  const [activeViewingProduct, setActiveViewingProduct] = useState<Product | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSmartData, setSearchSmartData] = useState<any>(null);
  
  // Checkout success overlay state
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [isCareManualOpen, setIsCareManualOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => PRODUCTS);

  useEffect(() => {
    const fetchCustomProducts = async () => {
      const url = "/api/products";
      const method = "GET";
      
      const fetchDirectFromFirestore = async () => {
        const pathForGetDocs = "products";
        try {
          console.log("[Aurelius Client Trace] Fetching directly from Firestore...");
          const querySnapshot = await getDocs(collection(db, pathForGetDocs));
          const firestoreProds: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            firestoreProds.push({ id: doc.id, ...data });
          });
          console.log("[Aurelius Client Trace] Direct Firestore products loaded:", firestoreProds);
          if (firestoreProds.length > 0) {
            setProducts(() => {
              const mergedMap = new Map<string, Product>();
              PRODUCTS.forEach(p => mergedMap.set(p.id, p));
              firestoreProds.forEach(p => mergedMap.set(p.id, p));
              return Array.from(mergedMap.values());
            });
          }
        } catch (fsErr) {
          console.error("[Aurelius Client Trace] Failed to fetch directly from Firestore:", fsErr);
          handleFirestoreFault(fsErr, OperationType.GET, pathForGetDocs);
        }
      };

      try {
        console.log("[Aurelius Client Trace] Loading custom products from /api/products...");
        const res = await fetch(url);
        
        // Log response headers
        const headersObj: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headersObj[key] = value;
        });

        if (res.status === 204) {
          AureliusLogger.logRequestSuccess({
            url,
            method,
            status: 204,
            headers: headersObj,
            responseBody: { success: true, message: "No content" }
          });
          return null;
        }
        
        const contentType = res.headers.get("content-type") || "";
        console.log(`[Aurelius Client Trace] Response Status: ${res.status} | Content-Type: ${contentType}`);
        
        const rawText = await res.text();
        if (!rawText || rawText.trim() === "") {
          console.warn("[Aurelius Client Trace] Empty response received from /api/products. Falling back to direct Firestore.");
          AureliusLogger.logRequestError({
            url,
            method,
            status: res.status,
            headers: headersObj,
            error: "Empty response body",
            responseBody: ""
          });
          await fetchDirectFromFirestore();
          return;
        }

        if (!contentType.includes("application/json")) {
          const errMsg = `Expected JSON but received: "${contentType}". Falling back to direct Firestore.`;
          console.warn(`[Aurelius Client Trace] ${errMsg}`);
          AureliusLogger.logRequestError({
            url,
            method,
            status: res.status,
            headers: headersObj,
            error: errMsg,
            responseBody: rawText
          });
          await fetchDirectFromFirestore();
          return;
        }

        const result = JSON.parse(rawText);
        console.log("[Aurelius Client Trace] Loaded products payload successfully:", result);

        // Log request success or payload error if failure inside response envelope
        if (res.ok && result && result.success !== false) {
          AureliusLogger.logRequestSuccess({
            url,
            method,
            status: res.status,
            headers: headersObj,
            responseBody: result
          });
        } else {
          AureliusLogger.logRequestError({
            url,
            method,
            status: res.status,
            headers: headersObj,
            error: result?.error || "Failed to load products payload",
            responseBody: result
          });
        }

        // Safely extract the array of products from either a direct list or enveloped { success, data } structure
        const customProds = Array.isArray(result) 
          ? result 
          : (result && result.success && Array.isArray(result.data) ? result.data : []);

        if (customProds && customProds.length > 0) {
          setProducts(() => {
            const mergedMap = new Map<string, Product>();
            PRODUCTS.forEach(p => mergedMap.set(p.id, p));
            customProds.forEach(p => mergedMap.set(p.id, p));
            return Array.from(mergedMap.values());
          });
        } else {
          // If response was empty array but request succeeded, also double check Firestore
          await fetchDirectFromFirestore();
        }
      } catch (e: any) {
        console.warn("[Aurelius Client Trace] Failed to load custom products via API. Falling back to direct Firestore:", e);
        AureliusLogger.logRequestError({
          url,
          method,
          error: e.message || "Failed to make network request",
          stack: e.stack
        });
        await fetchDirectFromFirestore();
      }
    };
    fetchCustomProducts();
  }, []);

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem("aurelius_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("aurelius_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Handle Cart updates
  const handleAddToCart = (product: Product, quantity: number, color: string) => {
    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(
        item => item.product.id === product.id && item.selectedColor === color
      );
      if (existingIdx > -1) {
        const next = [...prevCart];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prevCart, { product, quantity, selectedColor: color }];
    });
    // Visual feedback
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number, color: string) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId && item.selectedColor === color) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const handleRemoveCartItem = (productId: string, color: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedColor === color)));
  };

  // Handle Wishlist updates
  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Handle Product comparison list
  const handleToggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You may compare a maximum of 3 masterpieces concurrently.");
        return prev;
      }
      return [...prev, product];
    });
  };

  // Perform secure sandbox checkout
  const handleCheckout = () => {
    setCart([]); // Clear cart
    setIsCartOpen(false);
    setCheckoutSuccess(true);
  };

  // Handle Search Query filtering
  const handleSearch = (query: string, smartData?: any) => {
    setSearchQuery(query);
    setSearchSmartData(smartData);
  };

  // Newsletter subscription
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  // Filter products list based on search and category parameters
  const getFilteredProducts = () => {
    let list = products;

    // Filter by Category
    if (currentCategory !== "all") {
      list = list.filter(p => p.category === currentCategory);
    }

    // Filter by raw text search query
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      
      // Use AI Smart search properties if available for fuzzy correction matching
      if (searchSmartData && searchSmartData.correctedQuery) {
        const corrected = searchSmartData.correctedQuery.toLowerCase();
        list = products.filter(p => 
          p.name.toLowerCase().includes(corrected) || 
          p.description.toLowerCase().includes(corrected) ||
          p.subcategory.toLowerCase().includes(corrected) ||
          p.features.some(f => f.toLowerCase().includes(corrected))
        );
      } else {
        list = list.filter(p => 
          p.name.toLowerCase().includes(queryLower) || 
          p.description.toLowerCase().includes(queryLower) ||
          p.subcategory.toLowerCase().includes(queryLower)
        );
      }
    }

    return list;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-[#111111] text-[#FCFCFA] font-sans relative flex flex-col justify-between">
      
      {/* Dynamic top bar promotion (Rolls-Royce Exclusivity) */}
      <div id="promotional-strip" className="bg-[#111111] text-[#C5A05A] text-[9px] tracking-[0.3em] uppercase py-2 text-center border-b border-[#C5A05A]/25 font-mono">
        <span>Complimentary DHL Priority Worldwide Courier On Orders Over $300 • Lifetime Restoration Guarantee</span>
      </div>

      {/* Global Navigation Header */}
      <Header
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setActiveTab("account")}
        onOpenAdmin={() => setActiveTab("admin")}
        onSelectCategory={(cat) => { setCurrentCategory(cat); setActiveTab("shop"); }}
        currentCategory={currentCategory}
        onSearch={handleSearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        onCurrencyChange={setCurrency}
        lastSynced={lastSynced}
      />

      {/* Primary Content Switcher */}
      <main className="flex-grow">
        {activeTab === "shop" ? (
          <div>
            {/* Cinematic Hero: Only show if search is blank to preserve visual elegance */}
            {!searchQuery && currentCategory === "all" && (
              <Hero 
                onExploreShop={() => {
                  const el = document.getElementById("atelier-catalog-stage");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                onExploreCraft={() => setActiveTab("craft")}
              />
            )}

            {/* Interactive Showcase / Catalog Area */}
            <div id="atelier-catalog-stage" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              
              {/* Category section indicators */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-800 pb-5 mb-10">
                <div>
                  <span className="font-mono text-[9px] tracking-[0.35em] text-[#C5A05A] uppercase block mb-1">
                    Atelier Handcrafts
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3.5xl tracking-tight text-[#FCFCFA] font-medium capitalize">
                    {currentCategory === "all" ? "The Complete Collection" : `${currentCategory} Collection`}
                  </h2>
                </div>
                
                {/* Search result stats */}
                {searchQuery && (
                  <div className="text-xs text-gray-400 font-mono mt-2 sm:mt-0">
                    Showing {filteredProducts.length} masterpieces for query: "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Empty state */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-[#1A1A1A] rounded border border-dashed border-gray-800">
                  <p className="font-serif text-lg font-medium text-gray-300 mb-2">No matching masterpieces</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Try another search query or return to our unified collections category folders.
                  </p>
                  <button 
                    onClick={() => handleSearch("")}
                    className="mt-6 bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white text-[10px] tracking-widest uppercase font-semibold px-4 py-2.5 rounded transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                /* Products Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((prod, index) => (
                      <motion.div
                        key={`${currentCategory}-${searchQuery}-${prod.id}`}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.45,
                          ease: [0.16, 1, 0.3, 1],
                          delay: Math.min(index * 0.05, 0.3)
                        }}
                        className="h-full"
                      >
                        <ProductCard
                          product={prod}
                          onQuickView={(p) => setActiveViewingProduct(p)}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={wishlist.includes(prod.id)}
                          onToggleCompare={handleToggleCompare}
                          isCompared={!!compareList.find(p => p.id === prod.id)}
                          currency={currency}
                          onAddToCart={handleAddToCart}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>

            {/* Brand Storytelling Timeline Banner (Promotes leather heritage) */}
            {!searchQuery && currentCategory === "all" && (
              <div id="brand-story-stage" className="bg-[#2F241F] text-[#F8F5EF] py-20 border-t border-b border-[#C5A05A]/25 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Cinematic narrative */}
                    <div className="lg:col-span-7 space-y-6">
                      <span className="font-mono text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block">Atelier Philosophy</span>
                      <h2 className="font-serif text-3xl sm:text-4.5xl font-medium tracking-tight leading-tight">
                        Built for Decades of <br />
                        <span className="italic gold-gradient-text">Tactile Legacy</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl font-light">
                        Our full-grain hides bypass modern rapid chemical tanks. Instead, we pursue traditional vegetable tanning in Tuscany, utilizing organic chestnut bark and pure olive oils. It is a slow, 24-day pilgrimage. The result is a structure that lives and responds, recording every touch, flight, and corporate battle.
                      </p>
                      
                      {/* Timeline points */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs font-sans">
                        <div>
                          <span className="font-serif text-base text-[#C5A05A] font-semibold block mb-1">01. Selection</span>
                          <span className="text-gray-400">Hand-vetting raw full-grain leather hides exceeding 2.0mm gauge.</span>
                        </div>
                        <div>
                          <span className="font-serif text-base text-[#C5A05A] font-semibold block mb-1">02. Tanning</span>
                          <span className="text-gray-400">24 days of cold chestnut veg-tan immersion. Zero synthetic plastics.</span>
                        </div>
                        <div>
                          <span className="font-serif text-base text-[#C5A05A] font-semibold block mb-1">03. Stitching</span>
                          <span className="text-gray-400">German high-tension nylon thread lines with double drop-edges.</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Rich Leather Texture Image Visual */}
                    <div className="lg:col-span-5 relative aspect-square bg-[#111111] rounded overflow-hidden border border-[#C5A05A]/35 shadow-2xl">
                      <img 
                        src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800" 
                        alt="Tannery Workshop" 
                        className="w-full h-full object-cover opacity-65"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                        <span className="text-[10px] font-mono text-[#C5A05A] tracking-wider uppercase mb-1">Florence workshop, Italy</span>
                        <p className="font-serif text-sm font-semibold text-white">"Quality is the accumulation of slow decisions."</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Compare Bar (Dynamic drawer at bottom if items selected) */}
            {compareList.length > 0 && (
              <div className="fixed bottom-0 inset-x-0 bg-[#111111] text-white border-t border-[#C5A05A]/45 py-4 px-6 z-35 font-sans shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-serif text-xs text-[#C5A05A] font-semibold uppercase tracking-wider">Masterpiece Compare ({compareList.length})</span>
                    <div className="flex space-x-2">
                      {compareList.map(p => (
                        <div key={p.id} className="relative bg-[#222] border border-gray-800 rounded p-1.5 flex items-center space-x-2 text-[10px]">
                          <img src={p.image} className="w-6 h-6 object-cover rounded" referrerPolicy="no-referrer" />
                          <span className="font-serif truncate max-w-28">{p.name}</span>
                          <button 
                            onClick={() => handleToggleCompare(p)}
                            className="p-0.5 text-gray-500 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <button 
                      onClick={() => setCompareList([])}
                      className="text-gray-400 hover:text-white uppercase font-mono text-[10px]"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={() => {
                        const message = compareList.map(p => 
                          `• ${p.name} (${formatPrice(p.price, currency)}): Rating ${p.rating}, Dimensions ${p.dimensions}, Leather: ${p.category === 'bags' ? 'Crazy Horse Full Grain' : 'Hand-painted Calfskin'}`
                        ).join("\n");
                        alert(`Atelier Comparison Sheet:\n\n${message}`);
                      }}
                      className="bg-[#C5A05A] text-black hover:bg-[#A5673F] hover:text-white px-4 py-2 uppercase font-semibold rounded text-[10px] tracking-wider transition-colors"
                    >
                      Compare Specifications Sheet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "blog" ? (
          <BlogAtelier />
        ) : activeTab === "craft" ? (
          <CraftJourney />
        ) : activeTab === "tracker" ? (
          <OrderTracker />
        ) : activeTab === "lookbook" ? (
          <AtelierLookbook
            onQuickView={(p) => setActiveViewingProduct(p)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            currency={currency}
          />
        ) : activeTab === "account" ? (
          <AccountDashboard currency={currency} />
        ) : (
          <AdminPanel 
            products={products}
            onProductAdded={(newProd) => setProducts(prev => {
              const filtered = prev.filter(p => p.id !== newProd.id);
              return [...filtered, newProd];
            })}
            onProductDeleted={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
            onProductUpdated={(updatedProd) => setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p))}
          />
        )}
      </main>

      {/* IMMERSIVE NEWSLETTER FOOTER VIP BOARD */}
      <footer id="main-footer" className="bg-[#111111] text-white border-t border-[#C5A05A]/25 pt-16 pb-12 font-sans mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/10 pb-12 mb-12">
            
            {/* COLUMN 1: Brand Info (Span 5) */}
            <div className="md:col-span-5 space-y-4">
              <span className="font-serif text-2xl tracking-[0.25em] font-bold gold-gradient-text">AURELIUS</span>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-light">
                An international heritage atelier crafting peerless full-grain leather goods for high-profile business leaders, legal professionals, and luxury nomads worldwide.
              </p>
              <div className="flex space-x-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest pt-2">
                <span>NEW YORK</span>
                <span>•</span>
                <span>MILAN</span>
                <span>•</span>
                <span>LONDON</span>
              </div>
            </div>

            {/* COLUMN 2: Newsletter sign up (Span 4) */}
            <div className="md:col-span-4 space-y-4">
              <span className="text-[10px] tracking-[0.25em] text-[#C5A05A] uppercase font-bold font-mono">Join The Sterling VIP Club</span>
              <p className="text-xs text-gray-400 font-light">
                Receive private reserve allocations, product unboxing previews, and custom care invites.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex space-x-2 text-xs">
                <input
                  type="email"
                  placeholder="Your Corporate Email..."
                  className="bg-[#222] text-white placeholder-gray-500 border border-white/15 px-3 py-2 outline-none focus:border-[#C5A05A] rounded flex-grow text-xs font-sans"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-4 py-2 font-semibold uppercase tracking-wider text-[10px] transition-colors rounded"
                >
                  Join
                </button>
              </form>

              {newsletterSuccess && (
                <div className="text-[#C5A05A] text-[10.5px] italic mt-1 flex items-center">
                  <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                  Your email has been added to our private ledger. Welcome to the Club.
                </div>
              )}
            </div>

            {/* COLUMN 3: Core links (Span 3) */}
            <div className="md:col-span-3 space-y-3 text-xs font-mono text-gray-400 uppercase tracking-widest text-left md:text-right">
              <span className="text-[10px] text-[#C5A05A] uppercase tracking-[0.25em] block font-bold mb-3 font-sans">Resources</span>
              <a href="#about" onClick={(e) => { e.preventDefault(); setActiveTab("blog"); }} className="block hover:text-white transition-colors">The Journal</a>
              <button onClick={() => setIsCareManualOpen(true)} className="block hover:text-white transition-colors w-full text-left md:text-right cursor-pointer">Care Manual</button>
              <a href="#warranty" onClick={(e) => { e.preventDefault(); alert("We support our products for life. If stitch lines break under ordinary use, we repair it unconditionally."); }} className="block hover:text-white transition-colors">Lifetime Warranty</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); alert("Direct VIP assistance: call +1 (800) 555-0199 or email concierge@aureliusleather.com"); }} className="block hover:text-[#C5A05A] transition-colors text-[#C5A05A]">Atelier Concierge Line</a>
            </div>

          </div>

          {/* Bottom regulatory / copy block */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-gray-500 text-[10px] font-mono uppercase tracking-widest gap-4">
            <span>© 2026 Aurelius Leather Lifestyle Brand. All rights reserved.</span>
            <div className="flex space-x-6">
              <span>PCI-Compliant</span>
              <span>256-Bit SSL Secured</span>
              <span>Atelier Verified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* OVERLAY: Slide-out Side Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutModalOpen(true);
          }}
          onAddProductDirect={(prod, qty, col) => handleAddToCart(prod, qty, col)}
          currency={currency}
        />
      )}

      {/* OVERLAY: Payment Gateway Checkout Sandbox */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onPaymentSuccess={handleCheckout}
        cart={cart}
        currency={currency}
      />

      {/* OVERLAY: Full Detailed Product Modal */}
      {activeViewingProduct && (
        <ProductDetailModal
          product={activeViewingProduct}
          onClose={() => setActiveViewingProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={wishlist.includes(activeViewingProduct.id)}
          currency={currency}
        />
      )}

      {/* FLOATING WIDGET: AI Luxury Concierge */}
      <AIConcierge 
        currentViewingProduct={activeViewingProduct}
        onOpenQuickView={(p) => setActiveViewingProduct(p)}
      />

      {/* FLOATING WIDGET: Aurelius Interceptor Dev Console */}
      <AureliusDebugConsole />

      {/* OVERLAY: Care Manual and Leather Restoration Masterclass */}
      <CareManualModal
        isOpen={isCareManualOpen}
        onClose={() => setIsCareManualOpen(false)}
      />

      {/* OVERLAY DIALOG: Checkout Success (Simulates order completion beautifully) */}
      {checkoutSuccess && (
        <div className="fixed inset-0 z-50 bg-[#111111]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-[#111] max-w-md w-full rounded p-6 sm:p-8 border border-[#C5A05A]/40 shadow-2xl text-center">
            
            <div className="h-16 w-16 bg-[#2F241F]/10 text-[#C5A05A] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#C5A05A]/30">
              <ShieldCheck className="h-9 w-9 text-[#C5A05A] animate-pulse" />
            </div>

            <span className="font-mono text-[9px] tracking-[0.25em] text-[#A5673F] uppercase block mb-1">Commission Confirmed</span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-luxury-black mb-3">YOUR ORDER IS IN TRANSIT</h2>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-6 font-sans">
              Thank you for trusting Aurelius. Your credit card allocation has been secured. Our Tuscan workshop has been dispatched to allocate, pack, and wax-seal your leather masterpieces.
            </p>

            {/* Simulated order code */}
            <div className="bg-[#F8F5EF] p-4 rounded border border-[#C5A05A]/15 font-mono text-[10.5px] text-gray-700 mb-6 space-y-1 text-left">
              <div className="flex justify-between"><span>Registry Order:</span> <span className="font-bold text-black">AUR-{Math.floor(1000 + Math.random() * 9000)}</span></div>
              <div className="flex justify-between"><span>Courier Partner:</span> <span className="font-bold text-black">DHL Priority Express</span></div>
              <div className="flex justify-between"><span>Estimated Delivery:</span> <span className="font-bold text-black">2 - 4 Business Days</span></div>
            </div>

            <button
              onClick={() => setCheckoutSuccess(false)}
              className="w-full bg-[#111] hover:bg-[#C5A05A] hover:text-black text-white text-xs tracking-widest uppercase font-semibold py-3.5 rounded transition-all shadow-md"
            >
              Continue Legacy Travels
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC CURRENCY SUGGESTION TOAST */}
      <AnimatePresence>
        {suggestedCurrency && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-[#161616]/95 border border-[#C5A05A]/30 rounded p-5 shadow-2xl backdrop-blur-md text-white font-sans flex items-start justify-between gap-4"
          >
            <div className="flex-1 space-y-2">
              <span className="font-mono text-[8px] tracking-[0.25em] text-[#C5A05A] uppercase block">
                Locale Match Detected
              </span>
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-white">
                Aurelius Tailored Curation
              </h4>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed">
                We detected your locale preference and selected <strong className="text-white font-mono">{suggestedCurrency} ({CURRENCY_MAP[suggestedCurrency]?.symbol})</strong> to offer you a seamless boutique experience.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    localStorage.setItem("aurelius_currency", suggestedCurrency);
                    setSuggestedCurrency(null);
                  }}
                  className="px-3 py-1.5 bg-[#C5A05A] hover:bg-[#b98b5d] text-black text-[10px] tracking-wider uppercase font-mono font-bold rounded-sm transition-all"
                >
                  Keep {suggestedCurrency}
                </button>
                <button
                  onClick={() => {
                    setCurrency("USD");
                    localStorage.setItem("aurelius_currency", "USD");
                    setSuggestedCurrency(null);
                  }}
                  className="px-2.5 py-1.5 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-gray-800 text-[10px] tracking-wider uppercase font-mono rounded-sm transition-all"
                >
                  Switch to USD ($)
                </button>
              </div>
            </div>
            <button
              onClick={() => setSuggestedCurrency(null)}
              className="text-gray-500 hover:text-white transition-colors text-base font-mono leading-none"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
