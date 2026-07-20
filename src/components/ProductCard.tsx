import React, { useState, useEffect, useRef } from "react";
import { Eye, Heart, RefreshCw, Star, Flame, CheckCircle, ShoppingBag } from "lucide-react";
import { Product, CurrencyCode, formatPrice } from "../types";
import { AureliusLogger } from "../utils/AureliusLogger";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  referrerPolicy?: "no-referrer" | "origin" | "unsafe-url" | undefined;
}

function LazyImage({ src, alt, className = "", referrerPolicy }: LazyImageProps) {
  const [isIntersected, setIsIntersected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    if (!("IntersectionObserver" in window)) {
      setIsIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
          }
        });
      },
      {
        rootMargin: "80px", // start loading slightly before they scroll into viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#111111] flex items-center justify-center">
      {/* Luxurious placeholder with gold branding style */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] to-[#141414] animate-pulse">
          <div className="w-9 h-9 border border-[#C5A05A]/15 rounded-full flex items-center justify-center mb-1">
            <span className="text-[9px] font-mono text-[#C5A05A]/40 tracking-wider">A</span>
          </div>
          <span className="text-[7px] font-mono text-gray-500 uppercase tracking-[0.25em]">
            Atelier Curating
          </span>
        </div>
      )}

      {/* Luxurious Asset Offline Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] to-[#141414] border border-[#C5A05A]/20 p-4 text-center">
          <div className="w-10 h-10 border border-[#C5A05A]/20 rounded-full flex items-center justify-center mb-2 bg-[#1A1A1A]">
            <span className="text-[10px] font-mono text-[#C5A05A] tracking-wider font-bold">A</span>
          </div>
          <span className="text-[8px] font-mono text-[#C5A05A] uppercase tracking-[0.2em] mb-1">
            Asset Offline
          </span>
          <span className="text-[7px] font-mono text-gray-500 truncate max-w-[140px]" title={alt}>
            {alt}
          </span>
        </div>
      )}

      {/* Actual image element loaded dynamically */}
      {isIntersected && !hasError && (
        <img
          src={src}
          alt={alt}
          referrerPolicy={referrerPolicy}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            AureliusLogger.log({
              type: "error",
              url: src,
              method: "GET (Image)",
              error: `Failed to load product grid image asset for "${alt}"`
            });
          }}
          className={`${className} transition-all duration-1000 ease-out ${
            isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-102"
          }`}
        />
      )}
    </div>
  );
}

interface ProductCardProps {
  key?: string;
  product: Product;
  onQuickView: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  currency?: CurrencyCode;
  onAddToCart: (product: Product, quantity: number, color: string) => void;
}

