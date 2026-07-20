import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Sparkles, Send, X, Mic, RefreshCw, AlertCircle, 
  HelpCircle, Hammer, ShieldAlert, Wand2, ChevronRight, BookOpen, Activity 
} from "lucide-react";
import { Product } from "../types";

interface AIConciergeProps {
  currentViewingProduct: Product | null;
  onOpenQuickView: (product: Product) => void;
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const MATERIALS = [
  { id: "crazy_horse", name: "Crazy Horse Leather (Saddle-Waxed)", desc: "Heavy pull-up rustic hide" },
  { id: "calfskin", name: "Aurelius Calfskin (Aniline)", desc: "Super-soft aniline full-grain" },
  { id: "suede", name: "Classic Italian Suede", desc: "Velvety reverse fibrous nap" },
  { id: "other", name: "Other Full-Grain / Smooth Leather", desc: "Classic polished or pebbled skins" }
];

const ISSUES = [
  { id: "scratch", name: "Dry Scratch or Scuff Mark" },
  { id: "stain", name: "Liquid Stain (Water, Wine, Coffee)" },
  { id: "grease", name: "Oil, Ink, or Grease Stain" },
  { id: "dryness", name: "Dehydration, Stiffness & Fading" }
];

export default function AIConcierge({ currentViewingProduct, onOpenQuickView }: AIConciergeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"chat" | "diagnosis">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasNewContext, setHasNewContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Care Diagnosis Tool states
  const [selectedMaterial, setSelectedMaterial] = useState("crazy_horse");
  const [selectedIssue, setSelectedIssue] = useState("scratch");
  const [damageDescription, setDamageDescription] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [currentDiagnosticStep, setCurrentDiagnosticStep] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);

  // Initialize greeting on mount
  useEffect(() => {
    setMessages([
      {
        role: "model",
        content: "Welcome to Aurelius. I am your personal Luxury Concierge. How may I assist you with our hand-crafted leather travel bags, premium footwear, or specialized hide preservation today?"
      }
    ]);
  }, []);

