import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, Briefcase, Sparkles, Mic, X, ChevronRight, Settings, Globe } from "lucide-react";
import { CartItem, CurrencyCode } from "../types";

interface HeaderProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (cat: "all" | "bags" | "shoes" | "accessories") => void;
  currentCategory: "all" | "bags" | "shoes" | "accessories";
  onSearch: (query: string, smartData?: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  lastSynced?: Date | null;
}

export default function Header({
  cart,
  onOpenCart,
  onOpenAccount,
  onOpenAdmin,
  onSelectCategory,
  currentCategory,
  onSearch,
  activeTab,
  setActiveTab,
  currency,
  onCurrencyChange,
  lastSynced
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [smartResults, setSmartResults] = useState<any>(null);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Close search recommendations on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger predictive AI search when typing stops
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSmartResults(null);
      onSearch("", null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAI(true);
      try {
        const response = await fetch("/api/ai/smart-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery })
        });
        const data = await response.json();
        setSmartResults(data);
        onSearch(searchQuery, data);
      } catch (e) {
        console.error("AI Search fail:", e);
        onSearch(searchQuery, null);
      } finally {
        setIsSearchingAI(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle voice search simulation
  const startVoiceSearch = () => {
    setIsListening(true);
    setSearchQuery("Listening...");
    setTimeout(() => {
      const phrases = ["vintage leather travel bag", "handmade shoes", "accessories under 100 dollars"];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setSearchQuery(randomPhrase);
      setIsListening(false);
    }, 2000);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSmartResults(null);
    onSearch("", null);
    setIsSearchFocused(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full bg-[#111111]/95 text-white border-b border-[#C5A05A]/20 backdrop-blur-md shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex-shrink-0 cursor-pointer flex items-center space-x-2" onClick={() => { setActiveTab("shop"); onSelectCategory("all"); }}>
            <span className="font-serif text-2xl tracking-[0.25em] font-medium gold-gradient-text">AURELIUS</span>
            <span className="hidden sm:inline-block font-mono text-[9px] tracking-widest text-[#C5A05A] uppercase border-l border-[#C5A05A]/30 pl-2">Atelier</span>
          </div>

          {/* Editorial Navigation */}
          <nav className="hidden lg:flex space-x-8 font-sans text-xs tracking-widest uppercase font-medium">
            <button
              onClick={() => { setActiveTab("shop"); onSelectCategory("all"); }}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "shop" && currentCategory === "all" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              The Shop
            </button>
            <button
              onClick={() => { setActiveTab("shop"); onSelectCategory("bags"); }}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "shop" && currentCategory === "bags" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              Travel Bags
            </button>
            <button
              onClick={() => { setActiveTab("shop"); onSelectCategory("shoes"); }}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "shop" && currentCategory === "shoes" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              Shoes
            </button>
            <button
              onClick={() => { setActiveTab("shop"); onSelectCategory("accessories"); }}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "shop" && currentCategory === "accessories" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              Accessories
            </button>
            <button
              onClick={() => setActiveTab("craft")}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "craft" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              The Craft
            </button>
            <button
              onClick={() => setActiveTab("lookbook")}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "lookbook" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              The Lookbook
            </button>
            <button
              onClick={() => setActiveTab("blog")}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "blog" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              The Journal
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b ${activeTab === "tracker" ? "border-[#C5A05A] text-[#C5A05A]" : "border-transparent text-gray-300"}`}
            >
              Order Tracker
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`pb-1 hover:text-[#C5A05A] transition-colors border-b font-semibold text-amber-500 ${activeTab === "admin" ? "border-[#C5A05A]" : "border-transparent"}`}
            >
              Admin Portal
            </button>
          </nav>

          {/* Custom Search & Icons */}
          <div className="flex items-center space-x-4">
            
            {/* Predictive Intelligent Search Bar */}
            <div ref={searchContainerRef} className="relative hidden md:block w-64 lg:w-80">
              <div className="relative flex items-center bg-[#222222] border border-[#C5A05A]/25 rounded px-3 py-1.5 focus-within:border-[#C5A05A] focus-within:ring-1 focus-within:ring-[#C5A05A] transition-all">
                <Search className="h-4 w-4 text-[#C5A05A] mr-2" />
                <input
                  type="text"
                  placeholder="Predictive Smart Search..."
                  className="bg-transparent text-xs w-full outline-none text-white placeholder-gray-400 font-sans"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
                {searchQuery ? (
                  <button onClick={clearSearch} className="p-0.5 hover:text-[#C5A05A] text-gray-400">
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <button onClick={startVoiceSearch} className={`p-0.5 hover:text-[#C5A05A] text-gray-400 ${isListening ? "animate-pulse text-[#C5A05A]" : ""}`}>
                    <Mic className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Predictive Search Suggestions Dropdown */}
              {isSearchFocused && (searchQuery.trim() || smartResults) && (
                <div className="absolute right-0 top-11 w-full bg-[#1A1A1A] border border-[#C5A05A]/30 rounded shadow-2xl z-50 p-4 font-sans text-xs">
                  {isSearchingAI ? (
                    <div className="flex items-center space-x-2 py-2 text-gray-400">
                      <Sparkles className="h-3.5 w-3.5 text-[#C5A05A] animate-spin" />
                      <span>AI consulting our atelier catalog...</span>
                    </div>
                  ) : smartResults ? (
                    <div>
                      {/* Typo Correction Indicator */}
                      {smartResults.correctedQuery && smartResults.correctedQuery.toLowerCase() !== searchQuery.toLowerCase() && (
                        <div className="text-[10px] text-gray-400 mb-2 italic">
                          Showing results for: <span className="text-[#C5A05A] font-medium font-serif">{smartResults.correctedQuery}</span>
                        </div>
                      )}
                      
                      {/* Matching Categories */}
                      <div className="mb-3">
                        <span className="text-[10px] tracking-widest text-[#C5A05A] uppercase font-semibold block mb-1">Inferred Intent</span>
                        <div className="flex items-center space-x-2 bg-[#2E241F] px-2 py-1 rounded text-[10px] border border-[#7A4E2D]/40 text-[#F8F5EF] w-fit">
                          <Sparkles className="h-3 w-3 text-[#C5A05A]" />
                          <span className="capitalize">{smartResults.intent?.replace("_", " ")}</span>
                        </div>
                      </div>

                      {/* Matching Tags */}
                      {smartResults.tags && smartResults.tags.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] tracking-widest text-[#C5A05A] uppercase font-semibold block mb-1">Atelier Tags</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {smartResults.tags.map((tag: string) => (
                              <span
                                key={tag}
                                onClick={() => { setSearchQuery(tag); }}
                                className="bg-[#2A2A2A] text-gray-300 hover:text-white hover:bg-[#3A3A3A] cursor-pointer px-2 py-0.5 rounded text-[10px] transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Suggestions */}
                      {smartResults.suggestedColors && smartResults.suggestedColors[0] !== "any" && (
                        <div>
                          <span className="text-[10px] tracking-widest text-[#C5A05A] uppercase font-semibold block mb-1 font-serif">Recommended Hides</span>
                          <div className="flex space-x-1.5 mt-1">
                            {smartResults.suggestedColors.map((color: string) => (
                              <span key={color} className="text-[10px] bg-[#333] border border-gray-600 rounded px-1.5 py-0.5 capitalize text-gray-200">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">Type to consult our digital concierge...</div>
                  )}
                </div>
              )}
            </div>

            {/* Currency Switcher */}
            <div className="group relative flex items-center space-x-1 bg-[#222222]/80 border border-[#C5A05A]/25 rounded-md px-2 py-1.5 focus-within:border-[#C5A05A] transition-colors hover:bg-[#2A2A2A]">
              <Globe className="h-3.5 w-3.5 text-[#C5A05A]" />
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="bg-transparent text-[10px] font-mono font-bold tracking-wider text-white outline-none border-none pr-1 cursor-pointer focus:ring-0 uppercase animate-none"
              >
                <option value="USD" className="bg-[#111111] text-white">USD ($)</option>
                <option value="EUR" className="bg-[#111111] text-white">EUR (€)</option>
                <option value="GBP" className="bg-[#111111] text-white">GBP (£)</option>
                <option value="JPY" className="bg-[#111111] text-white">JPY (¥)</option>
                <option value="CAD" className="bg-[#111111] text-white">CAD (CA$)</option>
                <option value="AUD" className="bg-[#111111] text-white">AUD (A$)</option>
                <option value="GHS" className="bg-[#111111] text-white">GHS (GH₵)</option>
              </select>
              
              {/* Tooltip */}
              <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                <div className="whitespace-nowrap rounded bg-[#111111] border border-[#C5A05A]/30 px-2 py-1 text-[9px] font-mono text-gray-300 shadow-xl">
                  {lastSynced ? (
                    <span>Synced: {lastSynced.toLocaleTimeString()}</span>
                  ) : (
                    <span>Using default rates</span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Panel Icon */}
            <button
              onClick={onOpenAdmin}
              className={`p-2 rounded-full hover:text-[#C5A05A] hover:bg-[#222] transition-all relative ${activeTab === "admin" ? "text-[#C5A05A] bg-[#222]" : "text-gray-300"}`}
              title="Atelier Admin Dashboard"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Profile / Account Icon */}
            <button
              onClick={onOpenAccount}
              className={`p-2 rounded-full hover:text-[#C5A05A] hover:bg-[#222] transition-all relative ${activeTab === "account" ? "text-[#C5A05A] bg-[#222]" : "text-gray-300"}`}
              title="Executive Lounge"
            >
              <User className="h-5 w-5" />
            </button>

            {/* Cart Icon with Counter */}
            <button
              onClick={onOpenCart}
              className="p-2 rounded-full text-gray-300 hover:text-[#C5A05A] hover:bg-[#222] transition-all relative"
              title="Shopping Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-black bg-[#C5A05A] rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            
          </div>
        </div>

        {/* Mobile Navigation / Category Tabs */}
        <div className="flex lg:hidden items-center justify-center space-x-6 py-3 border-t border-[#C5A05A]/10 text-[10px] tracking-widest uppercase text-gray-400 font-medium">
          <button
            onClick={() => { setActiveTab("shop"); onSelectCategory("all"); }}
            className={currentCategory === "all" && activeTab === "shop" ? "text-[#C5A05A] font-semibold" : ""}
          >
            All
          </button>
          <button
            onClick={() => { setActiveTab("shop"); onSelectCategory("bags"); }}
            className={currentCategory === "bags" && activeTab === "shop" ? "text-[#C5A05A] font-semibold" : ""}
          >
            Bags
          </button>
          <button
            onClick={() => { setActiveTab("shop"); onSelectCategory("shoes"); }}
            className={currentCategory === "shoes" && activeTab === "shop" ? "text-[#C5A05A] font-semibold" : ""}
          >
            Shoes
          </button>
          <button
            onClick={() => { setActiveTab("shop"); onSelectCategory("accessories"); }}
            className={currentCategory === "accessories" && activeTab === "shop" ? "text-[#C5A05A] font-semibold" : ""}
          >
            Accessories
          </button>
          <button
            onClick={() => setActiveTab("craft")}
            className={activeTab === "craft" ? "text-[#C5A05A] font-semibold" : ""}
          >
            The Craft
          </button>
          <button
            onClick={() => setActiveTab("lookbook")}
            className={activeTab === "lookbook" ? "text-[#C5A05A] font-semibold" : ""}
          >
            Lookbook
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={activeTab === "blog" ? "text-[#C5A05A] font-semibold" : ""}
          >
            Journal
          </button>
          <button
            onClick={() => setActiveTab("tracker")}
            className={activeTab === "tracker" ? "text-[#C5A05A] font-semibold" : ""}
          >
            Tracker
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={activeTab === "admin" ? "text-amber-500 font-bold" : "text-amber-600/80"}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
}
