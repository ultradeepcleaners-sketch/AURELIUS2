import React from "react";
import { ArrowRight, ShieldCheck, Landmark, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onExploreShop: () => void;
  onExploreCraft: () => void;
}

export default function Hero({ onExploreShop, onExploreCraft }: HeroProps) {
  return (
    <section id="luxury-hero" className="relative h-[90vh] min-h-[600px] w-full bg-[#111111] text-white overflow-hidden flex items-center justify-center">
      {/* Background Image Container with Cinematic Pan & Slow Zoom Effect */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center opacity-45 scale-105 animate-[pulse_8s_ease-in-out_infinite]"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=90&w=1920')",
            filter: "brightness(0.4) contrast(1.15)"
          }}
          referrerPolicy="no-referrer"
        />
        {/* Subtle Dark Radial Gradient to focus attention in the center */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/30 via-[#2F241F]/40 to-[#111111]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#111111] to-transparent" />
      </div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Luxury Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center space-x-2 bg-[#2F241F]/70 border border-[#C5A05A]/45 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#C5A05A]" />
          <span className="font-mono text-[9px] tracking-[0.3em] text-[#F8F5EF] uppercase">HERITAGE LEATHER CRAFT</span>
        </motion.div>

        {/* Cinematic Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-serif text-4xl sm:text-5xl md:text-6.5xl tracking-tight leading-tight max-w-4xl font-medium"
        >
          Crafted for Men Who <br />
          <span className="italic font-normal gold-gradient-text">Never Compromise</span>
        </motion.h1>

        {/* Elegant Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-6 text-sm sm:text-base md:text-lg text-[#F8F5EF]/80 font-sans tracking-wide max-w-2xl font-light leading-relaxed"
        >
          Premium leather companions engineered for boardroom confidence, global journeys, and decades of personal history.
        </motion.p>

        {/* Elegant CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center w-full sm:w-auto"
        >
          <button 
            onClick={onExploreShop}
            className="group flex items-center justify-center bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white font-sans text-xs tracking-widest uppercase font-semibold px-8 py-4 rounded shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Shop Collection
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onExploreCraft}
            className="flex items-center justify-center bg-transparent hover:bg-white/5 text-[#F8F5EF] border border-[#C5A05A]/40 hover:border-[#C5A05A] font-sans text-xs tracking-widest uppercase px-8 py-4 rounded transition-all duration-300"
          >
            Our Atelier Story
          </button>
        </motion.div>

        {/* Subtle trust cues in the footer of the Hero */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 grid grid-cols-3 gap-6 sm:gap-12 text-center text-[10px] sm:text-xs text-gray-400 font-mono tracking-widest uppercase border-t border-white/10 pt-8 w-full max-w-3xl"
        >
          <div className="flex flex-col items-center">
            <ShieldCheck className="h-4.5 w-4.5 text-[#C5A05A] mb-1.5" />
            <span>Lifetime Warranty</span>
          </div>
          <div className="flex flex-col items-center">
            <Landmark className="h-4.5 w-4.5 text-[#C5A05A] mb-1.5" />
            <span>100% Full Grain</span>
          </div>
          <div className="flex flex-col items-center">
            <Sparkles className="h-4.5 w-4.5 text-[#C5A05A] mb-1.5" />
            <span>Bespoke Care Support</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
