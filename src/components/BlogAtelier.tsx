import React, { useState } from "react";
import { BookOpen, Calendar, Clock, ChevronRight, Tag, Share2 } from "lucide-react";
import { BlogArticle } from "../types";
import { BLOGS } from "../data";

export default function BlogAtelier() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Lifestyle" | "Craftsmanship" | "Guides">("all");
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  const filteredBlogs = selectedCategory === "all"
    ? BLOGS
    : BLOGS.filter(b => b.category === selectedCategory);

  return (
    <div id="journal-atelier-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
      
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="font-mono text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block mb-2">Heritage Publication</span>
        <h1 className="font-serif text-3xl sm:text-4.5xl font-medium tracking-tight text-white mb-4">THE AURELIUS JOURNAL</h1>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-light">
          An organic chronicle of timeless European leathercraft, modern business fashion directives, and packing philosophies for the global citizen.
        </p>

        {/* Filter chips */}
        <div className="flex justify-center space-x-3 mt-8 text-xs font-semibold">
          {["all", "Lifestyle", "Craftsmanship", "Guides"].map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat as any); setActiveArticle(null); }}
              className={`px-4 py-1.5 rounded-full border transition-all ${selectedCategory === cat ? "bg-[#C5A05A] text-black border-transparent" : "bg-[#1A1A1A] border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white"}`}
            >
              {cat === "all" ? "All Volumes" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Detail overlay if an article is active */}
      {activeArticle ? (
        <div className="max-w-3xl mx-auto bg-[#1A1A1A] border border-gray-800 rounded p-6 sm:p-8 shadow-xl">
          <button 
            onClick={() => setActiveArticle(null)}
            className="text-[#C5A05A] hover:text-[#A5673F] text-xs font-mono uppercase tracking-widest font-bold mb-6 block"
          >
            ← Return to All Volumes
          </button>

          <div className="flex items-center space-x-4 text-xs font-mono text-gray-400 mb-4">
            <span className="bg-[#2E241F] text-[#C5A05A] px-2.5 py-0.5 rounded uppercase font-bold text-[9px]">
              {activeArticle.category}
            </span>
            <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> {activeArticle.date}</span>
            <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> {activeArticle.readTime}</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3.5xl font-medium tracking-tight text-white mb-6 leading-tight">
            {activeArticle.title}
          </h2>

          <img 
            src={activeArticle.image} 
            alt={activeArticle.title} 
            className="w-full aspect-[16/9] object-cover rounded border border-gray-800 mb-8" 
            referrerPolicy="no-referrer"
          />

          <div className="prose max-w-none text-xs sm:text-sm text-gray-300 leading-relaxed space-y-4">
            <p className="font-semibold text-white text-sm sm:text-base italic bg-[#2E241F]/40 p-4 border-l-4 border-[#C5A05A] rounded">
              {activeArticle.excerpt}
            </p>
            <p className="pt-2">{activeArticle.content}</p>
            <p>Our workshop continuously seeks to preserve vegetable tanning, resisting modern synthetic chemicals. By taking the patient road of 24-day oak-bark curation, we yield a robust protein matrix in full-grain cowhides that responds to ambient temperature, unboxing friction, and humidity, growing more flexible rather than degrading with age.</p>
          </div>

          {/* Social share emulator */}
          <div className="flex justify-between items-center border-t border-gray-800 pt-6 mt-10">
            <div className="flex space-x-1.5">
              {activeArticle.tags.map(tag => (
                <span key={tag} className="bg-[#222222] text-gray-300 font-mono text-[9px] px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
            <button 
              onClick={() => alert("Copied private editorial URL to clipboard.")}
              className="text-[#C5A05A] hover:text-[#A5673F] flex items-center text-xs font-mono uppercase tracking-wider"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share Volume
            </button>
          </div>
        </div>
      ) : (
        /* Blog Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredBlogs.map((article) => (
            <div 
              key={article.id} 
              className="group bg-[#1A1A1A] border border-gray-800 rounded overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#111111]">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-3 left-3 bg-[#111]/85 text-[#C5A05A] font-mono text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded">
                    {article.category}
                  </span>
                </div>

                <div className="p-6">
                  {/* Date & Time indicators */}
                  <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-mono mb-3">
                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {article.date}</span>
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {article.readTime}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-lg font-medium text-white group-hover:text-[#C5A05A] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-400 text-xs mt-3 leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Action trigger */}
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => setActiveArticle(article)}
                  className="flex items-center space-x-1.5 text-[#C5A05A] hover:text-[#A5673F] text-xs font-mono uppercase tracking-widest font-semibold transition-colors"
                >
                  <span>Engage Article</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
