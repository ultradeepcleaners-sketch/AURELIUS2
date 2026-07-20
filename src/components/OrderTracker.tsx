import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Phone, 
  Sparkles, 
  FileCheck, 
  Layers, 
  Droplet, 
  Scissors, 
  Activity, 
  ShieldCheck, 
  Plane, 
  Truck, 
  AlertCircle 
} from "lucide-react";

// Definitions of the 8 craft stages
interface CraftStage {
  id: number;
  name: string;
  location: string;
  description: string;
  icon: React.ComponentType<any>;
  artisanNote: string;
}

const STAGES: CraftStage[] = [
  {
    id: 1,
    name: "Commission Received & Spec Finalization",
    location: "Milan Office, Italy",
    description: "Our master concierge registers your custom commission ledger, verifying structural options and leather specifications.",
    icon: FileCheck,
    artisanNote: "Design blueprint locked. Client dimensions verified against master patterns."
  },
  {
    id: 2,
    name: "Master Hide Vetting & Fiber Inspection",
    location: "Florence Workshop, Italy",
    description: "Atelier hide selectors examine full-grain aniline sides, checking fiber density, grain uniformity, and organic hide tallows.",
    icon: Layers,
    artisanNote: "Selected a spectacular 2.2mm gauge Tuscan hide with gorgeous organic markings. Perfect structural fiber tension."
  },
  {
    id: 3,
    name: "Chestnut Vegetable Tanning & Conditioning",
    location: "San Miniato Tannery, Tuscany",
    description: "Slow 24-day tanning in cold pit chestnut bark immersion. Nourished with hand-applied pure beeswax and neat's-foot oil.",
    icon: Droplet,
    artisanNote: "24-day immersion sequence complete. Hide cured with rich, safe honeyed color and distinctive cedarwood aroma."
  },
  {
    id: 4,
    name: "Artisan Hand-Cutting & Pattern Matching",
    location: "Florence Workshop, Italy",
    description: "Individual panels are meticulously hand-cut with steel shears, aligning natural grain flow with high-stress bag seams.",
    icon: Scissors,
    artisanNote: "Grain matching complete. Re-checking thickness across the structural shoulder pieces."
  },
  {
    id: 5,
    name: "Saddle Stitching & High-Tensile Threadwork",
    location: "Florence Workshop, Italy",
    description: "Seams sewn utilizing wax-saturated German nylon threads, using double-drop edge stitching for permanent durability.",
    icon: Activity,
    artisanNote: "Saddle-stitching in progress. Handles joined using high-stress brass hardware anchors. Exceptional hold."
  },
  {
    id: 6,
    name: "Seam Glazing, Hot-Iron Edge Waxing & Sealed",
    location: "Florence Workshop, Italy",
    description: "Raw edges receive seven successive coats of premium natural organic edge glaze, burnished using hot-iron horn bone tools.",
    icon: ShieldCheck,
    artisanNote: "Final edge glaze applied and heat-sealed. Embossed with Aurelius silver-leaf seal of authentication."
  },
  {
    id: 7,
    name: "VIP Courier Dispatch & Security Craton",
    location: "Milan Courier Hub",
    description: "Crated in a moisture-secure security case, wrapped in raw combed organic cotton dust covers. Transited to priority global air courier.",
    icon: Plane,
    artisanNote: "Safely packed into solid chestnut cedar crate. Shipped via air priority express. Freight code verified."
  },
  {
    id: 8,
    name: "White-Glove Courier Delivery",
    location: "Client Destination Hub",
    description: "Local luxury carrier conducts final secure transit. Hand-delivered in heavy linen boxes with VIP verification.",
    icon: Truck,
    artisanNote: "Assigned to dedicated VIP local courier agent. Scheduled for direct hand-delivery today."
  }
];

// Seeded/Preset tracking records
interface PresetTracker {
  code: string;
  stageIndex: number; // 0 to 7
  item: string;
  client: string;
  artisan: string;
  customNotes?: Record<number, string>;
}

