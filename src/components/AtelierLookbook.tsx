import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Heart, Eye, ArrowRight, ShoppingBag, MapPin, 
  ChevronLeft, ChevronRight, Play, Pause, Compass, Layers, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CurrencyCode, formatPrice } from "../types";
import { PRODUCTS } from "../data";

interface LookbookScenario {
  id: string;
  title: string;
  theme: "travel" | "corporate" | "artisanal" | "escape";
  subtitle: string;
  description: string;
  location: string;
  image: string;
  lighting: string;
  stylingAdvice: string;
  hideHarmony: string;
  featuredProductIds: string[];
}

const LOOKBOOK_SCENARIOS: LookbookScenario[] = [
  {
    id: "grand-voyage",
    title: "The Grand Voyage",
    theme: "travel",
    subtitle: "A luxury nomad preparing for a weekend expedition in a historic European railway terminal.",
    description: "Built for those who travel with purpose and style. Our travel duffels resting gracefully on vintage dark oak benches, absorbing the warm morning transit light. As the locomotive approaches, the rich saddle-brown leather glows, representing centuries of vegetable-tanning heritage.",
    location: "Gare de Lyon, Paris, France",
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=1200",
    lighting: "Warm golden-hour side lighting, highlights the deep grain oil texture.",
    stylingAdvice: "Pair the Navigator Duffel with a slate grey double-breasted woolen overcoat and hand-painted calfskin dress shoes.",
    hideHarmony: "Italian first-layer Crazy Horse leather with high wax-absorption characteristics.",
    featuredProductIds: ["nav-duffel", "aviator-watch"]
  },
  {
    id: "boardroom-briefing",
    title: "The Corporate Ascent",
    theme: "corporate",
    subtitle: "An executive preparing for a decisive corporate venture in a sleek high-rise boardroom.",
    description: "Command respect in every square inch of the workspace. The Aurelius Executive Briefcase sits slim, architectural, and completely organized against a backdrop of modern steel, glass, and skyline views. Hand-burnished edges capture the ambient daylight, projecting silent, refined authority.",
    location: "Hudson Yards, Manhattan, USA",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200",
    lighting: "Bright overhead diffuse skylight, accentuates hand-painted edge profiles.",
    stylingAdvice: "Complements navy bespoke Savile Row tailored suits and dark brown Sovereign Oxford dress shoes.",
    hideHarmony: "English vegetable-tanned firm calfskin, scratch-resistant and highly polished.",
    featuredProductIds: ["exec-briefcase", "heritage-wallet", "sovereign-oxford"]
  },
  {
    id: "atelier-craft",
    title: "Atelier Legacy Craft",
    theme: "artisanal",
    subtitle: "An intimate look inside our sun-drenched Tuscan workshop as an artisan double-stitches a duffle.",
    description: "Where time slows to a beautiful crawl. This scenario showcases our master artisans handcrafting our signature travel duffels using century-old French saddle needles and custom beeswax thread. Every hammer strike, needle pierce, and edge burnish is a quiet dedication to tactile permanence.",
    location: "Santa Croce sull'Arno, Tuscany, Italy",
    image: "https://images.unsplash.com/photo-1513829096960-ef229e69dac4?auto=format&fit=crop&q=80&w=1200",
    lighting: "Soft ambient wooden workshop window rays, catching authentic leather dust.",
    stylingAdvice: "Keep your leather hydrated using our premium Beeswax Care kit once every six months.",
    hideHarmony: "Organic chestnut-bark tanned heavy cowhide leather, 2.4mm gauge weight.",
    featuredProductIds: ["leathfocus-duffle", "care-kit"]
  },
  {
    id: "coastal-escape",
    title: "The Sophisticated Retreat",
    theme: "escape",
    subtitle: "A quiet, misty oceanfront cabin with travel gear resting near a wood-burning hearth.",
    description: "A weekend escape from the metropolitan noise. The Overlander Weekend Bag is companion to high-end vintage denim and premium suede Chelsea boots, sitting elegantly in a coastal retreat. Features a ventilated shoe pocket, keeping your fine footwear distinct from crisp linens.",
    location: "Big Sur Coastline, California, USA",
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=1200",
    lighting: "Misty coastal daylight, deep shadows, cozy cabin interior glow.",
    stylingAdvice: "Style the Overlander with lightweight beige linen shirts, raw indigo denim, and cognac suede Chelsea boots.",
    hideHarmony: "Calfskin full-grain soft-profile leather with integrated water-repellent protective coat.",
    featuredProductIds: ["overlander-weekend", "chelsea-boot", "nomad-sneaker"]
  }
];