  // Watch for current product viewing changes to trigger a proactive concierge alert
  useEffect(() => {
    if (currentViewingProduct && isOpen) {
      // Proactively message when viewing a product
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          content: `I see you are inspecting the magnificent "${currentViewingProduct.name}". This piece is outstanding! It features ${currentViewingProduct.features[0]}. Would you like me to detail its construction or suggest coordinate items?`
        }
      ]);
    } else if (currentViewingProduct && !isOpen) {
      setHasNewContext(true);
    }
  }, [currentViewingProduct]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, diagnosisResult, isDiagnosing]);

  // Handle message sending
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          contextProduct: currentViewingProduct
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { role: "model", content: data.content }]);
      } else {
        throw new Error(data.error || "Failed to retrieve response");
      }
    } catch (err: any) {
      console.error("AI Concierge error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          content: `I sincerely apologize, but my satellite link to our Florentine workshop is temporarily experiencing high density. Please allow me a moment to re-evaluate: ${err.message || "Connection timeout"}.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action shortcut triggers
  const handleShortcut = (shortcut: string) => {
    let query = "";
    if (shortcut === "care") {
      query = "Can you give me detailed leather care advice for Crazy Horse bags?";
    } else if (shortcut === "gift") {
      query = "Help me find an elite leather gift for an entrepreneur under $400.";
    } else if (shortcut === "travel") {
      query = "Compare the Aurelius Navigator Duffel versus the Overlander Weekend Bag.";
    } else if (shortcut === "laptop") {
      query = "Do you have any laptop bags that comfortably fit a 16-inch Macbook Pro?";
    }
    handleSendMessage(query);
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (hasNewContext) setHasNewContext(false);
  };

  // Simulate voice input
  const startVoiceInput = () => {
    setIsListening(true);
    setInputMessage("Listening...");
    setTimeout(() => {
      setInputMessage("What makes crazy horse leather so special?");
      setIsListening(false);
    }, 2000);
  };

  // Handle Leather Care Diagnosis trigger
  const handleBeginDiagnosis = async () => {
    if (!damageDescription.trim() || isDiagnosing) return;

    setIsDiagnosing(true);
    setDiagnosisResult(null);

    // Dynamic step simulations for luxury artisan feel
    const steps = [
      "Evaluating premium leather grain parameters...",
      "Assessing structural fiber density and pore damage...",
      "Synthesizing customized organic restoration protocol..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentDiagnosticStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await fetch("/api/ai/diagnose-care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: selectedMaterial,
          issueType: selectedIssue,
          description: damageDescription
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDiagnosisResult(data.diagnosis);
      } else {
        throw new Error(data.error || "Failed to formulate advice");
      }
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setDiagnosisResult(`### ⚠️ Atelier Communication Interruption\n\nI sincerely apologize, but our Florence master workshops are experiencing high capacity. Here is a baseline recommendation:\n\n1. **Do not apply water or rub aggressively** on the damaged leather surface.\n2. **Store the item** in a well-ventilated, dry place inside its organic cotton dust bag.\n3. **Try again shortly** once our workshop communication links are clear.`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleResetDiagnosis = () => {
    setDiagnosisResult(null);
    setDamageDescription("");
  };

  // Custom regex-free markdown-to-HTML formatter with beautiful Tailwind custom styles
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;
      
      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="font-serif text-[13px] sm:text-[14px] font-bold text-[#C5A05A] mt-5 mb-2 flex items-center gap-2 border-b border-[#C5A05A]/10 pb-1">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="font-serif text-[14px] sm:text-[15px] font-extrabold text-[#C5A05A] mt-6 mb-3 border-b border-[#C5A05A]/25 pb-1 flex items-center gap-2">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      
      // Unordered List items
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.replace(/^[-*]\s*/, "");
        return (
          <li key={idx} className="ml-4 list-disc pl-1 text-gray-300 leading-relaxed text-xs mb-1.5 font-light">
            {renderInlineBold(content)}
          </li>
        );
      }
      
      // Ordered List items
      if (/^\d+\.\s*/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s*/, "");
        const num = trimmed.match(/^\d+/)?.[0] || "";
        return (
          <div key={idx} className="flex items-start gap-3 my-3.5 bg-[#1C1C1C] p-3 rounded border border-gray-800/65">
            <span className="flex-shrink-0 w-5.5 h-5.5 rounded-full bg-[#C5A05A]/10 border border-[#C5A05A]/35 text-[#C5A05A] font-mono text-[10px] font-bold flex items-center justify-center">
              {num}
            </span>
            <div className="text-gray-300 text-xs leading-relaxed font-light flex-grow">
              {renderInlineBold(content)}
            </div>
          </div>
        );
      }
      
      // Blockquotes / Warnings
      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-2 border-[#C5A05A] pl-3.5 py-2 my-4 italic text-gray-400 bg-neutral-900/50 rounded-r text-[11.5px] leading-relaxed">
            {renderInlineBold(trimmed.replace(/^>\s*/, ""))}
          </blockquote>
        );
      }
      
      // Regular paragraph
      return (
        <p key={idx} className="text-gray-300 leading-relaxed font-light text-xs mb-3 font-sans">
          {renderInlineBold(trimmed)}
        </p>
      );
    });
  };

  const renderInlineBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-[#C5A05A] font-medium">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="ai-concierge-widget" className="fixed bottom-6 right-6 z-40 font-sans text-xs">
      
      {/* Floating Trigger Button */}
      <button
        onClick={toggleWidget}
        className="group relative flex items-center justify-center h-14 w-14 bg-[#111111] hover:bg-[#C5A05A] text-white hover:text-black rounded-full shadow-2xl border border-[#C5A05A]/45 cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-300"
        title="Consult AI Luxury Concierge"
      >
        <Sparkles className="h-6 w-6 animate-[pulse_4s_ease-in-out_infinite]" />
        
        {/* Notification indicator */}
        {hasNewContext && (
          <span className="absolute top-0 right-0 inline-flex rounded-full h-3.5 w-3.5 bg-[#A5673F] border-2 border-white animate-ping" />
        )}
      </button>

      {/* Main chat dialogue panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[92vw] sm:w-[420px] h-[550px] bg-[#1A1A1A] text-[#FCFCFA] rounded shadow-2xl border border-[#C5A05A]/40 flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#C5A05A]/20 bg-[#111111] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="h-4 w-4 text-[#C5A05A]" />
              <div>
                <span className="font-serif text-sm tracking-widest uppercase font-bold text-[#F8F5EF]">Aurelius Concierge</span>
                <span className="block text-[8.5px] text-[#C5A05A] font-mono uppercase tracking-widest mt-0.5">Vetted AI Advisor</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-800 text-center text-[10px] font-mono uppercase tracking-wider bg-[#111111]">
            <button
              onClick={() => setActiveMode("chat")}
              className={`py-3.5 transition-all duration-300 border-b-2 cursor-pointer ${
                activeMode === "chat"
                  ? "border-[#C5A05A] text-[#C5A05A] font-bold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Concierge Chat
            </button>
            <button
              onClick={() => setActiveMode("diagnosis")}
              className={`py-3.5 transition-all duration-300 border-b-2 cursor-pointer ${
                activeMode === "diagnosis"
                  ? "border-[#C5A05A] text-[#C5A05A] font-bold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Care Diagnosis
            </button>
          </div>

          {/* Main content body panel */}
          {activeMode === "chat" ? (
            <>
              {/* Current product Context Bar */}
              {currentViewingProduct && (
                <div className="bg-[#2E241F] text-[#F8F5EF] px-4 py-2 text-[10px] flex items-center justify-between border-b border-[#C5A05A]/20">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-[#C5A05A] font-bold">Context:</span>
                    <span className="truncate">{currentViewingProduct.name} (${currentViewingProduct.price})</span>
                  </div>
                  <button 
                    onClick={() => onOpenQuickView(currentViewingProduct)}
                    className="text-[9px] uppercase font-semibold text-[#C5A05A] hover:underline cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#111111]/90">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div 
                      className={`p-3.5 rounded text-xs leading-relaxed ${msg.role === "user" ? "bg-[#2E241F] text-white rounded-br-none border border-[#C5A05A]/35 shadow-sm" : "bg-[#1A1A1A] text-[#FCFCFA] border border-[#C5A05A]/20 rounded-bl-none shadow-md"}`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <span className="text-[8.5px] text-gray-400 mt-1 font-mono tracking-wider uppercase">
                      {msg.role === "user" ? "Marcus Sterling" : "Aurelius Concierge"}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 bg-[#1A1A1A] border border-gray-800 p-3.5 rounded text-gray-400 w-[65%] shadow-sm">
                    <RefreshCw className="h-3.5 w-3.5 text-[#C5A05A] animate-spin" />
                    <span className="font-mono text-[9.5px] uppercase tracking-widest">Atelier consulting...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Short-cut Quick Queries buttons bar */}
              <div className="px-4 py-2.5 bg-[#1A1A1A] border-t border-gray-800 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-2">
                <button 
                  onClick={() => handleShortcut("care")} 
                  className="bg-[#111111] hover:bg-[#C5A05A] text-white hover:text-black border border-[#C5A05A]/15 text-[9.5px] font-semibold px-3 py-1.5 rounded transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Leather Care</span>
                </button>
                <button 
                  onClick={() => handleShortcut("gift")} 
                  className="bg-[#111111] hover:bg-[#C5A05A] text-white hover:text-black border border-[#C5A05A]/15 text-[9.5px] font-semibold px-3 py-1.5 rounded transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Find a Gift</span>
                </button>
                <button 
                  onClick={() => handleShortcut("travel")} 
                  className="bg-[#111111] hover:bg-[#C5A05A] text-white hover:text-black border border-[#C5A05A]/15 text-[9.5px] font-semibold px-3 py-1.5 rounded transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Bags Compare</span>
                </button>
                <button 
                  onClick={() => handleShortcut("laptop")} 
                  className="bg-[#111111] hover:bg-[#C5A05A] text-white hover:text-black border border-[#C5A05A]/15 text-[9.5px] font-semibold px-3 py-1.5 rounded transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Laptop fit</span>
                </button>
              </div>

              {/* Input tray */}
              <div className="p-3 bg-[#111111] border-t border-gray-800 flex items-center space-x-2">
                <button 
                  onClick={startVoiceInput} 
                  className={`p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-gray-300 transition-colors cursor-pointer ${isListening ? "text-red-400 animate-pulse bg-red-950/20" : ""}`}
                  title="Voice Prompt simulation"
                >
                  <Mic className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  placeholder="Ask about leather care, gifts, fit..."
                  className="flex-grow bg-[#1A1A1A] border border-gray-800 rounded text-white px-3 py-2.5 text-xs outline-none focus:border-[#C5A05A]"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="p-2 bg-[#C5A05A] hover:bg-[#A5673F] disabled:bg-neutral-800 text-black disabled:text-gray-500 rounded transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            /* Leather Care Diagnosis Mode */
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#111111]/90 text-white">
              
              {/* Content Panel Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {diagnosisResult === null && !isDiagnosing ? (
                  /* DIAGNOSIS FORM */
                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-[#1C1C1C] border border-[#C5A05A]/15 p-3.5 rounded space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#C5A05A]">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-serif font-bold text-xs">Artisan Care Laboratory</span>
                      </div>
                      <p className="text-gray-400 text-[11px] leading-relaxed font-light">
                        Describe a scratch, stain, or scuff mark. Our master artisan database will diagnose your specific hide fibers and synthesize a bespoke restoration guide.
                      </p>
                    </div>

                    {/* Material Select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                        1. Leather Material Class
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {MATERIALS.map((mat) => (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => setSelectedMaterial(mat.id)}
                            className={`w-full text-left p-2.5 rounded border transition-all flex justify-between items-center cursor-pointer ${
                              selectedMaterial === mat.id
                                ? "bg-[#2E241F] border-[#C5A05A] text-[#C5A05A]"
                                : "bg-[#1A1A1A]/80 border-gray-800 text-gray-300 hover:border-gray-700"
                            }`}
                          >
                            <div>
                              <span className="block text-[11px] font-medium">{mat.name}</span>
                              <span className="block text-[9px] text-gray-500 font-light mt-0.5">{mat.desc}</span>
                            </div>
                            {selectedMaterial === mat.id && (
                              <ChevronRight className="h-3.5 w-3.5 text-[#C5A05A]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Issue Select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                        2. Damage / Stain Classification
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {ISSUES.map((issue) => (
                          <button
                            key={issue.id}
                            type="button"
                            onClick={() => setSelectedIssue(issue.id)}
                            className={`p-2.5 rounded border text-center transition-all text-[11px] cursor-pointer ${
                              selectedIssue === issue.id
                                ? "bg-[#2E241F] border-[#C5A05A] text-[#C5A05A] font-medium"
                                : "bg-[#1A1A1A]/80 border-gray-800 text-gray-300 hover:border-gray-700"
                            }`}
                          >
                            {issue.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                        3. Incident Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#1A1A1A] border border-gray-800 rounded p-3 text-xs outline-none text-white focus:border-[#C5A05A] resize-none font-light leading-relaxed placeholder:text-gray-600"
                        placeholder="e.g. My keys left a light whitish scratch across the front cover. Or: Spilled a few drops of coffee near the pocket seam, leaving a stain..."
                        value={damageDescription}
                        onChange={(e) => setDamageDescription(e.target.value)}
                      />
                    </div>

                  </div>
                ) : isDiagnosing ? (
                  /* DIAGNOSIS LOADING SCREEN */
                  <div className="h-full flex flex-col items-center justify-center space-y-6 py-12 text-center">
                    
                    {/* Visual Pulse Wave */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-16 w-16 bg-[#C5A05A]/10 rounded-full animate-ping" />
                      <div className="h-16 w-16 bg-[#1A1A1A] border border-[#C5A05A]/40 rounded-full flex items-center justify-center shadow-lg relative">
                        <Activity className="h-7 w-7 text-[#C5A05A] animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-2 max-w-xs">
                      <h4 className="font-serif text-sm font-semibold text-white">Analyzing Fiber Distress</h4>
                      <p className="text-[#C5A05A] font-mono text-[9px] uppercase tracking-widest animate-pulse">
                        {currentDiagnosticStep}
                      </p>
                      <div className="w-40 h-[1.5px] bg-gray-800 mx-auto rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-gradient-to-r from-[#C5A05A] to-[#A5673F] w-full animate-pulse" />
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 font-light max-w-xs leading-relaxed italic px-4">
                      "Atelier care requires strict evaluation of hide fibers. Standard commercial cleaning products can permanently dehydrate aniline organic tallows."
                    </p>

                  </div>
                ) : (
                  /* DIAGNOSIS RESULTS SCREEN */
                  <div className="space-y-4">
                    
                    {/* Diagnostic Header Badge */}
                    <div className="bg-[#2E241F] border border-[#C5A05A]/25 rounded p-3.5 flex items-start gap-3">
                      <Wand2 className="h-5 w-5 text-[#C5A05A] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-mono text-[8px] tracking-widest text-[#C5A05A] font-bold block uppercase">
                          Atelier Restoration Prescription
                        </span>
                        <h4 className="font-serif text-xs font-semibold text-white mt-0.5">
                          Bespoke Formula Ready
                        </h4>
                        <p className="text-gray-400 text-[9.5px] leading-relaxed font-light mt-1">
                          Material: {MATERIALS.find(m => m.id === selectedMaterial)?.name.split(" ")[0]} • {ISSUES.find(i => i.id === selectedIssue)?.name}
                        </p>
                      </div>
                    </div>

                    {/* Markdown Rendered Results */}
                    <div className="space-y-1 text-xs">
                      {diagnosisResult && renderMarkdown(diagnosisResult)}
                    </div>

                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* FOOTER ACTION AREA */}
              <div className="p-3.5 bg-[#111111] border-t border-gray-800 flex items-center justify-between">
                {diagnosisResult === null && !isDiagnosing ? (
                  <button
                    onClick={handleBeginDiagnosis}
                    disabled={!damageDescription.trim()}
                    className="w-full bg-[#C5A05A] hover:bg-[#A5673F] disabled:bg-neutral-800 text-black disabled:text-gray-500 py-3 rounded text-[10px] uppercase font-mono tracking-widest font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Hammer className="h-4 w-4" />
                    <span>Begin Restorations Diagnostic</span>
                  </button>
                ) : !isDiagnosing ? (
                  <button
                    onClick={handleResetDiagnosis}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 border border-gray-800 text-[#C5A05A] py-2.5 rounded text-[10px] uppercase font-mono tracking-widest font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Diagnose Another Spot</span>
                  </button>
                ) : (
                  <div className="w-full text-center py-2.5 text-[9px] font-mono text-gray-500 uppercase tracking-widest animate-pulse">
                    Securing workshop communication...
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
