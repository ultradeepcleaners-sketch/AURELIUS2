import React, { useState } from "react";
import { X, Lock, CheckCircle2, ShieldCheck, Smartphone, CreditCard, Award, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { CartItem, CurrencyCode, formatPrice } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  cart: CartItem[];
  currency: CurrencyCode;
}

type GatewayType = "paystack" | "flutterwave" | "mobile_money";
type MoMoNetwork = "mtn" | "telecel" | "airteltigo";

export default function CheckoutModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  cart,
  currency
}: CheckoutModalProps) {
  const [gateway, setGateway] = useState<GatewayType>("paystack");
  const [momoNetwork, setMomoNetwork] = useState<MoMoNetwork>("mtn");
  const [momoPhone, setMomoPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [otpCode, setOtpCode] = useState("");
  const [momoInstruction, setMomoInstruction] = useState("");

  if (!isOpen) return null;

  const subtotalUSD = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotalUSD >= 300;
  const shippingCostUSD = isFreeShipping ? 0 : 25;
  const totalUSD = subtotalUSD + shippingCostUSD;

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (gateway === "mobile_money") {
        setMomoInstruction(`A secure push authorization prompt has been dispatched to ${momoPhone}. Please input your MoMo PIN on your handset to approve the GH₵ transaction.`);
        setStep("otp");
      } else {
        setStep("otp");
      }
    }, 1800);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
    }, 2000);
  };

  const handleFinalize = () => {
    onPaymentSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#141414] text-[#FCFCFA] border border-[#C5A05A]/40 max-w-2xl w-full rounded shadow-2xl relative overflow-hidden">
        
        {/* Gold Accent Top Bar */}
        <div className="h-1 bg-gradient-to-r from-[#A5673F] via-[#C5A05A] to-[#A5673F]" />

        {/* Close Button */}
        {step !== "success" && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Modal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Panel: Order Summary (Span 5) */}
          <div className="md:col-span-5 bg-[#111111] p-6 border-b md:border-b-0 md:border-r border-[#C5A05A]/15 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[9px] tracking-[0.25em] text-[#C5A05A] uppercase block mb-1">Your Selection</span>
              <h3 className="font-serif text-lg font-medium border-b border-gray-800 pb-3 mb-4">Atelier Summary</h3>
              
              <div className="space-y-4 max-h-[180px] overflow-y-auto pr-1">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 text-xs">
                    <img src={item.product.image} className="w-10 h-10 object-cover rounded border border-gray-800" alt="" />
                    <div className="flex-grow min-w-0">
                      <p className="font-serif font-medium truncate text-white">{item.product.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">Qty: {item.quantity} • {item.selectedColor}</p>
                    </div>
                    <span className="font-mono font-semibold">{formatPrice(item.product.price * item.quantity, currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Atelier Subtotal:</span>
                <span className="font-mono">{formatPrice(subtotalUSD, currency)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>DHL Express Shipping:</span>
                <span>{isFreeShipping ? "FREE" : formatPrice(shippingCostUSD, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-800 text-[#C5A05A]">
                <span>Total Amount:</span>
                <span className="font-mono">{formatPrice(totalUSD, currency)}</span>
              </div>

              {/* Secure payment seal */}
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 pt-3">
                <Lock className="h-3 w-3 text-green-500" />
                <span>PCI DSS Secured Transaction</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Checkout Gateway (Span 7) */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between min-h-[460px]">
            {step === "form" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-lg font-medium text-white">Payment Portal</h3>
                  <p className="text-xs text-gray-400 font-light mt-0.5">Choose your preferred gateway to route secure checkout escrow.</p>
                </div>

                {/* Gateway Selector Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway("paystack")}
                    className={`p-2.5 rounded border text-center transition-all ${gateway === "paystack" ? "border-[#C5A05A] bg-[#C5A05A]/10 text-white" : "border-gray-800 bg-[#1A1A1A] hover:bg-neutral-800 text-gray-400"}`}
                  >
                    <span className="text-[11px] font-bold block">Paystack</span>
                    <span className="text-[9px] font-mono opacity-60">Cards / Bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway("flutterwave")}
                    className={`p-2.5 rounded border text-center transition-all ${gateway === "flutterwave" ? "border-[#C5A05A] bg-[#C5A05A]/10 text-white" : "border-gray-800 bg-[#1A1A1A] hover:bg-neutral-800 text-gray-400"}`}
                  >
                    <span className="text-[11px] font-bold block">Flutterwave</span>
                    <span className="text-[9px] font-mono opacity-60">All Channels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateway("mobile_money")}
                    className={`p-2.5 rounded border text-center transition-all ${gateway === "mobile_money" ? "border-[#C5A05A] bg-[#C5A05A]/10 text-white" : "border-gray-800 bg-[#1A1A1A] hover:bg-neutral-800 text-gray-400"}`}
                  >
                    <span className="text-[11px] font-bold block">MoMo</span>
                    <span className="text-[9px] font-mono opacity-60">Mobile Money</span>
                  </button>
                </div>

                {/* Gateway Description and Form */}
                <form onSubmit={handleStartPayment} className="space-y-4 text-xs">
                  {/* Gateway specifics */}
                  {gateway === "paystack" && (
                    <div className="space-y-3 p-3.5 rounded bg-neutral-900 border border-gray-800">
                      <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-[#C5A05A] font-mono tracking-widest uppercase font-bold">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Paystack Checkout Sandbox</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Cardholder Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ama Mensah"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="ama@mensah.com"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">Card Number</label>
                        <input
                          type="text"
                          required
                          pattern="\d{16}"
                          maxLength={16}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            required
                            placeholder="12/28"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Security Code (CVC)</label>
                          <input
                            type="password"
                            required
                            pattern="\d{3}"
                            maxLength={3}
                            placeholder="***"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono"
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {gateway === "flutterwave" && (
                    <div className="space-y-3 p-3.5 rounded bg-neutral-900 border border-gray-800">
                      <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-[#C5A05A] font-mono tracking-widest uppercase font-bold">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Flutterwave Checkout Sandbox</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Kwame Boateng"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="kwame@boateng.com"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">Payment Source</label>
                        <select className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]">
                          <option value="card">Standard Mastercard / Visa</option>
                          <option value="bank">Direct Barter Account Transfer</option>
                          <option value="ussd">USSD Bank Quick Code (*961*)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">Secure Card Identifier</label>
                        <input
                          type="text"
                          required
                          pattern="\d{16}"
                          maxLength={16}
                          placeholder="5399 2222 3333 4444"
                          className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {gateway === "mobile_money" && (
                    <div className="space-y-3 p-3.5 rounded bg-neutral-900 border border-gray-800">
                      <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-[#C5A05A] font-mono tracking-widest uppercase font-bold">
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Ghana Mobile Money Gateway</span>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">MoMo Operator Network *</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setMomoNetwork("mtn")}
                            className={`py-1.5 rounded text-center font-bold text-[10px] transition-all ${momoNetwork === "mtn" ? "bg-yellow-500 text-black border border-yellow-400" : "bg-[#111] text-gray-400 border border-transparent"}`}
                          >
                            MTN MoMo
                          </button>
                          <button
                            type="button"
                            onClick={() => setMomoNetwork("telecel")}
                            className={`py-1.5 rounded text-center font-bold text-[10px] transition-all ${momoNetwork === "telecel" ? "bg-red-600 text-white border border-red-500" : "bg-[#111] text-gray-400 border border-transparent"}`}
                          >
                            Telecel Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setMomoNetwork("airteltigo")}
                            className={`py-1.5 rounded text-center font-bold text-[10px] transition-all ${momoNetwork === "airteltigo" ? "bg-blue-600 text-white border border-blue-500" : "bg-[#111] text-gray-400 border border-transparent"}`}
                          >
                            AirtelTigo Money
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Payer Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Kofi Mensah"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px]">Active MoMo Phone Number *</label>
                          <input
                            type="text"
                            required
                            pattern="^[0][25][0-9]{8}$"
                            maxLength={10}
                            placeholder="e.g. 0244123456"
                            className="w-full bg-[#111] border border-gray-800 rounded px-2.5 py-1.5 outline-none focus:border-[#C5A05A] font-mono"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-500 leading-relaxed italic">
                        Supports secure direct local GHS billing. High-fidelity push sandbox simulated prompt will verify authority instantaneously.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3.5 uppercase tracking-widest font-semibold rounded text-[10.5px] transition-all flex items-center justify-center space-x-2 font-mono shadow-md cursor-pointer border border-transparent"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Connecting Secure Escrow Node...</span>
                      </>
                    ) : (
                      <>
                        <span>Secure Escrow Authorization</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-6 flex flex-col justify-center h-full max-w-sm mx-auto">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="h-6 w-6 text-amber-400 animate-bounce" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-white">Security Verification</h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    {gateway === "mobile_money" ? momoInstruction : "We have dispatched a secure Sandbox verification OTP code to your registered device for card security validation."}
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 mb-1.5 text-center uppercase tracking-wider text-[9px] font-mono">Input Verification Code</label>
                    <input
                      type="text"
                      required
                      placeholder={gateway === "mobile_money" ? "Input 4-Digit Handset PIN" : "Input OTP Code (e.g. 123456)"}
                      maxLength={gateway === "mobile_money" ? 4 : 6}
                      className="w-full text-center bg-[#111] border border-gray-800 rounded px-3 py-2.5 outline-none focus:border-[#C5A05A] font-mono tracking-[0.5em] text-lg text-white"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3 uppercase tracking-widest font-semibold rounded text-[10.5px] transition-all flex items-center justify-center space-x-2 font-mono shadow-md cursor-pointer border border-transparent"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Verifying Escrow Transaction...</span>
                      </>
                    ) : (
                      <>
                        <span>Approve Secure Funds Allocation</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="text-[10px] text-gray-500 hover:text-[#C5A05A] underline uppercase tracking-wider font-mono"
                    >
                      Change Payment Details
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-6 flex flex-col justify-center items-center h-full text-center max-w-sm mx-auto">
                <div className="h-16 w-16 bg-[#2F241F]/20 text-[#C5A05A] rounded-full flex items-center justify-center border border-[#C5A05A]/40 mb-2">
                  <CheckCircle2 className="h-10 w-10 text-[#C5A05A] animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[9px] tracking-[0.25em] text-[#A5673F] uppercase block">Sanction Secured</span>
                  <h3 className="font-serif text-xl font-bold text-white uppercase">Escrow Funds Cleared</h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    The {gateway === "paystack" ? "Paystack" : gateway === "flutterwave" ? "Flutterwave" : "Mobile Money"} transaction finished flawlessly. A total allocation of <span className="font-mono font-semibold text-white">{formatPrice(totalUSD, currency)}</span> has been securely locked in escrow.
                  </p>
                </div>

                <div className="bg-[#111111] p-3 rounded border border-gray-850 w-full text-left font-mono text-[10px] text-gray-400 space-y-1">
                  <div className="flex justify-between"><span>Merchant:</span> <span className="text-white">AURELIUS ATELIER GHS</span></div>
                  <div className="flex justify-between"><span>Reference ID:</span> <span className="text-white">REF-{Math.floor(100000 + Math.random() * 900000)}</span></div>
                  <div className="flex justify-between"><span>Channel Node:</span> <span className="text-[#C5A05A] uppercase">{gateway}</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleFinalize}
                  className="w-full bg-white text-black hover:bg-[#C5A05A] py-3.5 uppercase tracking-widest font-bold rounded text-[10.5px] transition-all font-mono"
                >
                  Confirm and Book Commission
                </button>
              </div>
            )}

            {/* Micro security assurance block */}
            <div className="border-t border-gray-900 pt-4 text-center">
              <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                By completing transaction authorization, you certify compliance with general regulatory frameworks and the Aurelius Terms of Escrow. Secured by end-to-end sandbox shielding.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