interface AtelierLookbookProps {
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, color: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
  currency?: CurrencyCode;
}

export default function AtelierLookbook({
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  currency = "USD"
}: AtelierLookbookProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [filterTheme, setFilterTheme] = useState<"all" | "travel" | "corporate" | "artisanal" | "escape">("all");
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  const activeScenario = LOOKBOOK_SCENARIOS[activeIdx];

  // Filtered scenario list
  const filteredScenarios = LOOKBOOK_SCENARIOS.filter(s => filterTheme === "all" || s.theme === filterTheme);

  // Handle auto slideshow rotation
  useEffect(() => {
    if (isPlaying) {
      const stepTime = 100; // ms
      const totalTime = 7000; // 7s slide duration
      const increment = (stepTime / totalTime) * 100;

      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Next slide
            setActiveIdx(current => (current + 1) % LOOKBOOK_SCENARIOS.length);
            return 0;
          }
          return prev + increment;
        });
      }, stepTime);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, activeIdx]);

  const handleNext = () => {
    setProgress(0);
    setActiveIdx(current => (current + 1) % LOOKBOOK_SCENARIOS.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setActiveIdx(current => (current - 1 + LOOKBOOK_SCENARIOS.length) % LOOKBOOK_SCENARIOS.length);
  };

  const selectScenario = (id: string) => {
    setProgress(0);
    const idx = LOOKBOOK_SCENARIOS.findIndex(s => s.id === id);
    if (idx !== -1) {
      setActiveIdx(idx);
    }
  };

  // Get matching product objects
  const getFeaturedProducts = (): Product[] => {
    return activeScenario.featuredProductIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
  };

  const featuredProducts = getFeaturedProducts();

  return (
    <div id="atelier-lookbook-stage" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-white">
      
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="font-mono text-[9px] tracking-[0.4em] text-[#C5A05A] uppercase block mb-2">
          Immersive Lifestyle Catalog
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl tracking-tight text-white font-medium mb-4">
          The Aurelius Lookbook
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
          Walk through high-resolution, cinematic scenarios capturing our Tuscan and English handcrafts during moments of executive action, trans-global voyages, and quiet wilderness retreats.
        </p>
      </div>

      {/* Themes Filter & Slideshow Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-800 pb-5 mb-8 gap-4">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2.5 text-[10px] uppercase tracking-widest font-mono">
          {(["all", "travel", "corporate", "artisanal", "escape"] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => {
                setFilterTheme(theme);
                // Reset index to first match
                const match = LOOKBOOK_SCENARIOS.findIndex(s => theme === "all" || s.theme === theme);
                if (match !== -1) {
                  setActiveIdx(match);
                  setProgress(0);
                }
              }}
              className={`px-3.5 py-1.5 rounded transition-all duration-300 border cursor-pointer ${
                filterTheme === theme 
                  ? "bg-[#C5A05A] border-[#C5A05A] text-black font-semibold" 
                  : "bg-transparent border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>

        {/* Play/Pause Autoplay Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-neutral-900 border border-gray-800 px-3 py-1 rounded text-xs text-gray-400">
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="hover:text-white transition-colors"
              title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 text-[#C5A05A]" /> : <Play className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            <span className="text-[10px] font-mono tracking-wider">
              {isPlaying ? "AUTOPLAYING" : "PAUSED"}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button 
              onClick={handlePrev}
              className="p-1.5 rounded bg-neutral-900 border border-gray-850 hover:border-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 rounded bg-neutral-900 border border-gray-850 hover:border-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Autoplay progress bar */}
      {isPlaying && (
        <div className="w-full h-[2px] bg-gray-900 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#C5A05A] to-[#A5673F] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Cinematic Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Aspect: Majestic Lifestyle Canvas (Col-span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-video sm:aspect-[16/10] bg-[#141414] rounded overflow-hidden border border-[#C5A05A]/25 shadow-2xl group">
            
            {/* Main high-res lifestyle image with animation */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeScenario.id}
                src={activeScenario.image}
                alt={activeScenario.title}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[6s] ease-out"
                referrerPolicy="no-referrer"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 0.8, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
            </AnimatePresence>

            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/50 pointer-events-none" />

            {/* Scenario Metadata Tag */}
            <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm border border-[#C5A05A]/35 px-3 py-1.5 rounded flex items-center space-x-2">
              <Compass className="h-3.5 w-3.5 text-[#C5A05A]" />
              <span className="text-[9px] font-mono tracking-widest text-[#C5A05A] uppercase font-bold">
                {activeScenario.theme} scene
              </span>
            </div>

            {/* Geographical Location Overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-2.5 py-1.25 rounded text-[10px] font-mono text-gray-300 flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-red-400" />
              <span>{activeScenario.location}</span>
            </div>

            {/* Interactive Image Hotspots "Showcase Info" */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <button
                  onMouseEnter={() => setHoveredHotspot("main")}
                  onMouseLeave={() => setHoveredHotspot(null)}
                  className="h-6 w-6 rounded-full bg-[#C5A05A] text-black flex items-center justify-center font-bold text-xs animate-ping shadow-lg shadow-[#C5A05A]/50 relative cursor-default"
                >
                  +
                </button>
                <div className="absolute h-6 w-6 rounded-full bg-[#C5A05A] text-black flex items-center justify-center font-bold text-xs top-0 left-0 cursor-default">
                  +
                </div>
                {hoveredHotspot === "main" && (
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 w-48 bg-black/90 border border-[#C5A05A]/45 rounded p-3 text-[11px] leading-relaxed shadow-2xl backdrop-blur-md z-30">
                    <span className="font-mono text-[8px] tracking-wider text-[#C5A05A] uppercase block mb-1">Tactile Focus</span>
                    <p className="text-gray-200">Featured leather is naturally veg-tanned and retains active surface grain structures, reacting beautifully with sunlight and hand oil.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Slide Info Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 space-y-2 pointer-events-auto">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[#C5A05A] uppercase font-bold block">
                Scenario {LOOKBOOK_SCENARIOS.indexOf(activeScenario) + 1} of {LOOKBOOK_SCENARIOS.length}
              </span>
              <h2 className="font-serif text-xl sm:text-3xl font-medium tracking-tight text-white">
                {activeScenario.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-xl font-light font-sans">
                {activeScenario.subtitle}
              </p>
            </div>

          </div>

          {/* Thumbnail Strip Gallery Selector */}
          <div className="grid grid-cols-4 gap-4">
            {LOOKBOOK_SCENARIOS.map((scen, index) => {
              const isActive = index === activeIdx;
              return (
                <button
                  key={scen.id}
                  onClick={() => selectScenario(scen.id)}
                  className={`relative aspect-video rounded overflow-hidden border transition-all cursor-pointer ${
                    isActive 
                      ? "border-[#C5A05A] shadow-lg scale-[1.02]" 
                      : "border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-90"
                  }`}
                >
                  <img src={scen.image} alt={scen.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                    <span className="text-[9px] font-serif tracking-tight text-white truncate block w-full text-left">
                      {scen.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scenario Editorial Specifications */}
          <div className="bg-[#181818] border border-[#C5A05A]/15 rounded p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <Info className="h-4.5 w-4.5 text-[#C5A05A]" />
              <h3 className="font-serif text-base font-medium text-white">Atelier Editorial Notes</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-[10px] text-[#C5A05A] uppercase block mb-1">Scenario Narrative</span>
                  <p className="text-gray-300 leading-relaxed font-light font-sans">
                    {activeScenario.description}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#C5A05A] uppercase block mb-1">Lighting Design</span>
                  <p className="text-gray-400 font-light font-sans">
                    {activeScenario.lighting}
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t sm:border-t-0 sm:border-l border-gray-800 pt-4 sm:pt-0 sm:pl-6">
                <div>
                  <span className="font-mono text-[10px] text-[#C5A05A] uppercase block mb-1 font-serif">Styling & Wardrobe Harmony</span>
                  <p className="text-gray-300 leading-relaxed font-light font-sans italic">
                    "{activeScenario.stylingAdvice}"
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#C5A05A] uppercase block mb-1">Leather Grain Structure</span>
                  <div className="bg-[#212121] border border-gray-800/80 px-3 py-2 rounded text-[11px] font-mono text-gray-300">
                    {activeScenario.hideHarmony}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Aspect: "Shop the Look" Sidebar (Col-span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#181818] border border-[#C5A05A]/30 rounded shadow-2xl p-6 relative overflow-hidden">
            
            {/* Visual Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
              <div>
                <div className="flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#C5A05A]" />
                  <span className="text-[10px] tracking-widest uppercase font-mono text-[#C5A05A] font-bold">
                    Featured Masterpieces
                  </span>
                </div>
                <h3 className="font-serif text-lg font-medium text-white mt-0.5">Shop The Look</h3>
              </div>
              <span className="bg-[#C5A05A]/15 text-[#C5A05A] text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-[#C5A05A]/20">
                {featuredProducts.length} items
              </span>
            </div>

            {/* Curated featured items list */}
            <div className="space-y-6">
              {featuredProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);
                return (
                  <div 
                    key={product.id}
                    className="flex bg-[#212121] hover:bg-[#282828] border border-gray-800/80 hover:border-[#C5A05A]/35 rounded p-4 gap-4 transition-all duration-300 group"
                  >
                    {/* Item thumbnail photo */}
                    <div className="w-20 h-20 bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-gray-800 relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item detail parameters */}
                    <div className="flex-grow flex flex-col justify-between text-xs space-y-1.5 min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#C5A05A] font-mono text-[9px] tracking-widest uppercase">
                            {product.subcategory}
                          </span>
                          <span className="text-white font-mono font-bold">
                            {formatPrice(product.price, currency)}
                          </span>
                        </div>
                        <h4 className="font-serif text-sm font-medium text-white line-clamp-1 mt-0.5 hover:text-[#C5A05A] cursor-pointer" onClick={() => onQuickView(product)}>
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-850">
                        {/* Quick View Button */}
                        <button
                          onClick={() => onQuickView(product)}
                          className="text-[10px] tracking-wider uppercase font-mono text-gray-400 hover:text-[#C5A05A] flex items-center space-x-1 bg-transparent border-none cursor-pointer"
                        >
                          <span>Explore Detail</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>

                        <div className="flex items-center space-x-2">
                          {/* Wishlist Heart Button */}
                          <button
                            onClick={() => onToggleWishlist(product.id)}
                            className={`p-1.5 rounded border transition-colors cursor-pointer ${
                              isWishlisted 
                                ? "bg-red-950/40 border-red-900/50 text-red-400" 
                                : "bg-neutral-800 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
                            }`}
                            title={isWishlisted ? "Remove from Legacy Wishlist" : "Save to Legacy Wishlist"}
                          >
                            <Heart className={`h-3 w-3 ${isWishlisted ? "fill-current" : ""}`} />
                          </button>

                          {/* Direct Cart Addition */}
                          <button
                            onClick={() => onAddToCart(product, 1, product.variantColors?.[0] || "Default")}
                            className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white p-1.5 rounded transition-all duration-300 font-bold flex items-center space-x-1 text-[10px] uppercase tracking-wider cursor-pointer"
                            title="Add to Atelier Bag"
                          >
                            <ShoppingBag className="h-3 w-3" />
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Absolute bottom corner luxury emblem decoration */}
            <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
              <Compass className="h-40 w-40 text-white" />
            </div>

          </div>

          {/* Extra lookbook quote */}
          <div className="bg-[#2F241F] border border-[#C5A05A]/20 rounded p-6 text-center space-y-3">
            <p className="font-serif italic text-sm text-[#F8F5EF] leading-relaxed">
              "We do not style for a single season. Aurelius crafts gear that walks with you across continents, boardroom mergers, and mountain paths, deepening in loyalty and beauty with every single touch."
            </p>
            <div className="h-[1px] w-12 bg-[#C5A05A]/30 mx-auto" />
            <span className="text-[9px] font-mono text-[#C5A05A] tracking-widest uppercase block">
              Atelier Creative Direction
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
