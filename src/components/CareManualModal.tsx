import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, Volume2, VolumeX, RotateCcw, ChevronRight, Check, Sparkles, 
  Brush, Droplet, Flame, Award, ShieldCheck, X, Compass, Clock, Sliders, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CareManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  videoUrl: string;
  icon: React.ComponentType<any>;
  difficulty: "Beginner" | "Intermediate" | "Master Artisan";
  estimatedTime: string;
  technique: string;
  details: string[];
  proTip: string;
}

const MASTERCLASS_CHAPTERS: Chapter[] = [
  {
    id: "dry_brush",
    title: "1. Dry Horsehair Dusting",
    subtitle: "Clearing Micro-Abrasives",
    duration: "1m 15s",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-craftsman-cutting-leather-41711-large.mp4",
    icon: Brush,
    difficulty: "Beginner",
    estimatedTime: "3-5 mins",
    technique: "Vigorous light sweeps in linear strokes along the leather pore direction. Avoid circular scrubbing which can embed dust.",
    details: [
      "Always begin every restoration session with a dry, stiff horsehair brush.",
      "Dust and grit are microscopic razor blades; applying conditioning cream over dust will grind particles into the grain, causing irreversible fine surface scratches.",
      "Pay special attention to the stitch lines, drop-edges, and structural welt folds where dirt accumulates."
    ],
    proTip: "Flick the brush at the end of each stroke to lift dirt away from the leather rather than pushing it back in."
  },
  {
    id: "organic_cleanse",
    title: "2. pH-Balanced Soap Wash",
    subtitle: "Dissolving Oils & Contaminants",
    duration: "2m 10s",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-of-a-craftsman-working-with-leather-41710-large.mp4",
    icon: Droplet,
    difficulty: "Intermediate",
    estimatedTime: "10-15 mins",
    technique: "Work natural pH-neutral glycerin soap into a rich, dry foam with a barely-damp wool sponge. Dab gently in circular motions.",
    details: [
      "Never apply liquid soaps directly to full-grain leather. Excessive water stretches collagen fibers and causes salt-ring staining.",
      "Apply only the dry, active lather foam. This lifts grease, body oils, and environmental residues without saturating the leather core.",
      "Wipe clean immediately with a dry flannel cloth and allow to air-dry naturally in a cool, shaded environment (never near a heater)."
    ],
    proTip: "If caught in a storm, dry-stuff your leather bag with unprinted tissue paper to maintain its structure and absorb interior moisture."
  },
  {
    id: "lanolin_hydration",
    title: "3. Deep Fiber Conditioning",
    subtitle: "Restoring Tensile Suppleness",
    duration: "1m 45s",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-craftsman-stitching-leather-41713-large.mp4",
    icon: Award,
    difficulty: "Beginner",
    estimatedTime: "10 mins",
    technique: "Apply a pea-sized amount of lanolin-rich cream to a flannel cloth, then massage in a smooth, overlapping circular pattern.",
    details: [
      "Leather is a biological structure that slowly loses its natural lipids and moisture over time.",
      "Our organic balm uses pure sheep lanolin and beeswax. It penetrates the porous dermis, lubricating the fiber bundles to prevent cracks.",
      "Allow the balm to sink deep into the hide for 30 minutes before buffing off the excess with a clean, dry flannel cloth."
    ],
    proTip: "Massage the leather using your clean bare fingers; the natural heat of your hands melts the beeswax molecules, allowing deeper infiltration."
  },
  {
    id: "thermal_repair",
    title: "4. Thermal Pull-Up Restoration",
    subtitle: "Healing Heavy Wax Scuffs",
    duration: "1m 30s",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-craftsman-cutting-leather-41711-large.mp4",
    icon: Flame,
    difficulty: "Intermediate",
    estimatedTime: "2-3 mins",
    technique: "Hover a heat gun or hairdryer at 45°C-50°C approximately 15cm away from scuffs. Watch the wax liquefy and flow flat.",
    details: [
      "Perfect for Saddle-Waxed and Crazy Horse leather items which develop light-colored scratch lines easily.",
      "Friction heat or gentle convection heat melts the solid paraffin and beeswax molecules embedded in the top grain.",
      "The shifting oils flow back into the dry scuffs, restoring a completely uniform, rich, deep chocolate tone in real-time."
    ],
    proTip: "Always test the heat on your own skin first; if it is too hot for your hand, it is too hot for the delicate leather fibers!"
  },
  {
    id: "mirror_glaçage",
    title: "5. Mirror-Shine Glaçage",
    subtitle: "Achieving Imperial Glass Glaze",
    duration: "3m 05s",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-of-a-craftsman-working-with-leather-41710-large.mp4",
    icon: Sparkles,
    difficulty: "Master Artisan",
    estimatedTime: "30-45 mins",
    technique: "Alternate ultra-thin coats of hard Carnauba wax with single drops of ice-cold purified water, buffing with rapid friction strokes.",
    details: [
      "The absolute pinnacle of luxury shoe and accessory care. It creates an optical glaze reflecting light like glass.",
      "The cold water drop acts as a cooling lubricant, forcing the microscopic wax plates to lay perfectly flat rather than clumping.",
      "Apply with high-speed friction buffing. Only apply to rigid areas (toe caps, structured edges) to prevent cracking when the leather flexes."
    ],
    proTip: "Use only premium 100% cotton chamois cloths wrapped extremely tight around your index and middle fingers to avoid cloth wrinkles."
  }
];

