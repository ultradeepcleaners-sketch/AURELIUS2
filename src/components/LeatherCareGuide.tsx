import React, { useState } from "react";
import { 
  Sparkles, ShieldCheck, Droplet, Flame, Award, Brush, Info, CheckCircle2, 
  AlertTriangle, Eye, ShieldAlert, Heart, Scissors, Play, Check, RefreshCw, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LeatherCategory {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  origin: string;
  patinaRating: string;
  waterTolerance: string;
  description: string;
  bgTexture: string; // Tailwind color or gradient
  tools: { name: string; desc: string }[];
  steps: { title: string; action: string; desc: string }[];
  proTip: {
    title: string;
    sub: string;
    content: string;
    secretIngredient: string;
  };
}

const LEATHER_CATEGORIES: LeatherCategory[] = [
  {
    id: "crazy_horse",
    name: "Crazy Horse Leather",
    subtitle: "Saddle-Waxed Pull-Up Hide",
    tagline: "Gets more beautiful with every scratch, recording your life's journeys.",
    origin: "Tuscan Heavy Calf-Skins",
    patinaRating: "Exceptional (Rapid Aging)",
    waterTolerance: "Moderate (Wax Sealed)",
    description: "Made by applying thick, specialized natural wax layers to a pre-buffed full-grain surface. Rubbing or scratching the leather shifts the underlying oils, creating dynamic shifts in color tone (known as the 'pull-up' effect). Rather than wearing out, it continuously self-heals and builds a rich rustic heritage patina.",
    bgTexture: "bg-gradient-to-br from-[#2E1A0F] to-[#4A2F1B]",
    tools: [
      { name: "Horsehair Dauber Brush", desc: "For sweeping out micro-dust from wrinkles." },
      { name: "Lanolin-Rich Balm", desc: "To deeply nourish and redistribute deep waxes." },
      { name: "Soft Cotton Flannel Cloth", desc: "To buff and activate the pull-up waxes with heat." }
    ],
    steps: [
      { 
        title: "Phase 1: Dry Dust Removal", 
        action: "Brush with light pressure", 
        desc: "Always begin by vigorously sweeping with a dry horsehair brush. Dust particles are abrasive and can get embedded into the wax layers if you apply cream directly." 
      },
      { 
        title: "Phase 2: Oil Redistribution", 
        action: "Rub with warm fingertips", 
        desc: "For minor scuffs, simply rub the surface in a circular motion with your thumb. Your body heat liquefies the localized wax molecules and flows them back into the scratch." 
      },
      { 
        title: "Phase 3: Season Conditioning", 
        action: "Apply thin organic balm", 
        desc: "Every 4 to 6 months, apply a pea-sized amount of lanolin balm. This maintains the skin's biological tensile strength and keeps the fiber matrix supple." 
      }
    ],
    proTip: {
      title: "The Florentine Hairdryer Restoration Trick",
      sub: "Artisan Wax Relocation Technique",
      content: "If your Crazy Horse travel bag is heavily scuffed after a flight, don't panic. Hold a standard hairdryer 15cm away from the scuffs on a warm setting for 30 seconds. Watch the high heat melt the solid beeswax. The dry scratches will immediately dissolve as the wax flows flat, restoring a deep, uniform chocolate color tone without stripping the patina.",
      secretIngredient: "Moderate convection heat (45°C - 50°C)"
    }
  },
  {
    id: "calfskin",
    name: "Aurelius Calfskin",
    subtitle: "Full-Grain Butter-Soft Aniline",
    tagline: "Ultra-fine, supple, and radiant. The choice of royalty.",
    origin: "Piedmont Alpine Pastures",
    patinaRating: "Subtle (Deepens Gently)",
    waterTolerance: "Delicate (Aniline Glazed)",
    description: "Our calfskin represents the absolute apex of luxury. Sourced from cold alpine valleys to prevent insect damage, it has an incredibly tight grain structure. We treat it with pure aniline natural dye, allowing the skin pores to remain completely visible. It is exceptionally soft, smooth, and lightweight, demanding refined, elegant care.",
    bgTexture: "bg-gradient-to-br from-[#121212] to-[#261F18]",
    tools: [
      { name: "Ultra-Fine Microfiber Cloth", desc: "Prevents any micro-abrasions on aniline lacquer." },
      { name: "Beeswax & Carnauba Cream", desc: "Provides high-mirror shine and moisture glaze." },
      { name: "Polishing Glove", desc: "Used for rapid high-speed surface buffing." }
    ],
    steps: [
      { 
        title: "Phase 1: Moisture Blotting", 
        action: "Immediate dry tap", 
        desc: "Aniline calfskin has open pores. If caught in the rain, immediately dab (do not rub!) dry with a clean cloth to prevent water spot rings." 
      },
      { 
        title: "Phase 2: Hydration Creaming", 
        action: "Circular wax cream application", 
        desc: "Apply a specialty delicate water-based cream. Circular movements help the fine leather fibers absorb collagen without choking the skin pores." 
      },
      { 
        title: "Phase 3: High-Gloss Glaze", 
        action: "High-speed friction buffing", 
        desc: "Using a bone-dry flannel rag, buff with quick, sweeping strokes. Friction heat fuses carnauba wax to the top layer, generating a glass-like shine." 
      }
    ],
    proTip: {
      title: "The Spit-Shine Mirror Polish Secret",
      sub: "High-Gloss Glaze Mastery",
      content: "To achieve our showroom 'Mirror-Edge' look, apply a thin coat of wax polish and let it dry for 5 minutes. Then, put a single drop of cold water on the leather and buff it with a microfiber cloth wrapped around your fingers. The water drop forces the wax particles to flatten out completely rather than clumping, forming an optical glass-like glaze.",
      secretIngredient: "A single drop of ice water during final buffing"
    }
  },
  {
    id: "suede",
    name: "Classic Italian Suede",
    subtitle: "Velve-Napped Reverse Grain",
    tagline: "Sensual, highly tactile, and uniquely elegant. Water is its natural enemy.",
    origin: "Tuscan Hill Ateliers",
    patinaRating: "Low (Needs texture preservation)",
    waterTolerance: "Extremely Low (Raw Nap)",
    description: "Suede is made by slicing the soft inner layer of full-grain hides, exposing a fibrous velvety napped texture. Because it has no natural outer wax protective barrier, its fibers are susceptible to staining and moisture. Suede care is entirely unique, focusing on dry brushing and nanotechnology water-barrier shields.",
    bgTexture: "bg-gradient-to-br from-[#4E3F30] to-[#2B2117]",
    tools: [
      { name: "Crepe Rubber Brush", desc: "Pulls up raw nap fibers and removes dry stains." },
      { name: "Brass Wire Brush", desc: "Used gently to revive flattened, matted suede areas." },
      { name: "Nanoprotect Spray", desc: "Creates an invisible water-repelling mesh." }
    ],
    steps: [
      { 
        title: "Phase 1: Nap Alignment", 
        action: "Brush in one single direction", 
        desc: "Regularly brush suede in the direction of the natural grain. This keeps dust from building up in the soft pile and maintains that velvet touch." 
      },
      { 
        title: "Phase 2: Stain Erasure", 
        action: "Rub with rubber crepe block", 
        desc: "If you get a dry smudge or oil spot, use a crepe brush block. The tacky rubber catches the dirt particles directly without flattening the fibers." 
      },
      { 
        title: "Phase 3: Barrier Spraying", 
        action: "Nanotech liquid repeller mist", 
        desc: "Suede requires liquid protection. Mist the product from 20cm away twice a year. Water drops will slide off harmlessly without soaking in." 
      }
    ],
    proTip: {
      title: "The Steam Vapor Lift for Matted Suede",
      sub: "Textured Fiber Revival",
      content: "If your suede bag has flat spots or grease streaks, do not apply leather balms—they will permanently ruin the velvet. Instead, hold the flat spots over a steaming kettle or steam iron (at a safe distance of 25cm) for 10 seconds. The hot vapor swells the crushed individual hair follicles. Immediately follow up with a firm crepe brush session to pull the nap upright, restoring factory-fresh volume.",
      secretIngredient: "Pure kettle steam vapor + immediate crepe brushing"
    }
  }
];

export default function LeatherCareGuide() {
  const [activeTab, setActiveTab] = useState<string>("crazy_horse");
  const [selectedProTip, setSelectedProTip] = useState<LeatherCategory["proTip"] | null>(null);

  // Interactive Mini Simulators States
  // 1. Crazy horse scratch simulator
  const [scratches, setScratches] = useState<{ id: number; x: number; y: number; opacity: number }[]>([
    { id: 1, x: 20, y: 35, opacity: 0.95 },
    { id: 2, x: 65, y: 22, opacity: 0.85 },
    { id: 3, x: 45, y: 65, opacity: 0.90 }
  ]);
  const [buffCount, setBuffCount] = useState<number>(0);

  // 2. Calfskin mirror shine simulator
  const [shinePercent, setShinePercent] = useState<number>(20);
  const [appliedWaxCount, setAppliedWaxCount] = useState<number>(0);

  // 3. Suede nap flattener simulator
  const [napMattedness, setNapMattedness] = useState<number>(85); // 100 is completely ruined/flat
  const [brushingCount, setBrushingCount] = useState<number>(0);

  const activeCategory = LEATHER_CATEGORIES.find(c => c.id === activeTab) || LEATHER_CATEGORIES[0];

  // Simulator actions
  const handleBuffCrazyHorse = () => {
    setScratches(prev => prev.map(s => ({
      ...s,
      opacity: Math.max(0, s.opacity - 0.25)
    })));
    setBuffCount(p => p + 1);
  };

  const handleResetCrazyHorse = () => {
    setScratches([
      { id: 1, x: 20, y: 35, opacity: 0.95 },
      { id: 2, x: 65, y: 22, opacity: 0.85 },
      { id: 3, x: 45, y: 65, opacity: 0.90 }
    ]);
    setBuffCount(0);
  };

  const handleApplyCalfskinWax = () => {
    if (appliedWaxCount < 5) {
      setAppliedWaxCount(p => p + 1);
      setShinePercent(p => Math.min(100, p + 16));
    }
  };

  const handleResetCalfskin = () => {
    setShinePercent(20);
    setAppliedWaxCount(0);
  };

  const handleBrushSuede = () => {
    if (napMattedness > 0) {
      setNapMattedness(p => Math.max(0, p - 20));
      setBrushingCount(p => p + 1);
    }
  };

  const handleResetSuede = () => {
    setNapMattedness(85);
    setBrushingCount(0);
  };

  return (
    <div className="space-y-12">
      
      {/* Category selector buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LEATHER_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                // Reset sims
                handleResetCrazyHorse();
                handleResetCalfskin();
                handleResetSuede();
              }}
              className={`text-left p-6 rounded border transition-all duration-300 relative overflow-hidden group
                ${isActive 
                  ? "bg-[#1A1A1A] border-[#C5A05A] shadow-2xl shadow-[#C5A05A]/10 scale-[1.02]" 
                  : "bg-[#151515]/80 border-gray-900 hover:border-gray-800 hover:bg-[#1A1A1A]/50"
                }
              `}
            >
              {/* Dynamic tag badge */}
              <div className="absolute top-0 right-0 bg-[#C5A05A]/10 text-[#C5A05A] text-[8.5px] font-mono px-3 py-1 uppercase rounded-bl tracking-wider border-l border-b border-[#C5A05A]/15">
                {cat.id === "suede" ? "Raw Nap" : "Glazed"}
              </div>

              <div className="space-y-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A05A] font-bold block">
                  Atelier Leather Class
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                  {cat.name}
                </h3>
                <p className="text-gray-400 text-xs font-light leading-relaxed min-h-[36px]">
                  {cat.subtitle} — {cat.tagline.substring(0, 50)}...
                </p>

                {/* Micro characteristics bar */}
                <div className="pt-3 border-t border-gray-800/60 flex justify-between items-center text-[10px] font-mono text-gray-500">
                  <span>Patina: <span className="text-gray-300">{cat.patinaRating.split(" ")[0]}</span></span>
                  <span>Water: <span className="text-gray-300">{cat.waterTolerance.split(" ")[0]}</span></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Material Profile Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Detailed information (Span 7) */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border border-gray-800 rounded p-6 sm:p-8 space-y-8 shadow-xl">
          
          {/* Header Title */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <span className="bg-[#C5A05A]/10 text-[#C5A05A] border border-[#C5A05A]/20 px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest rounded">
                Origine: {activeCategory.origin}
              </span>
              <span className="text-gray-500 font-mono text-[10px]">Patina: {activeCategory.patinaRating}</span>
            </div>
            
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-medium leading-tight">
              {activeCategory.name} Care Protocol
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
              {activeCategory.description}
            </p>
          </div>

          {/* Three Phases Sequence */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A05A] block mb-2">Recommended Care Cycle</span>
            <div className="grid grid-cols-1 gap-4">
              {activeCategory.steps.map((step, idx) => (
                <div key={idx} className="bg-[#111111] border border-gray-800/80 rounded p-4 flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/35 text-[#C5A05A] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-xs sm:text-sm text-white font-medium">{step.title}</span>
                      <span className="text-[9px] font-mono uppercase bg-neutral-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700/60 font-semibold">
                        Action: {step.action}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs font-light leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools required list */}
          <div className="pt-6 border-t border-gray-800/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-3">Atelier Recommended Toolkit</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeCategory.tools.map((tool, index) => (
                <div key={index} className="bg-[#111111] border border-gray-800 p-3.5 rounded text-xs">
                  <div className="flex items-center space-x-1.5 mb-1.5 text-[#C5A05A]">
                    <Brush className="h-4 w-4" />
                    <span className="font-serif font-semibold text-white">{tool.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal font-light">
                    {tool.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Callouts: The Pro-Tip trigger button */}
          <div className="pt-6 border-t border-gray-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Info className="h-4 w-4 text-[#C5A05A] flex-shrink-0" />
              <span>Improper chemical formulas can dry up hide natural collagens.</span>
            </div>
            
            <button
              onClick={() => setSelectedProTip(activeCategory.proTip)}
              className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-5 py-3 uppercase font-mono text-[9.5px] tracking-widest font-bold rounded flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-[#C5A05A]/10 border border-transparent"
            >
              <Sparkles className="h-4 w-4" />
              <span>Reveal Atelier Pro-Tip</span>
            </button>
          </div>

        </div>

        {/* Right column: Interactive Maintenance Simulator Studio (Span 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Main Simulator Card */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-gray-800/70">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-[#C5A05A] animate-pulse" />
                  <span className="font-serif font-semibold text-white">Atelier Care Simulator</span>
                </div>
                <span className="text-[8.5px] font-mono bg-neutral-900 border border-gray-800 rounded px-2 py-0.5 uppercase tracking-wider text-gray-400">
                  Interactive Studio
                </span>
              </div>

              {/* SIMULATOR 1: CRAZY HORSE SCRATCH RECOVERY */}
              {activeTab === "crazy_horse" && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-xs font-light leading-relaxed text-center">
                    Crazy Horse's pull-up wax finish gets dry-scuffed easily, but can be self-healed by redistributing the natural tallows. Buff the scuffs away using localized heat below!
                  </p>

                  <div className="bg-[#111111] rounded border border-gray-800/80 p-4 relative select-none h-44 flex flex-col justify-between">
                    <div className="text-[9.5px] uppercase tracking-wider text-[#C5A05A] font-mono text-center mb-2">
                      Crazy Horse Leather Strip (2.0mm Wax-Treated)
                    </div>

                    {/* Virtual leather surface */}
                    <div className="flex-1 w-full bg-[#402816] rounded border border-[#2d1b0d] relative overflow-hidden flex items-center justify-center shadow-inner">
                      
                      {/* Rustic wood/hide texture backing */}
                      <div className="absolute inset-0 bg-[radial-gradient(#4d321d_1.5px,transparent_1.5px)] [background-size:10px_10px] opacity-40" />

                      {/* Scratches layers */}
                      {scratches.map(sc => (
                        <div 
                          key={sc.id}
                          className="absolute h-1.5 bg-yellow-100 rounded-full blur-[1px] shadow-sm transform -rotate-12 transition-all duration-300"
                          style={{
                            top: `${sc.y}%`,
                            left: `${sc.x}%`,
                            width: `${sc.id * 18 + 12}px`,
                            opacity: sc.opacity,
                            boxShadow: `0 0 4px rgba(254, 243, 199, ${sc.opacity})`
                          }}
                        />
                      ))}

                      {buffCount >= 4 ? (
                        <div className="bg-black/85 backdrop-blur-sm p-3 rounded border border-green-900/40 text-center mx-4 relative z-10">
                          <Check className="h-4 w-4 text-green-400 mx-auto mb-1" />
                          <span className="font-mono text-[9px] text-green-300 uppercase tracking-widest font-bold">Patina Repaired!</span>
                          <p className="text-[9.5px] text-gray-400 leading-normal font-light mt-0.5">
                            High heat from friction buffing has successfully liquefied the beeswaxes, blending colors uniformly.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center relative z-10 bg-black/40 px-2.5 py-1.5 rounded">
                          <span className="font-mono text-[8.5px] text-amber-200 uppercase tracking-widest animate-pulse font-semibold">
                            Pending Buffing...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-2.5">
                      <span>Friction buff passes: <span className="text-white font-bold">{buffCount}</span></span>
                      <span>Scuff Density: <span className="text-white font-bold">{scratches.filter(s => s.opacity > 0).length} Scuffs</span></span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleBuffCrazyHorse}
                      disabled={buffCount >= 4}
                      className="flex-1 bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3 text-[9.5px] uppercase font-mono tracking-widest font-bold rounded transition-colors"
                    >
                      {buffCount >= 4 ? "Fully Buffed" : "Apply Friction Buff"}
                    </button>
                    <button
                      onClick={handleResetCrazyHorse}
                      className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 p-3 rounded transition-all text-gray-400 hover:text-white"
                      title="Reset Simulator"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SIMULATOR 2: CALFSKIN HIGH-GLOSS SHINE */}
              {activeTab === "calfskin" && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-xs font-light leading-relaxed text-center">
                    Aniline Calfskin responds exquisitely to friction and organic carnauba waxes. Rub thin layers of glazing cream and buff to achieve a mirror showroom finish.
                  </p>

                  <div className="bg-[#111111] rounded border border-gray-800/80 p-4 relative select-none h-44 flex flex-col justify-between">
                    <div className="text-[9.5px] uppercase tracking-wider text-[#C5A05A] font-mono text-center mb-2">
                      Aniline Piedmont Hide (Gloss Finish Index)
                    </div>

                    {/* Virtual calfskin surface */}
                    <div className="flex-1 w-full bg-[#1e1a17] rounded border border-neutral-950 relative overflow-hidden flex items-center justify-center shadow-inner transition-all duration-500">
                      
                      {/* Dynamic light sheen flare reflecting shine percentage */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 transition-opacity duration-500 pointer-events-none"
                        style={{ 
                          opacity: (shinePercent - 20) / 100 * 0.45,
                          transform: `skewX(-15deg) translateX(${shinePercent - 50}px)` 
                        }}
                      />

                      {/* Gloss progress ring */}
                      <div className="text-center relative z-10 space-y-1.5 bg-black/60 px-4 py-3 rounded border border-gray-800/60">
                        <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest font-semibold block">
                          Glaçage Shine Index
                        </span>
                        <div className="text-xl font-serif text-[#C5A05A] font-extrabold tracking-wide">
                          {shinePercent}% Shine
                        </div>
                        <span className="text-[8.5px] text-gray-500 font-mono tracking-widest uppercase">
                          {shinePercent >= 80 ? "♛ Royal Mirror Finish" : shinePercent >= 50 ? "Satin Gloss" : "Dull Matte"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-2.5">
                      <span>Wax Applications: <span className="text-white font-bold">{appliedWaxCount} / 5</span></span>
                      <span>Gloss Level: <span className="text-white font-bold">{shinePercent >= 80 ? "Imperial" : "Supple"}</span></span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleApplyCalfskinWax}
                      disabled={appliedWaxCount >= 5}
                      className="flex-1 bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3 text-[9.5px] uppercase font-mono tracking-widest font-bold rounded transition-colors"
                    >
                      {appliedWaxCount >= 5 ? "Perfect Glaze Achieved" : "Apply Carnauba & Buff"}
                    </button>
                    <button
                      onClick={handleResetCalfskin}
                      className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 p-3 rounded transition-all text-gray-400 hover:text-white"
                      title="Reset Shine"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SIMULATOR 3: SUEDE TEXTURED NAP REVIVAL */}
              {activeTab === "suede" && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-xs font-light leading-relaxed text-center">
                    Suede fibers (the 'nap') get crushed or flattened due to grease or humidity. Use the rubber crepe brush to lift the crushed fibers and restore the velvet pile.
                  </p>

                  <div className="bg-[#111111] rounded border border-gray-800/80 p-4 relative select-none h-44 flex flex-col justify-between">
                    <div className="text-[9.5px] uppercase tracking-wider text-[#C5A05A] font-mono text-center mb-2">
                      Italian Velvet Suede (Reverse Hide)
                    </div>

                    {/* Suede texture */}
                    <div className="flex-1 w-full bg-[#3d3023] rounded border border-[#2b2016] relative overflow-hidden flex items-center justify-center shadow-inner">
                      
                      {/* Crushed nap overlay lines */}
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#231b14,#231b14_2px,#3d3023_2px,#3d3023_8px)] opacity-50" />

                      {/* Display mattedness status */}
                      <div className="text-center relative z-10 bg-black/75 px-4 py-3 rounded border border-gray-800/60 space-y-1">
                        <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block">
                          Crushed Pile Level
                        </span>
                        <div className={`text-lg font-serif font-extrabold ${napMattedness > 40 ? "text-red-400 animate-pulse" : napMattedness > 10 ? "text-amber-300" : "text-green-400"}`}>
                          {napMattedness}% Matted
                        </div>
                        <span className="text-[8.5px] text-gray-500 font-mono uppercase tracking-widest block font-medium">
                          {napMattedness === 0 ? "✓ Velvet Nap Revived" : "Crushed Flat Spots"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-2.5">
                      <span>Brush Strokes: <span className="text-white font-bold">{brushingCount}</span></span>
                      <span>Fiber Elasticity: <span className="text-white font-bold">{100 - napMattedness}% Supple</span></span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleBrushSuede}
                      disabled={napMattedness === 0}
                      className="flex-1 bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white disabled:bg-neutral-800 disabled:text-gray-500 py-3 text-[9.5px] uppercase font-mono tracking-widest font-bold rounded transition-colors"
                    >
                      {napMattedness === 0 ? "Nap Lifted Perfectly" : "Work Crepe Rubber Brush"}
                    </button>
                    <button
                      onClick={handleResetSuede}
                      className="bg-neutral-900 hover:bg-neutral-800 border border-gray-800 p-3 rounded transition-all text-gray-400 hover:text-white"
                      title="Reset Nap"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Quick Care Caution Warning Badge */}
          <div className="bg-red-950/20 border border-red-900/40 p-4 rounded text-xs space-y-2">
            <div className="flex items-center space-x-2 text-red-300 font-bold">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span className="font-serif">Universal Prohibitions</span>
            </div>
            <p className="text-gray-400 font-light leading-relaxed text-[11px]">
              Never use alcohol, liquid dish soaps, or silicone-based waterproofing aerosols on premium full-grain hides. These clog the leather pores, drying the dermis until microscopic cracks form.
            </p>
          </div>

        </div>

      </div>

      {/* ================================== */}
      {/* THE PRO-TIP DIALOGUE MODAL WINDOW  */}
      {/* ================================== */}
      <AnimatePresence>
        {selectedProTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            
            {/* Backdrop layer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProTip(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* Modal Body Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#1A1A1A] border border-[#C5A05A]/45 rounded shadow-2xl relative max-w-lg w-full overflow-hidden text-left z-10"
            >
              
              {/* Gold Top Header bar */}
              <div className="bg-gradient-to-r from-[#111111] via-[#2F241F] to-[#111111] px-6 py-4 border-b border-[#C5A05A]/20 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-[#C5A05A]" />
                  <span className="font-mono text-[9px] tracking-widest text-[#C5A05A] uppercase font-bold">Atelier Master Secret</span>
                </div>
                <button 
                  onClick={() => setSelectedProTip(null)}
                  className="text-gray-400 hover:text-white hover:bg-neutral-800 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body Information */}
              <div className="p-6 space-y-5 text-xs sm:text-sm">
                
                <div>
                  <span className="font-mono text-[8.5px] uppercase tracking-widest text-gray-500 font-bold block mb-1">
                    {selectedProTip.sub}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-medium tracking-tight">
                    {selectedProTip.title}
                  </h3>
                </div>

                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-light font-sans bg-[#111111] p-4 rounded border border-gray-800/80">
                  {selectedProTip.content}
                </p>

                {/* Secret ingredient indicator panel */}
                <div className="bg-[#2E241F]/40 border border-[#C5A05A]/15 p-4 rounded flex items-center space-x-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-[#C5A05A]/10 text-[#C5A05A] flex items-center justify-center font-bold">
                    ★
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500 font-bold block">
                      Secret Agent / Element
                    </span>
                    <span className="text-white font-serif font-bold text-[12px]">
                      {selectedProTip.secretIngredient}
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#111111] border-t border-gray-800/80 flex justify-end">
                <button
                  onClick={() => setSelectedProTip(null)}
                  className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-5 py-2.5 uppercase font-mono text-[9px] tracking-widest font-bold rounded transition-colors"
                >
                  Acquire Knowledge
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