export default function ProductCard({
  product,
  onQuickView,
  onToggleWishlist,
  isWishlisted,
  onToggleCompare,
  isCompared,
  currency = "USD",
  onAddToCart
}: ProductCardProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isQuickAdded, setIsQuickAdded] = useState(false);
  const [isBottomAdded, setIsBottomAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default color selection is the first color or Standard
    const defaultColor = product.variantColors && product.variantColors.length > 0 
      ? product.variantColors[0] 
      : "Standard";
    onAddToCart(product, 1, defaultColor);
    setIsQuickAdded(true);
    setTimeout(() => {
      setIsQuickAdded(false);
    }, 2000);
  };

  const handleBottomAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const chosenColor = product.variantColors && product.variantColors[selectedColorIndex]
      ? product.variantColors[selectedColorIndex]
      : (product.variantColors && product.variantColors[0]) || "Standard";
    onAddToCart(product, 1, chosenColor);
    setIsBottomAdded(true);
    setTimeout(() => {
      setIsBottomAdded(false);
    }, 2000);
  };

  // Return key technical highlight for a product
  const getHighlightLabel = () => {
    if (product.category === "bags") return "Full Grain Crazy Horse";
    if (product.category === "shoes") return "Goodyear Stitched Welt";
    return "RFID Protection Shield";
  };

  return (
    <div id={`product-card-${product.id}`} className="group relative bg-[#1A1A1A] border border-[#C5A05A]/15 hover:border-[#C5A05A]/45 rounded overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
      
      {/* Product Image Stage */}
      <div className="relative overflow-hidden aspect-[4/3] bg-[#111111] cursor-pointer" onClick={() => onQuickView(product)}>
        
        {/* Main Product Image with native lazy loading */}
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        
        {/* Soft shadow gradients overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Hot / Low Stock / Limited Stock Badge */}
        {product.stockLevel !== undefined && product.stockLevel < 5 ? (
          <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-700 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-lg animate-pulse z-10 border border-red-500/30">
            <Flame className="h-3 w-3 text-white" />
            <span>Limited Stock</span>
          </div>
        ) : (
          product.inStock <= 10 && (
            <div className="absolute top-3 left-3 flex items-center space-x-1 bg-[#A5673F] text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-lg animate-pulse">
              <Flame className="h-3 w-3 text-white" />
              <span>Only {product.inStock} Left</span>
            </div>
          )
        )}

        {/* Handcrafted Badge */}
        {product.price >= 300 && (
          <div className="absolute top-3 right-3 bg-[#111111]/85 border border-[#C5A05A]/40 text-[#C5A05A] font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded">
            Heritage Tier
          </div>
        )}

        {/* Floating Quick Action Drawer */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-[#111111]/90 backdrop-blur-md p-3 flex justify-around border-t border-[#C5A05A]/30">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
            className={`flex items-center space-x-1.5 text-xs tracking-wider uppercase font-medium hover:text-[#C5A05A] transition-colors ${isWishlisted ? "text-[#C5A05A]" : "text-gray-300"}`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-[#C5A05A]" : ""}`} />
            <span className="hidden sm:inline">Wishlist</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
            className="flex items-center space-x-1.5 text-xs text-gray-300 hover:text-[#C5A05A] tracking-wider uppercase font-medium transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>

          {/* Quick Add Button */}
          <button 
            onClick={handleQuickAdd}
            className={`flex items-center space-x-1.5 text-xs tracking-wider uppercase font-medium transition-all duration-300 ${isQuickAdded ? "text-[#C5A05A]" : "text-gray-300 hover:text-[#C5A05A]"}`}
            title="Immediately add with default color selection"
          >
            {isQuickAdded ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-[#C5A05A] animate-bounce" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Quick Add</span>
              </>
            )}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
            className={`flex items-center space-x-1.5 text-xs tracking-wider uppercase font-medium hover:text-[#C5A05A] transition-colors ${isCompared ? "text-[#C5A05A]" : "text-gray-300"}`}
          >
            <RefreshCw className="h-3.5 w-3.5 animate-[spin_10s_linear_infinite]" />
            <span>{isCompared ? "Compared" : "Compare"}</span>
          </button>
        </div>
      </div>

      {/* Product Information Stage */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Subcategory & Technical Label */}
          <div className="flex items-center justify-between text-[10px] tracking-widest uppercase text-gray-400 font-mono mb-1">
            <span>{product.subcategory}</span>
            <span className="text-[#C5A05A]">{getHighlightLabel()}</span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onQuickView(product)}
            className="font-serif text-base font-medium text-white hover:text-[#C5A05A] transition-colors cursor-pointer mt-1 tracking-tight"
          >
            {product.name}
          </h3>

          {/* Reviews & Average Rating */}
          <div className="flex items-center space-x-1.5 mt-2">
            <div className="flex text-[#C5A05A]">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < Math.floor(product.rating) ? "fill-[#C5A05A]" : ""}`} 
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-gray-400 font-semibold">({product.reviewsCount} reviews)</span>
          </div>
        </div>

        {/* Pricing, Colors, and Quick Buy row */}
        <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between gap-2 flex-wrap">
          
          {/* Luxury Pricing */}
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-[10px] font-mono line-through text-gray-500">
                {formatPrice(product.originalPrice, currency)}
              </span>
            )}
            <span className="font-mono text-sm font-semibold text-[#FCFCFA]">
              {formatPrice(product.price, currency)}
            </span>
          </div>

          {/* Color Variants Dot Indicators */}
          <div className="flex items-center space-x-1.5">
            {product.variantColorsHex.map((hex, index) => (
              <button
                key={hex}
                onClick={() => setSelectedColorIndex(index)}
                style={{ backgroundColor: hex }}
                className={`h-3 w-3 rounded-full border transition-all ${selectedColorIndex === index ? "ring-1 ring-[#C5A05A] ring-offset-2 scale-110" : "border-gray-700 opacity-65 hover:opacity-100"}`}
                title={product.variantColors[index]}
              />
            ))}
          </div>

          {/* Quick Buy Button */}
          <button
            onClick={handleBottomAdd}
            className={`flex items-center space-x-1 border transition-all duration-300 px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-widest font-semibold cursor-pointer ${
              isBottomAdded
                ? "bg-green-600/20 border-green-500 text-green-400"
                : "bg-[#C5A05A]/10 hover:bg-[#C5A05A] border-[#C5A05A]/30 hover:border-[#C5A05A] text-[#C5A05A] hover:text-black"
            }`}
            title="Quickly add masterpiece to cart"
          >
            {isBottomAdded ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-[8px] font-bold text-green-400">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3 w-3" />
                <span className="text-[8px] font-bold">Quick Buy</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
