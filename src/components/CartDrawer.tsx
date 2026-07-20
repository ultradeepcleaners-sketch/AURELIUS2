import React from "react";
import { X, Trash2, ShieldCheck, Sparkles, Truck, Lock, ArrowRight, Gift } from "lucide-react";
import { CartItem, Product, CurrencyCode, formatPrice } from "../types";
import { PRODUCTS } from "../data";

interface CartDrawerProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number, color: string) => void;
  onRemoveItem: (productId: string, color: string) => void;
  onCheckout: () => void;
  onAddProductDirect: (product: Product, quantity: number, color: string) => void;
  currency?: CurrencyCode;
}

export default function CartDrawer({
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onAddProductDirect,
  currency = "USD"
}: CartDrawerProps) {
  const subtotalUSD = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Dynamic free shipping threshold
  const shippingThresholdUSD = 300;
  const isFreeShipping = subtotalUSD >= shippingThresholdUSD;
  const missingForFreeShippingUSD = shippingThresholdUSD - subtotalUSD;
  const shippingProgress = Math.min((subtotalUSD / shippingThresholdUSD) * 100, 100);

  // VIP Points earner calculation (1 point per dollar)
  const earnedPoints = Math.floor(subtotalUSD);

  // Filter possible upsells that are not currently in the cart
  const cartProductIds = cart.map(item => item.product.id);
  const upsellCandidates = PRODUCTS.filter(p => !cartProductIds.includes(p.id) && p.category === "accessories");
  const recommendedUpsell = upsellCandidates[0] || PRODUCTS.find(p => p.id === "care-kit");

  return (
    <div id="side-cart-portal" className="fixed inset-0 z-50 overflow-hidden font-sans">
      
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#1A1A1A] text-[#FCFCFA] shadow-2xl flex flex-col justify-between border-l border-[#C5A05A]/35">
          
          {/* Top Header */}
          <div className="px-6 py-5 border-b border-[#C5A05A]/15 bg-[#111111]/90 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg tracking-wider font-semibold">Your Atelier Selection</span>
              <span className="font-mono text-[10px] bg-[#C5A05A] text-black px-2 py-0.5 rounded font-bold">
                {cart.length}
              </span>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-800 transition-colors">
              <X className="h-5 w-5 text-gray-300" />
            </button>
          </div>

          {/* Cart Contents Scroll area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            
            {cart.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <Trash2 className="h-10 w-10 text-gray-500 mb-4 animate-bounce" />
                <p className="font-serif text-lg font-medium mb-1 text-gray-200">Your cart is empty</p>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-6">
                  Select some of our timeless full-grain Crazy Horse collections to begin your travel legacy.
                </p>
                <button 
                  onClick={onClose}
                  className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white text-[10px] tracking-widest uppercase font-semibold py-3 px-6 rounded transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Dynamic Shipping Progress Bar */}
                <div className="bg-[#111111]/90 p-4 rounded border border-[#C5A05A]/20 text-xs text-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Truck className="h-4 w-4 text-[#C5A05A]" />
                      <span className="font-semibold">DHL Worldwide Priority Express</span>
                    </div>
                    <span className="font-mono font-bold text-[#C5A05A]">{formatPrice(subtotalUSD, currency)} / {formatPrice(300, currency)}</span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
                    <div 
                      className="bg-[#C5A05A] h-full transition-all duration-500 rounded"
                      style={{ width: `${shippingProgress}%` }}
                    />
                  </div>
                  
                  <p className="mt-2 text-[10.5px]">
                    {isFreeShipping ? (
                      <span className="text-green-300 font-bold flex items-center">
                        <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                        Congratulations! You unlocked free global courier shipping!
                      </span>
                    ) : (
                      <span>
                        Spend <span className="font-mono font-bold text-[#C5A05A]">{formatPrice(missingForFreeShippingUSD, currency)}</span> more to unlock complimentary courier delivery.
                      </span>
                    )}
                  </p>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-800/60">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.selectedColor}`} className="py-4 flex space-x-4">
                      {/* Product Image */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded border border-gray-800"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between text-xs">
                            <h4 className="font-serif font-medium text-white pr-2 line-clamp-1">{item.product.name}</h4>
                            <span className="font-mono font-bold text-[#FCFCFA]">{formatPrice(item.product.price, currency)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 capitalize font-mono mt-0.5">
                            Hide shade: {item.selectedColor}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-800 rounded">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedColor)}
                              className="px-2 py-0.5 hover:bg-neutral-800 text-white text-xs border-r border-gray-800"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-mono font-bold">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                              className="px-2 py-0.5 hover:bg-neutral-800 text-white text-xs border-l border-gray-800"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id, item.selectedColor)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VIP Rewards Highlight */}
                <div className="bg-[#2E241F] text-[#FCFCFA] p-4 rounded border border-[#C5A05A]/40 text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-[#C5A05A] animate-pulse" />
                    <span className="font-serif font-semibold">Sterling VIP Loyalty Points</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-300">
                    By unboxing this purchase, you will acquire <span className="font-mono text-[#C5A05A] font-bold">+{earnedPoints}</span> reward points toward your Aurelius Platinum upgrade!
                  </p>
                </div>

                {/* Recommended Upsell Card inside cart */}
                {recommendedUpsell && (
                  <div className="bg-[#222222]/80 rounded border border-dashed border-[#C5A05A]/30 p-4">
                    <div className="flex items-center space-x-1.5 mb-2.5">
                      <Gift className="h-3.5 w-3.5 text-[#C5A05A]" />
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">Atelier Care Suggestion</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <img src={recommendedUpsell.image} className="w-12 h-12 object-cover rounded border border-gray-800" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="text-xs font-serif font-medium line-clamp-1 text-white">{recommendedUpsell.name}</p>
                        <p className="text-[10px] font-mono text-[#C5A05A]">{formatPrice(recommendedUpsell.price, currency)}</p>
                      </div>
                      <button
                        onClick={() => onAddProductDirect(recommendedUpsell, 1, recommendedUpsell.variantColors[0])}
                        className="bg-[#111] hover:bg-[#C5A05A] hover:text-black text-[9px] tracking-widest uppercase font-semibold text-white px-2.5 py-1.5 rounded transition-colors border border-[#C5A05A]/25"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Checkout summary panel */}
          {cart.length > 0 && (
            <div className="border-t border-[#C5A05A]/20 bg-[#111111]/90 p-6 space-y-4">
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Atelier Subtotal</span>
                  <span className="font-mono text-white">{formatPrice(subtotalUSD, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>DHL Courier Shipping</span>
                  <span className="font-mono text-white">{isFreeShipping ? "FREE" : formatPrice(25, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-gray-800 pt-3 mt-1.5">
                  <span className="font-serif text-white">Estimated Total</span>
                  <span className="font-mono text-[#C5A05A] font-bold">{formatPrice(subtotalUSD + (isFreeShipping ? 0 : 25), currency)}</span>
                </div>
              </div>

              {/* Secure checkout notice */}
              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-400">
                <Lock className="h-3 w-3 text-green-400" />
                <span>256-Bit SSL Encrypted Escrow Sandbox Checkout</span>
              </div>

              {/* Master Checkout Action Button */}
              <button
                onClick={onCheckout}
                className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white text-xs tracking-widest uppercase font-semibold py-4 rounded transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Trust Badge Icons */}
              <div className="flex items-center justify-center space-x-4 pt-2 text-gray-400">
                <span className="text-[9px] font-mono uppercase tracking-widest">Stripe</span>
                <span className="text-[9px] font-mono uppercase tracking-widest">PayPal</span>
                <span className="text-[9px] font-mono uppercase tracking-widest">Apple Pay</span>
                <span className="text-[9px] font-mono uppercase tracking-widest">Klarna</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