const PRESET_TRACKERS: Record<string, PresetTracker> = {
  "AUR-1042": {
    code: "AUR-1042",
    stageIndex: 2, // Chestnut Tanning
    item: "The Overlander Duffle Bag (Cognac Hide)",
    client: "Dmitri V. (New York City)",
    artisan: "Giovanni Vecchio",
    customNotes: {
      2: "Tanning vat chemistry monitored daily. The rich chestnut tannins have infused the fibers beautifully. Ready to move to cutting room tomorrow."
    }
  },
  "AUR-7891": {
    code: "AUR-7891",
    stageIndex: 5, // Seam Glazing & Finished
    item: "The Corporate Ascent Briefcase (Obsidian Black)",
    client: "Helena S. (London)",
    artisan: "Elena Moretti",
    customNotes: {
      5: "Burnishing is complete. The hot-iron horn tool has polished the obsidian edges to a deep glass-like lustre. Packing team preparing secure crate."
    }
  },
  "AUR-3305": {
    code: "AUR-3305",
    stageIndex: 7, // Shipped / Out for Delivery
    item: "The Nomad Folio Case & Sterling Card Holder",
    client: "Marcus K. (Zurich)",
    artisan: "Matteo Rossi",
    customNotes: {
      7: "Our Swiss transport desk has confirmed final courier transit. Hand-delivery is scheduled for noon. Representative will call ahead."
    }
  }
};

// Generate deterministic details based on the order code input
function getDeterministicProgress(codeStr: string): { stageIndex: number; item: string; client: string; artisan: string } {
  const cleanCode = codeStr.trim().toUpperCase();
  
  if (PRESET_TRACKERS[cleanCode]) {
    return PRESET_TRACKERS[cleanCode];
  }

  // Generate deterministic stage index using sum of character codes
  let charSum = 0;
  for (let i = 0; i < cleanCode.length; i++) {
    charSum += cleanCode.charCodeAt(i);
  }
  
  const stageIndex = charSum % 8; // 0 to 7
  
  const products = [
    "The Overlander Duffle Bag",
    "The Corporate Ascent Briefcase",
    "The Tuscany Voyager Weekender",
    "The Executive Folio Portfolio",
    "The Classic Minimalist Billfold",
    "The Continental Card Sleeve",
    "The Atelier Beeswax Care Set"
  ];
  
  const clients = [
    "Alistair P. (Geneva)",
    "Charlotte B. (Paris)",
    "Robert T. (Tokyo)",
    "Sophia L. (Singapore)",
    "Niko G. (Athens)",
    "Maximilian R. (Frankfurt)",
    "Elena K. (Vienna)"
  ];

  const artisans = [
    "Matteo Rossi",
    "Elena Moretti",
    "Giovanni Vecchio",
    "Paolo Belcastro",
    "Serena Giraldi"
  ];

  const item = products[charSum % products.length];
  const client = clients[(charSum + 2) % clients.length];
  const artisan = artisans[(charSum + 4) % artisans.length];

  return { stageIndex, item, client, artisan };
}

