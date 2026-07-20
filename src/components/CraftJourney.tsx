import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, ShieldCheck, Calendar, Hammer, Play, Pause, RefreshCw, 
  ChevronRight, ArrowRight, Volume2, VolumeX, Flame, Award, Cpu, 
  Scissors, Heart, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LeatherCareGuide from "./LeatherCareGuide";

// Web Audio API Synthesizer to create zero-dependency ambient sound effects
class AtelierSoundSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (browser security autoplay policies)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 1. Hammer Thud on Leather block
  playMalletThud() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    // Deep low thump
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // 2. Leather Needle Pull & Friction stitch
  playStitchDraw() {
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.12; // short noise burst
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start();
  }

  // 3. Heated Brass Edger Glazing (Sizzle)
  playEdgerSizzle() {
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start();
  }

  // 4. Hot Metal Crest Branding (Long Sizzle + Burn)
  playBrandSteam() {
    this.init();
    if (!this.ctx) return;
    
    // Create oscillator for low rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.5);
    
    oscGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    
    // Create white noise for high-pitched hot iron sizzle
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2500, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    osc.start();
    noiseNode.start();
    
    osc.stop(this.ctx.currentTime + 0.7);
  }
}

// Instantiate Synth
const synth = new AtelierSoundSynth();

interface StepData {
  id: number;
  title: string;
  phaseName: string;
  duration: string;
  location: string;
  tools: string[];
  headline: string;
  description: string;
  artisanInsight: {
    name: string;
    role: string;
    quote: string;
  };
  keyFact: string;
  imageUrl: string;
  soundscapeLabel: string;
  onSoundTrigger: () => void;
  videoSubtitles: string[];
}