export default function CareManualModal({ isOpen, onClose }: CareManualModalProps) {
  const [activeChapterId, setActiveChapterId] = useState<string>("dry_brush");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeChapter = MASTERCLASS_CHAPTERS.find(c => c.id === activeChapterId) || MASTERCLASS_CHAPTERS[0];

  // Sync state when active chapter changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
    setCurrentTime(0);
    setVideoProgress(0);
  }, [activeChapterId]);

  // Adjust playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Handle keypresses (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.error(err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 1;
      setCurrentTime(current);
      setDuration(total);
      setVideoProgress((current / total) * 100);

      // Auto mark chapter as completed if reached 95%
      if (current / total > 0.95 && !completedChapters.includes(activeChapterId)) {
        setCompletedChapters(prev => [...prev, activeChapterId]);
      }
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const pct = parseFloat(e.target.value);
      const targetTime = (pct / 100) * (videoRef.current.duration || 1);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setVideoProgress(pct);
    }
  };

  const selectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!isOpen) return null;

  const ActiveIcon = activeChapter.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        
        {/* Ambient Blurred Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-md"
          id="care-modal-backdrop"
        />

        {/* Cinematic Masterclass Dashboard Container */}
        <motion.div 
          initial={{ scale: 0.96, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="bg-[#111111] border border-[#C5A05A]/40 rounded-xl shadow-2xl relative w-full max-w-6xl h-[92vh] sm:h-[85vh] flex flex-col overflow-hidden text-left z-10 font-sans"
          id="care-modal-box"
        >
          {/* TOP ATELIER NAVBAR */}
          <div className="bg-gradient-to-r from-[#111] via-[#241A14] to-[#111] px-5 py-4 border-b border-[#C5A05A]/25 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/35 flex items-center justify-center">
                <Compass className="h-4.5 w-4.5 text-[#C5A05A]" />
              </div>
              <div>
                <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block">Aurelius Leather Masterclass</span>
                <h3 className="font-serif text-sm sm:text-lg text-white font-medium tracking-tight">
                  Leather Restoration & Preservation Care Manual
                </h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-neutral-900 p-2 rounded-full transition-all border border-transparent hover:border-gray-800"
              title="Close Manual"
              id="close-care-modal-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* MAIN COLUMN WRAPPER (SCROLLABLE & RESPONSIVE) */}
          <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT COLUMN: Premium Video Player & Interactive Controls */}
            <div className="w-full lg:w-3/5 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-900 bg-neutral-950/40">
              
              <div className="space-y-4">
                {/* VIDEO WRAPPER WITH CUSTOM BEZELS */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-800/80 shadow-2xl group flex items-center justify-center">
                  
                  {/* HTML5 Stock Video Element */}
                  <video
                    ref={videoRef}
                    src={activeChapter.videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    autoPlay
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                    playsInline
                    referrerPolicy="no-referrer"
                  />

                  {/* Dark gradient vignette overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Play state big center pulse button (only when paused) */}
                  {!isPlaying && (
                    <button 
                      onClick={togglePlay}
                      className="absolute h-14 w-14 rounded-full bg-[#C5A05A] hover:scale-110 text-black flex items-center justify-center transition-all duration-300 shadow-xl shadow-[#C5A05A]/20"
                    >
                      <Play className="h-6 w-6 fill-black ml-1" />
                    </button>
                  )}

                  {/* Live HUD label */}
                  <div className="absolute top-3 left-3 bg-black/75 border border-[#C5A05A]/20 px-2.5 py-1 rounded text-[8.5px] font-mono uppercase tracking-widest text-[#C5A05A] flex items-center space-x-1.5 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Masterclass Stream • HD 1080p</span>
                  </div>

                  {/* Difficulty label */}
                  <div className="absolute top-3 right-3 bg-black/75 border border-gray-800 px-2.5 py-1 rounded text-[8.5px] font-mono uppercase tracking-wider text-gray-400 backdrop-blur-sm">
                    Skill Level: <span className="text-white font-semibold">{activeChapter.difficulty}</span>
                  </div>

                  {/* CHAPTER CORNER POPUP */}
                  <div className="absolute bottom-12 left-4 right-4 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none md:pointer-events-auto">
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="p-1.5 rounded bg-amber-950/20 text-[#C5A05A] border border-[#C5A05A]/20">
                        <ActiveIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#C5A05A] uppercase block">Now Presenting</span>
                        <span className="text-white font-serif font-medium">{activeChapter.title}</span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono text-gray-400 bg-[#222] px-2 py-0.5 rounded">
                      Est. Care: {activeChapter.estimatedTime}
                    </span>
                  </div>

                  {/* PRESET INTEGRATED VIDEO CONTROLS HUD */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 flex flex-col space-y-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    
                    {/* Scrubbing Timeline */}
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-mono text-gray-400">{formatTime(currentTime)}</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={videoProgress} 
                        onChange={handleScrub}
                        className="flex-grow accent-[#C5A05A] h-1 bg-gray-800 rounded-lg cursor-pointer" 
                      />
                      <span className="text-[10px] font-mono text-gray-400">{formatTime(duration)}</span>
                    </div>

                    {/* Buttons Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={togglePlay}
                          className="text-white hover:text-[#C5A05A] transition-colors p-1"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (videoRef.current) videoRef.current.currentTime = 0;
                          }}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Restart Chapter"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>

                        <div className="h-3.5 w-[1px] bg-white/10" />

                        <button 
                          onClick={toggleMute}
                          className="text-white hover:text-[#C5A05A] transition-colors p-1"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400 relative">
                        {/* Speed controller button */}
                        <button 
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="hover:text-white transition-colors bg-white/5 border border-white/10 rounded px-2 py-0.5"
                        >
                          Speed: {playbackSpeed}x
                        </button>

                        {showSpeedMenu && (
                          <div className="absolute bottom-8 right-0 bg-[#1A1A1A] border border-gray-800 rounded p-1 flex flex-col space-y-1 text-left z-20 w-16">
                            {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                              <button 
                                key={s}
                                onClick={() => {
                                  setPlaybackSpeed(s);
                                  setShowSpeedMenu(false);
                                }}
                                className={`hover:bg-[#C5A05A] hover:text-black rounded px-1.5 py-0.5 text-[9px] transition-colors ${playbackSpeed === s ? "text-[#C5A05A] font-bold" : "text-gray-400"}`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* CURRENT CHAPTER SYNOPSIS BANNER */}
                <div className="bg-[#1A1A1A] border border-gray-800/80 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A05A] font-mono flex items-center space-x-1">
                      <ActiveIcon className="h-3.5 w-3.5" />
                      <span>Artisan Methodology</span>
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">
                      Estimated Duration: {activeChapter.estimatedTime}
                    </span>
                  </div>
                  <h4 className="font-serif text-base sm:text-lg text-white font-medium">
                    {activeChapter.subtitle}
                  </h4>
                  <p className="text-gray-400 text-xs font-light leading-relaxed">
                    {activeChapter.technique}
                  </p>
                </div>
              </div>

              {/* STATS & PROGRESS TRACKER AT BOTTOM */}
              <div className="mt-4 pt-4 border-t border-gray-900/60 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-500 gap-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Aurelius Certified Restoration Curriculum</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Progress:</span>
                  <span className="text-white font-bold">{completedChapters.length} / {MASTERCLASS_CHAPTERS.length} Chapters</span>
                  <div className="w-16 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className="bg-[#C5A05A] h-full transition-all duration-500"
                      style={{ width: `${(completedChapters.length / MASTERCLASS_CHAPTERS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Chapter Guides & Step-by-Step Details */}
            <div className="w-full lg:w-2/5 flex flex-col justify-between bg-neutral-950/20">
              
              {/* UPPER SECTION: LIST OF CHAPTERS */}
              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
                
                {/* Chapters header */}
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Interactive Index</span>
                  <h4 className="font-serif text-sm text-white font-semibold">Masterclass Course Chapters</h4>
                </div>

                {/* Vertical Chapters Selector list */}
                <div className="space-y-2">
                  {MASTERCLASS_CHAPTERS.map((chapter) => {
                    const isSelected = chapter.id === activeChapterId;
                    const isCompleted = completedChapters.includes(chapter.id);
                    const ChapIcon = chapter.icon;

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => selectChapter(chapter.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group
                          ${isSelected 
                            ? "bg-[#1C1613] border-[#C5A05A]/50 shadow-md scale-[1.01]" 
                            : "bg-[#151515]/60 border-transparent hover:bg-[#1A1A1A] hover:border-gray-800"
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Circle Index Icon */}
                          <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-colors
                            ${isSelected 
                              ? "bg-[#C5A05A]/10 border-[#C5A05A] text-[#C5A05A]" 
                              : "bg-neutral-900 border-gray-800 text-gray-500 group-hover:text-[#C5A05A] group-hover:border-gray-700"
                            }
                          `}>
                            {isCompleted ? (
                              <Check className="h-4 w-4 text-[#C5A05A]" />
                            ) : (
                              <ChapIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-serif text-xs text-white font-medium block truncate">
                              {chapter.title.substring(3)}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 truncate block">
                              {chapter.subtitle}
                            </span>
                          </div>
                        </div>

                        {/* Chapter right info */}
                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          <span className="text-[9px] font-mono text-gray-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-gray-800">
                            {chapter.duration}
                          </span>
                          <ChevronRight className={`h-4 w-4 text-gray-600 transition-transform ${isSelected ? "text-[#C5A05A] translate-x-1" : "group-hover:translate-x-0.5"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* CURRENT SELECTION STEP-BY-STEP BREAKDOWN */}
                <div className="pt-4 border-t border-gray-900 space-y-3">
                  <span className="text-[9.5px] uppercase font-bold tracking-widest text-gray-500 font-mono block">
                    Detailed Techniques & Guidelines
                  </span>

                  {/* Bullet steps card */}
                  <div className="space-y-2">
                    {activeChapter.details.map((detail, dIdx) => (
                      <div key={dIdx} className="bg-[#161616] p-3 rounded border border-gray-900 flex items-start space-x-2.5">
                        <div className="h-4 w-4 rounded-full bg-neutral-800 border border-gray-700 text-gray-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {dIdx + 1}
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed font-light">
                          {detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CHAPTER SPECIAL PRO-TIP BOX */}
                  <div className="bg-[#2E241F]/40 border border-[#C5A05A]/20 rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#C5A05A]">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-mono text-[9px] uppercase tracking-wider font-bold">Atelier Secret Formula</span>
                    </div>
                    <p className="text-gray-300 text-[10.5px] leading-relaxed italic font-light">
                      "{activeChapter.proTip}"
                    </p>
                  </div>

                </div>

              </div>

              {/* BOTTOM ATELIER HOTLINE INVITATION */}
              <div className="p-4 sm:p-5 bg-gradient-to-t from-black to-[#131313] border-t border-gray-900 text-center space-y-3 shrink-0">
                <p className="text-[10.5px] text-gray-400 font-light leading-relaxed max-w-sm mx-auto">
                  Having trouble restoring a priceless vintage piece? Our VIP customers receive custom individual restoration consults from our Italian mastercraft atelier.
                </p>
                <div className="flex justify-center space-x-2.5">
                  <a 
                    href="#concierge-line"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Connecting to Aurelius Master Concierge Restoration line... Dialing +1 (800) 555-0199");
                    }}
                    className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white px-4 py-2 uppercase font-mono text-[9px] tracking-widest font-bold rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Call Concierge Line</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
