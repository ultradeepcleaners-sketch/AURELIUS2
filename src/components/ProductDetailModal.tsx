import React, { useState, useEffect } from "react";
import { X, Shield, RefreshCw, Star, Heart, HelpCircle, Truck, PackageCheck, Gift, CheckCircle, Sparkles } from "lucide-react";
import { Product, CartItem, Review, CurrencyCode, formatPrice } from "../types";
import { DEFAULT_REVIEWS, PRODUCTS } from "../data";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color: string) => void;
  onToggleWishlist: (id: string) => void;
  isWishlisted: boolean;
  currency?: CurrencyCode;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  currency = "USD"
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.variantColors[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "story" | "care">("details");
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [countdownText, setCountdownText] = useState("03h 42m 15s");

  // Hover magnification zoom state
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Custom reviews logic
  const [newAuthor, setNewAuthor] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Generate simulated shipping dates
  const getDeliveryEstimate = () => {
    const today = new Date();
    const estMin = new Date();
    const estMax = new Date();
    estMin.setDate(today.getDate() + 2);
    estMax.setDate(today.getDate() + 4);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${estMin.toLocaleDateString('en-US', options)} - ${estMax.toLocaleDateString('en-US', options)}`;
  };

  // Live Countdown Timer for Delivery
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfBusiness = new Date();
      endOfBusiness.setHours(18, 0, 0, 0); // Order cut-off at 6 PM
      
      let diffMs = endOfBusiness.getTime() - now.getTime();
      if (diffMs < 0) {
        // If past 6 PM, count down to tomorrow 6 PM
        endOfBusiness.setDate(endOfBusiness.getDate() + 1);
        diffMs = endOfBusiness.getTime() - now.getTime();
      }

      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);

      setCountdownText(
        `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Submit a customer review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    const submitted: Review = {
      id: `new-${Date.now()}`,
      author: newAuthor,
      rating: newRating,
      date: "Just now",
      text: newText,
      verified: true,
      helpfulCount: 0
    };

    setReviews([submitted, ...reviews]);
    setNewAuthor("");
    setNewText("");
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  // Upsell companion product recommendation
  const getUpsellProduct = () => {
    if (product.category === "accessories") {
      return PRODUCTS.find(p => p.id === "nav-duffel");
    }
    return PRODUCTS.find(p => p.id === "care-kit");
  };

  const upsell = getUpsellProduct();

  return (
    <div id="product-detail-portal" className="fixed inset-0 z-50 overflow-y-auto bg-[#111111]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-[#1A1A1A] text-[#FCFCFA] w-full max-w-6xl rounded shadow-2xl overflow-hidden border border-[#C5A05A]/35 flex flex-col max-h-[92vh]">
        
        {/* Header Close Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C5A05A]/15 bg-[#111111]/90">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] tracking-widest text-[#C5A05A] uppercase font-bold">Atelier Catalogue</span>
            <span className="text-gray-500">/</span>
            <span className="font-sans text-xs font-medium text-gray-300 capitalize">{product.category}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-white transition-colors"
            title="Return to Shop"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Inner Scroll Area */}
        <div className="overflow-y-auto p-6 md:p-10 flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* COLUMN LEFT: Ultra HD Image Gallery (Span 6) */}
            <div className="lg:col-span-6 flex flex-col">
              <div 
                className="relative aspect-[4/3] bg-[#111111] border border-[#C5A05A]/10 rounded overflow-hidden cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={(e) => {
                  const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - left) / width) * 100;
                  const y = ((e.clientY - top) / height) * 100;
                  setZoomPos({ x, y });
                }}
              >
                <img
                  src={product.images[activeImageIndex] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-150 ease-out"
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isZoomed ? "scale(2.2)" : "scale(1)"
                  }}
                  referrerPolicy="no-referrer"
                />
                
                {/* Premium Inspection Hint Overlay */}
                <div className={`absolute bottom-3 left-3 bg-[#111111]/85 border border-[#C5A05A]/35 text-[#C5A05A] text-[9px] font-mono tracking-widest px-2.5 py-1.5 rounded uppercase pointer-events-none transition-all duration-300 ${isZoomed ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                  Hover to Inspect Hide Grain
                </div>
              </div>

              {/* Thumbnails Row */}
              {product.images.length > 1 && (
                <div className="flex space-x-2.5 mt-3">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-20 aspect-video rounded overflow-hidden border transition-all ${activeImageIndex === i ? "border-[#C5A05A] ring-1 ring-[#C5A05A]" : "border-gray-800 opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Narrative Tabs */}
              <div className="mt-8 border-b border-gray-800">
                <div className="flex space-x-6 text-xs uppercase tracking-wider font-semibold font-sans">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-2.5 border-b-2 transition-all ${activeTab === "details" ? "border-[#C5A05A] text-white" : "border-transparent text-gray-400"}`}
                  >
                    The Details
                  </button>
                  <button
                    onClick={() => setActiveTab("story")}
                    className={`pb-2.5 border-b-2 transition-all ${activeTab === "story" ? "border-[#C5A05A] text-white" : "border-transparent text-gray-400"}`}
                  >
                    360° Patina Story
                  </button>
                  <button
                    onClick={() => setActiveTab("care")}
                    className={`pb-2.5 border-b-2 transition-all ${activeTab === "care" ? "border-[#C5A05A] text-white" : "border-transparent text-gray-400"}`}
                  >
                    Atelier Legacy
                  </button>
                </div>
              </div>

              {/* Narratives Content */}
              <div className="py-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
                {activeTab === "details" && (
                  <p>{product.description}</p>
                )}
                {activeTab === "story" && (
                  <div>
                    <p className="italic">"{product.legacyStory || 'Every Aurelius article goes through rigorous wax polishing to guarantee unique weathering.'}"</p>
                    <div className="mt-3 flex items-center space-x-2 text-[#C5A05A] text-xs font-mono">
                      <Sparkles className="h-4 w-4" />
                      <span>This hide is organic veg-tanned and will evolve based on your grip, body oils, and climates.</span>
                    </div>
                  </div>
                )}
                {activeTab === "care" && (
                  <div>
                    <span className="font-semibold block mb-1">Preservation Philosophy</span>
                    <p>{product.careInstructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN RIGHT: Commercial Options (Span 6) */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              
              {/* Product Header */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A05A] tracking-widest uppercase mb-1">
                  <span>{product.subcategory}</span>
                  <span>•</span>
                  <span>Handcrafted Heritage</span>
                </div>

                <h1 className="font-serif text-2xl md:text-3.5xl font-medium tracking-tight text-white mb-2">
                  {product.name}
                </h1>

                {/* Rating summary */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex text-[#C5A05A]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-[#C5A05A]" : ""}`} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-white">{product.rating}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-xs text-gray-400 font-mono">({product.reviewsCount} verified elite purchases)</span>
                </div>

                {/* Price Display */}
                <div className="bg-[#111111]/90 px-4 py-3 rounded border border-[#C5A05A]/20 flex items-center justify-between mb-6">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-mono text-xl md:text-2xl font-bold text-white">{formatPrice(product.price, currency)}</span>
                    {product.originalPrice && (
                      <span className="font-mono text-sm text-gray-500 line-through">{formatPrice(product.originalPrice, currency)}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-right font-mono text-gray-400 uppercase tracking-wider">
                    <span>Includes Complimentary VIP Shipping</span>
                  </div>
                </div>

                {/* Live Ordering Countdown */}
                <div className="mb-6 flex items-center space-x-3 bg-[#2D1F1F] border border-red-900/40 rounded p-3 text-xs text-red-200">
                  <Truck className="h-4.5 w-4.5 text-[#C5A05A] animate-bounce" />
                  <div>
                    <span className="font-semibold text-white">Order within the next <span className="font-mono text-[#C5A05A]">{countdownText}</span></span> to receive by <span className="underline font-semibold text-[#C5A05A]">{getDeliveryEstimate()}</span> with Priority Courier.
                  </div>
                </div>

                {/* Leather Swatch Selector */}
                <div className="mb-5">
                  <span className="text-xs tracking-widest uppercase text-gray-400 font-semibold block mb-2">Selected Hide Shade: <span className="text-white font-serif italic">{selectedColor}</span></span>
                  <div className="flex space-x-3">
                    {product.variantColors.map((col, index) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`px-4 py-2 border text-xs tracking-wider uppercase font-medium rounded transition-all flex items-center space-x-2 ${selectedColor === col ? "border-[#C5A05A] bg-[#2E241F] text-white shadow-md" : "border-gray-800 hover:border-gray-700 bg-[#252525] text-gray-300"}`}
                      >
                        <span 
                          style={{ backgroundColor: product.variantColorsHex[index] }}
                          className="h-3.5 w-3.5 rounded-full border border-white"
                        />
                        <span>{col}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity select row */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center border border-gray-800 rounded overflow-hidden">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3.5 py-1.5 hover:bg-neutral-800 text-white font-semibold border-r border-gray-800 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-5 text-sm font-mono font-bold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3.5 py-1.5 hover:bg-neutral-800 text-white font-semibold border-l border-gray-800 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => { onAddToCart(product, quantity, selectedColor); onClose(); }}
                    className="flex-grow bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white text-xs tracking-widest uppercase font-semibold py-3 px-6 rounded transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl"
                  >
                    <span>Secure Masterpiece Addition</span>
                    <span>•</span>
                    <span className="font-mono">{formatPrice(product.price * quantity, currency)}</span>
                  </button>
                  
                  <button 
                    onClick={() => onToggleWishlist(product.id)}
                    className={`p-3 border rounded transition-colors ${isWishlisted ? "text-[#C5A05A] border-[#C5A05A] bg-[#2F241F]/40" : "border-gray-800 hover:border-gray-700 text-gray-400"}`}
                    title="Add to wishlist"
                  >
                    <Heart className={`h-4.5 w-4.5 ${isWishlisted ? "fill-[#C5A05A]" : ""}`} />
                  </button>
                </div>

                {/* Specifications Grid */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                  <span className="text-xs tracking-widest uppercase text-[#C5A05A] font-semibold block mb-3 font-serif">Product Specifications</span>
                  {product.customSpecs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-sans">
                      {Object.entries(product.customSpecs).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1.5 border-b border-gray-800/60">
                          <span className="text-gray-400">{key}</span>
                          <span className="font-mono font-medium text-gray-200 text-right ml-2">{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-sans">
                      <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                        <span className="text-gray-400">Dimensions</span>
                        <span className="font-mono font-medium text-gray-200">{product.dimensions}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                        <span className="text-gray-400">Weight</span>
                        <span className="font-mono font-medium text-gray-200">{product.weight}</span>
                      </div>
                      {product.capacity && (
                        <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                          <span className="text-gray-400">Capacity</span>
                          <span className="font-mono font-medium text-gray-200">{product.capacity}</span>
                        </div>
                      )}
                      {product.laptopCompatibility && (
                        <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                          <span className="text-gray-400">Laptop Sleeve</span>
                          <span className="font-medium text-gray-200">{product.laptopCompatibility}</span>
                        </div>
                      )}
                      {product.waterResistance && (
                        <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                          <span className="text-gray-400">Waterproofing</span>
                          <span className="font-medium text-[#C5A05A]">{product.waterResistance}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* Frequently Bought Together / Upsell Panel */}
          {upsell && (
            <div className="mt-12 bg-[#222222]/80 border border-[#C5A05A]/25 rounded p-5 sm:p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Gift className="h-5 w-5 text-[#C5A05A]" />
                <h3 className="font-serif text-base font-semibold text-white">Frequently Bought Together</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Selected product preview */}
                  <img src={product.image} className="w-12 h-12 object-cover rounded border border-gray-800" referrerPolicy="no-referrer" />
                  <span className="text-xl font-light text-gray-500">+</span>
                  {/* Companion preview */}
                  <img src={upsell.image} className="w-12 h-12 object-cover rounded border border-[#C5A05A]/40" referrerPolicy="no-referrer" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">{upsell.name}</p>
                    <p className="font-mono text-[#C5A05A]">+{formatPrice(upsell.price, currency)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onAddToCart(product, 1, selectedColor);
                    onAddToCart(upsell, 1, upsell.variantColors[0]);
                    onClose();
                  }}
                  className="w-full sm:w-auto bg-[#111] hover:bg-[#C5A05A] text-white hover:text-black text-[10px] tracking-widest uppercase font-semibold px-5 py-3 rounded transition-colors shadow-md border border-[#C5A05A]/20"
                >
                  Buy Both & Save Shipping
                </button>
              </div>
            </div>
          )}

          {/* Customer Reviews Stage */}
          <div className="mt-14 border-t border-gray-800 pt-10">
            <h2 className="font-serif text-xl md:text-2xl font-semibold mb-6">Atelier Conversations & Reviews</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: List of existing reviews */}
              <div className="lg:col-span-7 space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#222] border border-gray-800 rounded p-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold font-serif text-white">{rev.author}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{rev.date}</span>
                    </div>
                    <div className="flex text-[#C5A05A] mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < rev.rating ? "fill-[#C5A05A]" : ""}`} />
                      ))}
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-3">{rev.text}</p>
                    {rev.verified && (
                      <span className="inline-flex items-center text-[9px] tracking-wider uppercase font-mono text-green-300 font-bold bg-green-950/40 px-2 py-0.5 rounded border border-green-900/40">
                        <CheckCircle className="h-2.5 w-2.5 mr-1" />
                        Verified Executive Purchase
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column: Add your review */}
              <div className="lg:col-span-5 bg-[#1A1A1A] border border-gray-800 rounded p-5">
                <span className="text-xs tracking-widest uppercase text-[#C5A05A] font-semibold block mb-4">Leave Your Signature</span>
                <form onSubmit={handleAddReview} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-gray-400 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] text-white border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A]"
                      placeholder="e.g. Sterling Cooper"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Rating</label>
                    <select
                      className="w-full bg-[#111] text-white border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A]"
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                    >
                      <option value={5}>5 Stars - Exquisite Quality</option>
                      <option value={4}>4 Stars - High Quality</option>
                      <option value={3}>3 Stars - Good</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Review Details</label>
                    <textarea
                      className="w-full bg-[#111] text-white border border-gray-800 rounded px-3 py-2 outline-none focus:border-[#C5A05A] h-20 resize-none"
                      placeholder="Describe your tactile experience with our leather..."
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      required
                    />
                  </div>

                  {reviewSuccess && (
                    <div className="text-green-300 bg-green-950/40 p-2.5 rounded text-xs border border-green-900/40">
                      Thank you. Your feedback has been vetted and added to our database.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-2.5 uppercase font-semibold tracking-widest transition-colors rounded text-[10px]"
                  >
                    Submit Vetted Review
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