export default function OrderTracker() {
  const [orderCode, setOrderCode] = useState("");
  const [searchedCode, setSearchedCode] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<ReturnType<typeof getDeterministicProgress> | null>(null);
  
  // SMS subscriptions state
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsStatus, setSmsStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) return;
    
    const info = getDeterministicProgress(orderCode);
    setTrackingInfo(info);
    setSearchedCode(orderCode.trim().toUpperCase());
    setSmsStatus(null); // Clear previous subscriptions when searching new order
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setSmsStatus({ success: false, message: "Please enter a valid phone number." });
      return;
    }
    if (!smsConsent) {
      setSmsStatus({ success: false, message: "Please consent to receiving SMS notifications." });
      return;
    }
    
    setSmsStatus({
      success: true,
      message: `Direct secure SMS ledger linked! Updates for commission ${searchedCode} will be sent to ${phone}.`
    });
  };

  // Safe helper to simulate step dates (ordered from received to now)
  const getSimulatedStepDate = (stepIndex: number, currentStageIndex: number) => {
    if (stepIndex > currentStageIndex) return null;
    const date = new Date();
    // Move dates backwards
    date.setDate(date.getDate() - (currentStageIndex - stepIndex) * 3 - 2);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="bg-[#111111] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans min-h-[70vh]">
      <div className="max-w-4xl mx-auto">
        
        {/* Stage Header */}
        <div className="text-center mb-10">
          <span className="font-mono text-[9px] tracking-[0.35em] text-[#C5A05A] uppercase block mb-2">
            Active Commission Ledger
          </span>
          <h1 className="font-serif text-3xl sm:text-4.5xl font-medium tracking-tight text-white mb-3">
            Atelier Order Tracker
          </h1>
          <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
            Monitor the physical pilgrimage of your bespoke leather goods. Each step is individually certified by our Master Artisan and registered inside our permanent ledger.
          </p>
        </div>

        {/* Tracker Search Console */}
        <div className="bg-[#1A1A1A] border border-[#C5A05A]/25 rounded p-6 sm:p-8 shadow-2xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="block text-[10px] font-mono tracking-widest text-[#C5A05A] uppercase mb-2 font-semibold">
                Your Unique Commission Code
              </label>
              <div className="relative flex items-center bg-[#222222] border border-gray-800 focus-within:border-[#C5A05A] rounded px-3 py-2 transition-all">
                <Search className="h-4 w-4 text-[#C5A05A] mr-2" />
                <input
                  type="text"
                  placeholder="e.g. AUR-1042, AUR-7891, or create a code (e.g. AUR-5501)..."
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm w-full outline-none text-white placeholder-gray-500 font-mono"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-6 py-2.5 font-semibold uppercase tracking-wider text-[11px] transition-colors rounded whitespace-nowrap h-[42px] cursor-pointer"
            >
              Verify Ledger
            </button>
          </form>

          {/* Quick links to pre-configured master codes */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono text-gray-500">
            <span>Signature commissions currently in workshop:</span>
            {Object.keys(PRESET_TRACKERS).map((code) => (
              <button
                key={code}
                onClick={() => {
                  setOrderCode(code);
                  const info = getDeterministicProgress(code);
                  setTrackingInfo(info);
                  setSearchedCode(code);
                  setSmsStatus(null);
                }}
                className="text-[#C5A05A] hover:text-[#A5673F] underline focus:outline-none transition-colors cursor-pointer"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Tracking Results Area */}
        <AnimatePresence mode="wait">
          {trackingInfo && searchedCode ? (
            <motion.div
              key={searchedCode}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Commission Card Overview */}
              <div className="bg-[#1A1A1A] border-l-4 border-l-[#C5A05A] border-y border-r border-[#C5A05A]/15 rounded p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-mono text-[#C5A05A] tracking-widest uppercase block mb-0.5">Masterpiece commissioned</span>
                  <h3 className="font-serif text-base font-semibold text-white">{trackingInfo.item}</h3>
                  
                  <div className="mt-3 flex items-center space-x-2 text-[11px] font-mono text-gray-400">
                    <MapPin className="h-3.5 w-3.5 text-[#C5A05A]" />
                    <span>Client: {trackingInfo.client}</span>
                  </div>
                </div>

                <div className="sm:text-right flex flex-col justify-between sm:items-end">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase block mb-0.5">Ledger Code</span>
                    <span className="font-mono text-xs text-white font-bold tracking-wider">{searchedCode}</span>
                  </div>
                  
                  <div className="mt-3 sm:mt-0">
                    <span className="text-[9px] font-mono text-[#C5A05A] tracking-widest uppercase block mb-0.5">Assigned Master Artisan</span>
                    <span className="text-[11px] font-serif italic text-gray-300 font-semibold">{trackingInfo.artisan}</span>
                  </div>
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 sm:p-8">
                <h4 className="font-serif text-sm text-white font-semibold uppercase tracking-wider mb-6 pb-2 border-b border-gray-800">
                  Crafting Timeline & Status History
                </h4>

                <div className="relative pl-6 sm:pl-8 border-l border-gray-800 space-y-8 sm:space-y-10">
                  {STAGES.map((stage, idx) => {
                    const isCompleted = idx < trackingInfo.stageIndex;
                    const isActive = idx === trackingInfo.stageIndex;
                    const isFuture = idx > trackingInfo.stageIndex;
                    const IconComponent = stage.icon;
                    const date = getSimulatedStepDate(idx, trackingInfo.stageIndex);

                    return (
                      <div key={stage.id} className="relative">
                        {/* Bullet circle on line */}
                        <div className={`absolute -left-[31px] sm:-left-[39px] top-0 h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                          isCompleted 
                            ? "bg-[#C5A05A]/25 border border-[#C5A05A] text-[#C5A05A]" 
                            : isActive 
                            ? "bg-[#C5A05A] border border-[#C5A05A] text-black animate-pulse" 
                            : "bg-[#222222] border border-gray-800 text-gray-600"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : isActive ? (
                            <Clock className="h-3.5 w-3.5 text-black" />
                          ) : (
                            <IconComponent className="h-3 w-3" />
                          )}
                        </div>

                        {/* Stage Content */}
                        <div className={`transition-all ${isFuture ? "opacity-45" : "opacity-100"}`}>
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <span className={`text-xs sm:text-sm font-serif font-semibold ${isActive ? "text-[#C5A05A]" : "text-white"}`}>
                              {stage.name}
                            </span>
                            
                            {/* Date display */}
                            {date && (
                              <span className="text-[10px] font-mono text-[#C5A05A]">{date}</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                            <span>{stage.location}</span>
                            <span>•</span>
                            <span className={isActive ? "text-[#C5A05A] font-bold" : isCompleted ? "text-gray-400" : "text-gray-600"}>
                              {isActive ? "Active Stage" : isCompleted ? "Completed" : "Scheduled"}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-gray-400 leading-relaxed font-sans">
                            {stage.description}
                          </p>

                          {/* Artisan Comments for Active/Completed steps */}
                          {!isFuture && (
                            <div className="mt-3 bg-[#222] border-l-2 border-[#C5A05A]/40 rounded-r p-3 text-[11px] font-mono text-gray-300 italic leading-relaxed">
                              <span className="not-italic text-[9px] uppercase tracking-wider font-bold block mb-1 text-gray-400">
                                Logbook - {trackingInfo.artisan}:
                              </span>
                              "{PRESET_TRACKERS[searchedCode]?.customNotes?.[idx] || stage.artisanNote}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SMS Notification Form */}
              <div className="bg-[#1A1A1A] border border-[#C5A05A]/25 rounded p-6 sm:p-8">
                <div className="flex items-start space-x-3 mb-4">
                  <Phone className="h-5 w-5 text-[#C5A05A] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-serif text-sm text-white font-semibold uppercase tracking-wider">
                      Atelier SMS Progress Alerts
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Our artisans publish updates directly to our digital ledger. Receive a private text message each time your hide is cured, stitched, or signed off by the workshop.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSmsSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono tracking-widest text-[#C5A05A] uppercase mb-1.5 font-bold">
                        Phone Number for VIP Texts
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#222222] text-xs border border-gray-800 focus:border-[#C5A05A] rounded px-3 py-2 text-white placeholder-gray-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="smsConsentCheckbox"
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-800 bg-[#222222] text-[#C5A05A] focus:ring-[#C5A05A] cursor-pointer"
                    />
                    <label htmlFor="smsConsentCheckbox" className="ml-2 text-[11px] text-gray-400 leading-relaxed cursor-pointer select-none">
                      I authorize the Aurelius Atelier to transmit progress updates regarding commission <span className="font-mono text-white font-bold">{searchedCode}</span> to this mobile device. No marketing or promotions, ever.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#C5A05A]/10 hover:bg-[#C5A05A] border border-[#C5A05A] text-[#C5A05A] hover:text-black font-semibold text-[10px] tracking-widest uppercase px-4 py-2 rounded transition-all cursor-pointer"
                  >
                    Subscribe to Craft Milestones
                  </button>
                </form>

                {smsStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded text-xs font-mono flex items-center space-x-2 ${
                      smsStatus.success 
                        ? "bg-green-950/40 border border-green-800 text-green-300" 
                        : "bg-red-950/40 border border-red-800 text-red-300"
                    }`}
                  >
                    {smsStatus.success ? (
                      <Sparkles className="h-4 w-4 text-green-400 flex-shrink-0 animate-pulse" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                    <span>{smsStatus.message}</span>
                  </motion.div>
                )}
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 bg-[#1A1A1A] rounded border border-dashed border-gray-800"
            >
              <p className="font-serif text-base font-medium text-gray-300 mb-2">No Commission Query Active</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Please enter your master ledger tracking code above to reveal your leather masterpiece's pilgrimage timeline.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