export default function CraftJourney() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoTimelinePercent, setVideoTimelinePercent] = useState<number>(35);
  const [subtitleIndex, setSubtitleIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSubTab, setSelectedSubTab] = useState<"journey" | "sandbox" | "care">("journey");

  // Sandbox simulation states
  const [stitchProgress, setStitchProgress] = useState<number>(0);
  const [glazeProgress, setGlazeProgress] = useState<number>(0);
  const [brandHeat, setBrandHeat] = useState<number>(20); // Celsius (ambient)
  const [isBranding, setIsBranding] = useState<boolean>(false);
  const [brandStatus, setBrandStatus] = useState<"ready" | "heating" | "done" | "underdone" | "overdone">("ready");
  const [brandFeedback, setBrandFeedback] = useState<string>("");
  const brandTimerRef = useRef<any>(null);

  const steps: StepData[] = [
    {
      id: 0,
      title: "I. Sourcing",
      phaseName: "Raw Leather Verification",
      duration: "Continuous",
      location: "Tuscan Alpine Pastures",
      tools: ["Micrometer gauge", "Polarized inspection lens", "Atelier grading register"],
      headline: "Only raw hides exceeding a 2.0mm thickness are selected for our ateliers.",
      description: "Our standards permit only full-grain, unsplit cowhides selected from small French and Swiss alpine farms where cool climates minimize insect bites. By entirely bypassing mass commercial cattle feedlots, we preserve the pristine natural dermal hierarchy. Each skin is analyzed by touch to ensure dense dermal elasticity, then cataloged under our register.",
      artisanInsight: {
        name: "Matteo Gherardini",
        role: "Senior Hide Inspector",
        quote: "Quality is not added during stitching; it is discovered in the raw materials. If the hide doesn't carry strength in its fibers, no saddle stitch in Milan will save it."
      },
      keyFact: "We reject over 92% of inspected hides to maintain perfect grain continuity across all patterns.",
      imageUrl: "https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&q=80&w=800",
      soundscapeLabel: "Hide Sorting Mallet Tap",
      onSoundTrigger: () => synth.playMalletThud(),
      videoSubtitles: [
        "Analyzing grain density under custom polarized glare-free lighting...",
        "Measuring fiber gauge thickness with our precision mechanical caliper...",
        "Verified. This premium raw skin is registered as grade A-Plus grain structure."
      ]
    },
    {
      id: 1,
      title: "II. Vegetable Tanning",
      phaseName: "Slow Chestnut Tanning Pilgrimage",
      duration: "24 Days",
      location: "Pisa Organic Vats, Tuscany",
      tools: ["Oak stirring paddles", "Pure chestnut bark extract", "Cold alpine river vats"],
      headline: "A slow 24-day biological soak in organic chestnut barks, omitting all synthetic chrome.",
      description: "Unlike modern toxic chrome tannages that speed-finish in 24 hours, our Tuscan artisans use raw chestnut bark, oak, and mimosa extracts. Suspended vertically in wooden vats, the hides slowly breathe in the natural tannins. This organic process maintains fiber tensile strength and yields that famous warm earth fragrance.",
      artisanInsight: {
        name: "Francesca Morelli",
        role: "Master Tanner (7th Generation)",
        quote: "Chrome hides smell of gasoline and die within five years. Vegetable tanning creates a living, breathing material that records your travels and matures into a caramel gold."
      },
      keyFact: "Our cold-water tanning baths require exactly 576 hours of slow, constant thermal monitoring.",
      imageUrl: "https://images.unsplash.com/photo-1524294078988-8ee69a72f61d?auto=format&fit=crop&q=80&w=800",
      soundscapeLabel: "Vat Stirring Deep Thud",
      onSoundTrigger: () => synth.playMalletThud(),
      videoSubtitles: [
        "Rotating organic chestnut solutions in our historic pine tanning drums...",
        "Checking tannin saturation levels across deep internal hide layers...",
        "Excellent. Natural copper-gold fermentation color tone achieved."
      ]
    },
    {
      id: 2,
      title: "III. Precision Cutting",
      phaseName: "Surgical Pattern Cutting",
      duration: "4.5 Hours",
      location: "Northampton Cutting Table",
      tools: ["Tempered steel scalpel", "Hardwood brass templates", "Saddleweight clamps"],
      headline: "Surgical scalpel incisions bypassing all skin scars and growth lines.",
      description: "With seasoned eyes, our cutters avoid stretch lines or loose flank hide regions. Every panel is hand-positioned using heavyweight bronze templates, then hand-sliced with a single continuous scalpel swipe. Slicing with a single stroke prevents micro-fraying at the edges, facilitating a completely air-tight border seal during edgeburnishing.",
      artisanInsight: {
        name: "Arthur Pendelton",
        role: "Chief Pattern cutter",
        quote: "No two hides cut the same. You must read the flow of the cow's spine, adjusting your blade angle dynamically to match the natural tension of the fiber weave."
      },
      keyFact: "Each briefcase involves 22 distinct hand-cut panels, aligned to place the densest grain on stress-bearing joints.",
      imageUrl: "https://images.unsplash.com/photo-1590552515252-3a5a1bce7bed?auto=format&fit=crop&q=80&w=800",
      soundscapeLabel: "Blade Drag & Leather Friction",
      onSoundTrigger: () => synth.playStitchDraw(),
      videoSubtitles: [
        "Aligning the solid brass cutting template along the cow spine grain vector...",
        "Executing clean, continuous scalpel pressure across the shoulder bend panel...",
        "Clean edge alignment. Ready for traditional dual-needle prep."
      ]
    },
    {
      id: 3,
      title: "IV. Traditional Saddle Stitch",
      phaseName: "Double-Needle Saddle Stitching",
      duration: "18 Hours",
      location: "Milan Sewing Bench",
      tools: ["Polished bone creaser", "Two John James harness needles", "Beeswaxed linen thread"],
      headline: "Two needles crossing in a continuous figure-eight pattern. Unbreakable lock stitching.",
      description: "Our handcraft relies solely on the legendary 'saddle stitch' executed entirely with two needles and a single thread waxed in pure organic beeswax. Because the thread constantly loops in a double-helix, if any individual stitch is cut or worn through during decades of travel, the surrounding stitches remain locked in place. No sewing machine can emulate this integrity.",
      artisanInsight: {
        name: "Giovanni Rossi",
        role: "Senior Saddler",
        quote: "Sewing machines use lockstitches that unrave if snagged. When I lock a double saddle stitch, it's bound for a hundred years of flight baggage handling."
      },
      keyFact: "Every single stitch is pulled, tensioned, and knotted with 18 pounds of manual hand tension.",
      imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800",
      soundscapeLabel: "Stitch Thread Pull",
      onSoundTrigger: () => synth.playStitchDraw(),
      videoSubtitles: [
        "Threading the double-ended beeswaxed linen cord through the pony vise...",
        "Passing needle B back through the existing puncture hole for loop locking...",
        "Tensioning the knot. Notice the signature 45-degree handcraft stitch slant."
      ]
    },
    {
      id: 4,
      title: "V. Edge Burnishing",
      phaseName: "Heated Brass Iron Glazing",
      duration: "3 Hours",
      location: "Florence Edge Atelier",
      tools: ["Heated brass glazing creaser", "Vegetable gum tragecanth", "Organic beeswax block"],
      headline: "Applying fire-heated irons to melt beeswax deep into the fibers, sealing raw leather edges forever.",
      description: "Raw edges are susceptible to moisture ingress. We finish raw edges using a meticulous seven-layer process. The border is hand-beveled, sanded with five distinct grit levels, coated with organic sap extracts, and sealed using fire-heated brass irons. Under the thermal pressure, the beeswax liquefies and fuses with the raw hide fibers, hardening into a glassy deep finish.",
      artisanInsight: {
        name: "Silvia Bertoni",
        role: "Edge-Gilder & Finisher",
        quote: "Cheap bags hide raw edges with thick plastic paint that cracks in winter. Our heated iron melts beeswax directly into the skin cells. It never flakes, because it is fused."
      },
      keyFact: "Our seven-layer edge finishing requires a proprietary natural plant gum boiled fresh daily in Florence.",
      imageUrl: "https://images.unsplash.com/photo-1459664018906-085c36f472af?auto=format&fit=crop&q=80&w=800",
      soundscapeLabel: "Edge Creasing Hot Hiss",
      onSoundTrigger: () => synth.playEdgerSizzle(),
      videoSubtitles: [
        "Sanding down raw leather joint edges to mirror-smooth level...",
        "Running the 140°C heated brass creasing tool to seal fiber boundaries...",
        "Applying organic dark beeswax coating. Smooth glazed finish confirmed."
      ]
    },
    {
      id: 5,
      title: "VI. Signature Brand",
      phaseName: "Heat Crest Branding & Hand-pack",
      duration: "1 Hour",
      location: "Unified Atelier Registry",
      tools: ["Custom brass brand seal", "Purity certificate", "Linen dust sleeves"],
      headline: "Applying our historic brass crest brand and recording the unique registry serial.",
      description: "Once finished, each masterpiece faces thorough quality checks. The final step is the heat branding of our Aurelius coat-of-arms directly into the hide using a heavy cast-brass iron stamp heated over a natural furnace. This leaves a deep, caramelized, and permanent indentation. A certificate of provenance is hand-signed and enclosed.",
      artisanInsight: {
        name: "Alexander Stirling",
        role: "Founder & Curator",
        quote: "Our brand is not a stamp of ownership. It is our pledge. When you see our deep heat brand, you know that 30 hours of slow human devotion went into that single carry."
      },
      keyFact: "Each item receives a unique five-digit leather registry code tied directly to the lead saddler's journal.",
      imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800",
      soundscapeLabel: "Hot Metal Brand Sizzle",
      onSoundTrigger: () => synth.playBrandSteam(),
      videoSubtitles: [
        "Aligning the heavy hand-cut brass Aurelius brand stamp perfectly...",
        "Pressing down onto the vegetable-tanned leather under high thermal weight...",
        "Stunning. Golden caramelized imprint. Hand-signing provenance document."
      ]
    }
  ];

  const currentStepData = steps[activeStep];

  // Video looping simulator effect
  useEffect(() => {
    let interval: any = null;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setVideoTimelinePercent((prev) => {
          if (prev >= 100) {
            setSubtitleIndex((sub) => (sub + 1) % currentStepData.videoSubtitles.length);
            return 0;
          }
          return prev + 1.5;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo, activeStep, currentStepData]);

  // Handle step click
  const handleStepSelect = (idx: number) => {
    setActiveStep(idx);
    setVideoTimelinePercent(0);
    setSubtitleIndex(0);
    if (soundEnabled) {
      steps[idx].onSoundTrigger();
    }
  };

  // Interactive Stitching Mini Simulator
  const handleStitchClick = () => {
    if (stitchProgress < 12) {
      setStitchProgress(p => p + 1);
      if (soundEnabled) {
        synth.playStitchDraw();
      }
    }
  };

  const handleResetStitch = () => {
    setStitchProgress(0);
  };

  // Interactive Hot Branding Mini Simulator
  const startHeatingBrand = () => {
    if (brandStatus === "done") return;
    setIsBranding(true);
    setBrandStatus("heating");
    
    brandTimerRef.current = setInterval(() => {
      setBrandHeat(prev => {
        if (prev >= 320) {
          clearInterval(brandTimerRef.current);
          setIsBranding(false);
          setBrandStatus("overdone");
          setBrandFeedback("Over-branded. The leather charred and lost pristine hide integrity.");
          if (soundEnabled) synth.playBrandSteam();
          return 320;
        }
        if (soundEnabled && Math.random() > 0.7) {
          synth.playEdgerSizzle();
        }
        return prev + 12;
      });
    }, 100);
  };

  const stopHeatingBrand = () => {
    if (brandStatus !== "heating") return;
    clearInterval(brandTimerRef.current);
    setIsBranding(false);
    
    // Optimal branding temp is 220C - 260C
    if (brandHeat < 200) {
      setBrandStatus("underdone");
      setBrandFeedback("Faint Brand. The heated brass was too cold to sear the vegetable fibers.");
    } else if (brandHeat >= 200 && brandHeat <= 270) {
      setBrandStatus("done");
      setBrandFeedback("Flawless Atelier Mark! Perfect caramelized depth. Certificate granted.");
      if (soundEnabled) {
        synth.playBrandSteam();
      }
    } else {
      setBrandStatus("overdone");
      setBrandFeedback("Over-burned hide. Excessive thermal exposure damaged the leather cells.");
      if (soundEnabled) {
        synth.playBrandSteam();
      }
    }
  };

  const handleResetBrand = () => {
    setBrandHeat(20);
    setBrandStatus("ready");
    setBrandFeedback("");
  };

  return (
    <div id="craftsmanship-journey-section" className="bg-[#111111] py-14 font-sans text-xs sm:text-sm text-[#FCFCFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="font-mono text-[9px] tracking-[0.35em] text-[#C5A05A] uppercase block mb-3">Slow-Fashion Manifesto</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-white mb-4">THE CHRONICLE OF SLOW HANDCRAFT</h1>
          <p className="text-xs sm:text-base text-gray-400 leading-relaxed font-light">
            Each Aurelius masterpiece is hand-born through a 30-hour slow, rhythmic sequence of inspection, chestnut veg-tanning, surgical hand-cutting, saddle-stitching, and edge-creasing. Explore our timeless pilgrimage below.
          </p>

          {/* Tab Selection */}
          <div className="flex flex-wrap justify-center mt-8 gap-3 sm:space-x-4 border-b border-gray-800/60 pb-3 max-w-xl mx-auto">
            <button
              onClick={() => setSelectedSubTab("journey")}
              className={`pb-2 px-4 uppercase tracking-widest text-[10px] font-mono font-bold transition-all ${selectedSubTab === "journey" ? "text-[#C5A05A] border-b border-[#C5A05A]" : "text-gray-500 hover:text-gray-300"}`}
            >
              Interactive Timeline
            </button>
            <button
              onClick={() => setSelectedSubTab("sandbox")}
              className={`pb-2 px-4 uppercase tracking-widest text-[10px] font-mono font-bold transition-all ${selectedSubTab === "sandbox" ? "text-[#C5A05A] border-b border-[#C5A05A]" : "text-gray-500 hover:text-gray-300"}`}
            >
              Atelier Sandbox
            </button>
            <button
              onClick={() => setSelectedSubTab("care")}
              className={`pb-2 px-4 uppercase tracking-widest text-[10px] font-mono font-bold transition-all ${selectedSubTab === "care" ? "text-[#C5A05A] border-b border-[#C5A05A]" : "text-gray-500 hover:text-gray-300"}`}
            >
              Leather Care Guide
            </button>
          </div>
        </div>

        {/* SOUND MODE FLOATER CONTROLLER */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if(!soundEnabled) {
                synth.playMalletThud();
              }
            }}
            className="flex items-center space-x-2 bg-[#1A1A1A] border border-[#C5A05A]/25 hover:border-[#C5A05A]/60 px-3.5 py-2 rounded text-[10px] uppercase font-mono tracking-wider text-gray-300 hover:text-white transition-all shadow-md"
            title="Toggle synthesized workshop auditory effects"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-[#C5A05A] animate-pulse" />
                <span>Atelier Audio: Enabled</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-gray-500" />
                <span>Atelier Audio: Muted</span>
              </>
            )}
          </button>
        </div>

        {selectedSubTab === "journey" ? (
          <div>
            {/* Interactive Horizon Timeline Stepper */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-4 sm:p-6 mb-10 shadow-xl overflow-x-auto">
              <div className="min-w-[700px] flex justify-between relative">
                
                {/* Horizontal progress bar background */}
                <div className="absolute top-[26px] left-[5%] right-[5%] h-[2px] bg-neutral-800 z-0" />
                
                {/* Active progress fill */}
                <div 
                  className="absolute top-[26px] left-[5%] h-[2px] bg-[#C5A05A] transition-all duration-700 z-0"
                  style={{ width: `${(activeStep / (steps.length - 1)) * 90}%` }}
                />

                {steps.map((st, idx) => {
                  const isActive = idx === activeStep;
                  const isPassed = idx < activeStep;
                  return (
                    <button 
                      key={st.id}
                      onClick={() => handleStepSelect(idx)}
                      className="flex-1 flex flex-col items-center relative z-10 focus:outline-none group"
                    >
                      {/* Step Bubble Icon */}
                      <div 
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-serif text-sm font-semibold
                          ${isActive ? "bg-[#C5A05A] border-white text-black scale-110 shadow-2xl shadow-[#C5A05A]/40" : ""}
                          ${isPassed ? "bg-[#2E241F] border-[#C5A05A] text-[#C5A05A]" : ""}
                          ${!isActive && !isPassed ? "bg-[#111111] border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300" : ""}
                        `}
                      >
                        {idx + 1}
                      </div>

                      <span className={`mt-3 font-serif text-xs tracking-wide transition-colors
                        ${isActive ? "text-[#C5A05A] font-bold" : "text-gray-400 group-hover:text-gray-200"}
                      `}>
                        {st.title.split(". ")[1] || st.title}
                      </span>
                      
                      <span className="text-[9px] text-gray-500 font-mono tracking-wider mt-0.5">
                        {st.duration}
                      </span>
                    </button>
                  );
                })}

              </div>
            </div>

            {/* Primary Detail Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left detail panel (Span 7) */}
              <div className="lg:col-span-7 bg-[#1A1A1A] border border-gray-800 rounded p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#C5A05A]/10 text-[#C5A05A] border-l border-b border-[#C5A05A]/20 px-3.5 py-1 text-[9px] font-mono tracking-widest uppercase rounded-bl font-semibold">
                  {currentStepData.location}
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A05A] font-bold block mb-1">
                      {currentStepData.phaseName}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-white font-medium leading-tight">
                      {currentStepData.title} • {currentStepData.title.split(" ")[1]}
                    </h2>
                  </div>

                  <p className="font-serif text-sm text-gray-200 italic leading-relaxed border-l-2 border-[#C5A05A] pl-4 bg-[#111111]/60 py-3 rounded-r">
                    "{currentStepData.headline}"
                  </p>

                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light font-sans">
                    {currentStepData.description}
                  </p>

                  {/* Active Atelier Tools */}
                  <div className="pt-4 border-t border-gray-800/70">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 block mb-2">Essential Atelier Tools</span>
                    <div className="flex flex-wrap gap-2">
                      {currentStepData.tools.map((t, index) => (
                        <span key={index} className="bg-[#111111] border border-gray-800 text-gray-300 font-mono text-[10.5px] px-3 py-1.5 rounded flex items-center space-x-1.5">
                          <Hammer className="h-3 w-3 text-[#C5A05A]" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Artisan Quote Panel */}
                  <div className="bg-[#2E241F]/40 border border-[#C5A05A]/20 rounded p-4 text-xs">
                    <p className="text-gray-300 italic leading-relaxed mb-3">
                      "{currentStepData.artisanInsight.quote}"
                    </p>
                    <div className="flex justify-between items-center text-[10.5px] font-mono">
                      <span className="text-[#C5A05A] font-bold">{currentStepData.artisanInsight.name}</span>
                      <span className="text-gray-400 font-light">{currentStepData.artisanInsight.role}</span>
                    </div>
                  </div>

                </div>

                {/* Bottom verification badge */}
                <div className="pt-6 border-t border-gray-800/70 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10.5px]">
                  <div className="flex items-center space-x-1.5 text-gray-400 font-mono">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Fact: {currentStepData.keyFact}</span>
                  </div>
                  <button
                    onClick={() => handleStepSelect((activeStep + 1) % steps.length)}
                    className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-4 py-2 uppercase font-mono text-[9px] tracking-widest font-bold rounded flex items-center justify-center space-x-1 transition-colors ml-auto sm:ml-0"
                  >
                    <span>Proceed Phase</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>

              {/* Right Artisan video-loop simulation (Span 5) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                
                {/* Player Wrapper */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded overflow-hidden shadow-2xl flex flex-col justify-between">
                  
                  {/* Top Bar info */}
                  <div className="px-4 py-3 bg-[#111111]/80 border-b border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <div className="flex items-center space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      <span className="uppercase font-bold tracking-wider text-white">Live Loop Feed</span>
                    </div>
                    <span>Milan Atelier Cam • 1080p 60fps</span>
                  </div>

                  {/* Panoramic zooming image stage simulating real-time looping motion */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden group">
                    <motion.img 
                      src={currentStepData.imageUrl} 
                      alt={currentStepData.title}
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                      animate={{
                        scale: isPlayingVideo ? [1, 1.08, 1] : 1.02,
                        x: isPlayingVideo ? [-5, 5, -5] : 0,
                        y: isPlayingVideo ? [-3, 3, -3] : 0
                      }}
                      transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />

                    {/* Dark grading overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />

                    {/* Quick Play/Pause controller */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <button 
                        onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                        className="bg-black/80 hover:bg-[#C5A05A] text-[#FCFCFA] hover:text-black p-4 rounded-full transition-all border border-white/20 transform hover:scale-110"
                      >
                        {isPlayingVideo ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                      </button>
                    </div>

                    {/* Real-time Subtitle Overlay describing exact process */}
                    <div className="absolute bottom-4 inset-x-4 bg-black/80 backdrop-blur-md p-3 rounded border border-gray-800/80 text-center">
                      <p className="font-mono text-[10.5px] text-[#C5A05A] tracking-wider uppercase font-semibold mb-1">
                        Artisan Operation:
                      </p>
                      <p className="text-[11px] text-gray-200 font-light leading-relaxed min-h-[34px] flex items-center justify-center">
                        {currentStepData.videoSubtitles[subtitleIndex]}
                      </p>
                    </div>

                    {/* Soundscape action trigger button bottom-right */}
                    <div className="absolute top-4 right-4 bg-black/75 px-2.5 py-1.5 rounded border border-gray-800 flex items-center space-x-1.5 cursor-pointer hover:bg-neutral-950 transition-all" onClick={currentStepData.onSoundTrigger}>
                      <Volume2 className="h-3 w-3 text-[#C5A05A]" />
                      <span className="text-[8px] font-mono tracking-widest uppercase font-semibold text-gray-300">Play Audio</span>
                    </div>

                  </div>

                  {/* Video scrubber timeline panel */}
                  <div className="p-4 bg-[#111] text-xs font-mono text-gray-400 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <button 
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)} 
                          className="hover:text-white"
                        >
                          {isPlayingVideo ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                        <span>Clipped stream loop</span>
                      </div>
                      <span>{Math.floor(videoTimelinePercent / 10)}s / 10s</span>
                    </div>

                    {/* Scrubber track */}
                    <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
                      <div 
                        className="bg-[#C5A05A] h-full transition-all"
                        style={{ width: `${videoTimelinePercent}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Side prompt card */}
                <div className="bg-[#2E241F]/20 border border-[#C5A05A]/20 p-5 rounded text-xs space-y-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-[#C5A05A] animate-pulse" />
                    <span className="font-serif font-semibold text-[#FCFCFA]">Sensory Soundscapes</span>
                  </div>
                  <p className="text-gray-400 font-light leading-relaxed">
                    This timeline uses custom web-synthesized acoustic cues to emulate our physical tools. Tap the sound icon or transition phases to activate.
                  </p>
                </div>

              </div>

            </div>
          </div>
        ) : selectedSubTab === "sandbox" ? (
          /* ==================================== */
          /* ATELIER HAND-CRAFT SANDBOX SIMULATION */
          /* ==================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Interactive Module 1: The Saddle Stitch */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-xl flex flex-col justify-between text-center relative overflow-hidden">
              <div>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Scissors className="h-5 w-5 text-[#C5A05A]" />
                  <span className="font-serif text-lg font-semibold text-white">Saddle Stitch Vise</span>
                </div>
                <p className="text-gray-400 text-xs mb-6 font-light leading-relaxed">
                  Machine stitches unravel easily. Re-create the double-needle linen weave manually. Tap the stitching holes in order to thread the lock cord.
                </p>

                {/* The Virtual Stitch Board */}
                <div className="bg-[#111111] rounded border border-gray-800/80 p-5 mb-6 relative select-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#C5A05A] font-mono mb-4">
                    Tuscan Veg-Tanned Hide (2.2mm Shoulder)
                  </div>
                  
                  {/* Visual leather strap edge */}
                  <div className="w-full h-16 bg-[#5c3d24] rounded-lg border-2 border-[#3d2411] relative flex items-center px-4 justify-between shadow-inner">
                    <div className="absolute inset-y-1 left-2 w-[calc(100%-16px)] border-t border-dashed border-[#C5A05A]/25 z-0" />
                    
                    {/* Interactive Stitch Hole elements */}
                    {[...Array(12)].map((_, i) => {
                      const isStitched = i < stitchProgress;
                      const isNext = i === stitchProgress;
                      return (
                        <div 
                          key={i}
                          onClick={isNext ? handleStitchClick : undefined}
                          className={`w-4 h-4 rounded-full relative z-10 flex items-center justify-center cursor-pointer transition-all duration-300
                            ${isStitched ? "bg-amber-800 border border-[#C5A05A]" : ""}
                            ${isNext ? "bg-[#C5A05A] border border-white animate-pulse" : ""}
                            ${!isStitched && !isNext ? "bg-neutral-900 border border-gray-700 hover:border-gray-500" : ""}
                          `}
                          title={isNext ? "Tap to sew here" : ""}
                        >
                          {/* Sown Thread line linking holes */}
                          {isStitched && (
                            <div className="absolute w-8 h-[3px] bg-[#C5A05A] rotate-[28deg] -translate-x-1 rounded-full shadow z-20" />
                          )}
                          <span className="text-[7px] font-mono text-black font-extrabold">
                            {isStitched ? "✓" : i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-4">
                    <span>Double-Helix Locks: <span className="text-white font-bold">{stitchProgress} / 12</span></span>
                    <span>Tension: 18 lbs manual</span>
                  </div>
                </div>
              </div>

              <div>
                {stitchProgress === 12 ? (
                  <div className="bg-green-950/20 border border-green-900/40 p-4 rounded text-xs mb-4">
                    <p className="text-green-300 font-bold mb-1">✓ Stitch Integrity Sealed</p>
                    <p className="text-gray-400 leading-relaxed text-[11px]">
                      Outstanding. This structural stitch joint cannot unravel, resisting lifetimes of suitcase handling.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-mono mb-4 animate-pulse">
                    Click the pulsing gold point to loop needle A & B...
                  </p>
                )}

                <button
                  onClick={handleResetStitch}
                  className="w-full bg-[#111111] hover:bg-[#C5A05A] border border-gray-800 hover:border-transparent text-gray-300 hover:text-black py-3.5 text-[9.5px] uppercase font-mono tracking-widest font-semibold rounded transition-colors"
                >
                  Reset Sewing Vise
                </button>
              </div>
            </div>

            {/* Interactive Module 2: Heated Brass Branding */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-xl flex flex-col justify-between text-center relative overflow-hidden">
              <div>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Flame className="h-5 w-5 text-[#C5A05A]" />
                  <span className="font-serif text-lg font-semibold text-white">Heated Brass Crest Brand</span>
                </div>
                <p className="text-gray-400 text-xs mb-6 font-light leading-relaxed">
                  Hold down the heater to warm the heavy solid brass brand. Release within the optimal temperature range (220°C - 270°C) to stamp our crest cleanly.
                </p>

                {/* Brand heat display panel */}
                <div className="bg-[#111111] rounded border border-gray-800/80 p-5 mb-6">
                  
                  {/* Temperature meter gauge */}
                  <div className="flex justify-between items-center mb-2 font-mono text-[10px]">
                    <span className="text-gray-400">Brass iron temp:</span>
                    <span className={`font-bold ${brandHeat >= 200 && brandHeat <= 270 ? "text-[#C5A05A]" : brandHeat > 270 ? "text-red-500 animate-pulse" : "text-gray-200"}`}>
                      {brandHeat}°C
                    </span>
                  </div>

                  <div className="w-full bg-neutral-900 h-4 rounded overflow-hidden relative mb-4">
                    {/* Optimal range indicator zone (200 - 270) */}
                    <div className="absolute left-[56%] w-[21%] h-full bg-green-500/25 border-l border-r border-green-500/50 flex items-center justify-center text-[7px] text-green-300 font-mono tracking-widest uppercase font-bold">
                      Optimal
                    </div>

                    {/* Progress track */}
                    <div 
                      className="h-full transition-all duration-100 ease-linear rounded"
                      style={{ 
                        width: `${(brandHeat / 320) * 100}%`,
                        backgroundColor: brandHeat > 270 ? "#ef4444" : brandHeat >= 200 ? "#C5A05A" : "#854d0e" 
                      }}
                    />
                  </div>

                  {/* Visual leather item being branded */}
                  <div className="h-20 bg-[#422c1b] rounded border border-neutral-950 flex items-center justify-center relative shadow-inner overflow-hidden">
                    
                    {/* Raw leather texture back */}
                    <div className="absolute inset-0 bg-[radial-gradient(#5a3d24_1px,transparent_1px)] [background-size:8px_8px] opacity-35" />

                    {/* Stamped brand effect */}
                    {brandStatus !== "ready" && brandStatus !== "heating" && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`font-serif uppercase tracking-[0.2em] font-extrabold text-center relative z-10 p-3 select-none
                          ${brandStatus === "done" ? "text-amber-950 font-bold drop-shadow-[0_1.5px_rgba(0,0,0,0.55)] border border-amber-950/40 rounded bg-amber-900/10 scale-105" : ""}
                          ${brandStatus === "underdone" ? "text-[#7a593f]/30 border border-dashed border-[#7a593f]/10" : ""}
                          ${brandStatus === "overdone" ? "text-neutral-950 bg-black/50 border border-red-900/40 rounded scale-105 animate-pulse" : ""}
                        `}
                      >
                        <Sparkles className={`h-5 w-5 mx-auto mb-1 ${brandStatus === "done" ? "text-[#C5A05A]" : "text-gray-600"}`} />
                        <span className="text-[10px] font-bold">Aurelius Atelier</span>
                        <div className="text-[7px] font-mono tracking-widest uppercase mt-0.5 opacity-80">PROVENANCE VERIFIED</div>
                      </motion.div>
                    )}

                    {brandStatus === "heating" && (
                      <div className="text-[9px] uppercase tracking-widest text-[#C5A05A] font-mono animate-pulse font-bold">
                        Heating Furnace Brass...
                      </div>
                    )}
                    {brandStatus === "ready" && (
                      <div className="text-[9px] uppercase tracking-widest text-gray-500 font-mono font-medium">
                        Awaiting heat brand seal
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <div>
                {brandFeedback && (
                  <div className={`p-4 rounded text-xs mb-4 text-center border
                    ${brandStatus === "done" ? "bg-green-950/20 border-green-900/40 text-green-300" : ""}
                    ${brandStatus === "underdone" ? "bg-amber-950/20 border-amber-900/40 text-amber-300" : ""}
                    ${brandStatus === "overdone" ? "bg-red-950/20 border-red-900/40 text-red-300" : ""}
                  `}>
                    <div className="flex items-center justify-center space-x-1.5 mb-1 font-bold">
                      {brandStatus === "done" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span>{brandStatus === "done" ? "Peerless Mark" : "Verification Failed"}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{brandFeedback}</p>
                  </div>
                )}

                {brandStatus === "ready" || brandStatus === "heating" ? (
                  <button
                    onMouseDown={startHeatingBrand}
                    onMouseUp={stopHeatingBrand}
                    onMouseLeave={stopHeatingBrand}
                    onTouchStart={startHeatingBrand}
                    onTouchEnd={stopHeatingBrand}
                    className="w-full bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-4 text-[10px] uppercase font-mono tracking-widest font-bold rounded transition-colors cursor-pointer select-none"
                  >
                    {brandStatus === "heating" ? "Release to Stamp!" : "Hold to Heat Brass Brand"}
                  </button>
                ) : (
                  <button
                    onClick={handleResetBrand}
                    className="w-full bg-[#111111] hover:bg-[#C5A05A] border border-gray-800 hover:border-transparent text-gray-300 hover:text-black py-3.5 text-[9.5px] uppercase font-mono tracking-widest font-semibold rounded transition-colors"
                  >
                    Reset Heated Iron
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Module 3: Edge Burnish & Crease */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded p-6 shadow-xl flex flex-col justify-between text-center relative overflow-hidden">
              <div>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Award className="h-5 w-5 text-[#C5A05A]" />
                  <span className="font-serif text-lg font-semibold text-white">Edge Burnishing Wheel</span>
                </div>
                <p className="text-gray-400 text-xs mb-6 font-light leading-relaxed">
                  Cheap hides display painted raw borders that crack easily. Drag our sanding wax slider to glaze and heat-seal raw edge fibers permanently.
                </p>

                {/* The Burnishing Station */}
                <div className="bg-[#111111] rounded border border-gray-800/80 p-5 mb-6">
                  <div className="text-[9px] uppercase tracking-wider text-[#C5A05A] font-mono mb-4">
                    Edge Glaze Saturation Track
                  </div>

                  {/* Interactive burnishing slider */}
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={glazeProgress}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setGlazeProgress(val);
                      if (soundEnabled && val % 10 === 0) {
                        synth.playEdgerSizzle();
                      }
                    }}
                    className="w-full mb-6 accent-[#C5A05A]"
                  />

                  {/* Visual leather boundary edge display */}
                  <div className="relative h-20 bg-[#1A1A1A] border border-gray-800 rounded flex flex-col justify-center px-4 overflow-hidden">
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-gray-500 mb-2">
                      <span>RAW FIBER BORDER</span>
                      <span>GLASSY BURNISHED EDGE</span>
                    </div>

                    {/* Edge strap visualization */}
                    <div className="w-full h-6 bg-[#4e3621] rounded relative overflow-hidden shadow">
                      
                      {/* Left raw frayed zone */}
                      <div className="absolute inset-y-0 left-0 w-full bg-[#362212] z-0">
                        {/* Fray lines simulating unburnished fibers */}
                        <div className="w-full h-full opacity-65 flex items-center justify-around">
                          {[...Array(12)].map((_, i) => (
                            <span key={i} className="text-amber-950 font-serif text-[10px] scale-y-125">|</span>
                          ))}
                        </div>
                      </div>

                      {/* Right glazed zone expanding dynamically */}
                      <div 
                        className="absolute inset-y-0 left-0 bg-[#241306] border-r-4 border-[#C5A05A] transition-all z-10 flex items-center justify-end pr-3"
                        style={{ width: `${glazeProgress}%` }}
                      >
                        {glazeProgress > 10 && (
                          <div className="h-1.5 w-full bg-gradient-to-r from-amber-950 via-[#C5A05A] to-[#111] opacity-75 shadow-inner" />
                        )}
                        
                        {/* Glowing glaze sparks */}
                        {glazeProgress > 0 && glazeProgress < 100 && (
                          <span className="absolute -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A05A] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A05A]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-4">
                    <span>Glaze Saturation: <span className="text-white font-bold">{glazeProgress}%</span></span>
                    <span>Finish: {glazeProgress === 100 ? "Glass Seal" : "Raw Fiber"}</span>
                  </div>
                </div>
              </div>

              <div>
                {glazeProgress === 100 ? (
                  <div className="bg-green-950/20 border border-green-900/40 p-4 rounded text-xs mb-4">
                    <p className="text-green-300 font-bold mb-1">✓ Fused Protective Glaze</p>
                    <p className="text-gray-400 leading-relaxed text-[11px]">
                      Excellent. The beeswax plant gum formula has completely penetrated the border fibers, protecting from rain.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-mono mb-4 animate-pulse">
                    Slide fully to the right to seal raw hides...
                  </p>
                )}

                <button
                  onClick={() => setGlazeProgress(0)}
                  className="w-full bg-[#111111] hover:bg-[#C5A05A] border border-gray-800 hover:border-transparent text-gray-300 hover:text-black py-3.5 text-[9.5px] uppercase font-mono tracking-widest font-semibold rounded transition-colors"
                >
                  Reset Glaze Wheel
                </button>
              </div>
            </div>

          </div>
        ) : (
          <LeatherCareGuide />
        )}

        {/* Master Artisan Certification Banner */}
        <div className="mt-16 bg-[#1A1A1A] border border-[#C5A05A]/30 p-6 sm:p-10 rounded shadow-2xl text-center relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient(from_top_right,rgba(197,160,90,0.1),transparent) pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6">
            <Award className="h-10 w-10 text-[#C5A05A] mx-auto animate-pulse" />
            <span className="font-mono text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block">Atelier Heritage Guarantee</span>
            <h2 className="font-serif text-xl sm:text-3xl text-white font-medium tracking-tight leading-tight">
              Each Masterpiece carries the <br />
              <span className="italic gold-gradient-text">Aurelius Lifetime Restoration Oath</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-light">
              We stand unconditionally by our handcraft. Because our full-grain hides are tanned organically in Florence and locked manually with saddle-stitching, we support your travel legacy forever. If a seam or edge glazing should ever wear thin, return it to our atelier for complimentary restoration.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-6 text-[10.5px] text-gray-400 font-mono uppercase tracking-wider">
              <span className="flex items-center"><ShieldCheck className="h-4 w-4 text-[#C5A05A] mr-1.5" /> 100% Vegetable-Tanned</span>
              <span className="flex items-center"><ShieldCheck className="h-4 w-4 text-[#C5A05A] mr-1.5" /> Double-Needle Locked</span>
              <span className="flex items-center"><ShieldCheck className="h-4 w-4 text-[#C5A05A] mr-1.5" /> Lifetime Restorable</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
