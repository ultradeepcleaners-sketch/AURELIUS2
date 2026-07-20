import React, { useState, useEffect } from "react";
import { 
  User, Sparkles, Award, MapPin, ClipboardList, Package, ExternalLink, 
  ShieldCheck, Mail, Check, Clock, Layers, Scissors, Plane, Truck, Home,
  Fingerprint, Download, FileText, Printer, Shield, Eye, QrCode, Plus, Search,
  RefreshCw, Thermometer, Droplets, Activity, Compass
} from "lucide-react";
import { UserAccount, CurrencyCode, formatPrice } from "../types";
import { DEFAULT_USER } from "../data";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

interface Certificate {
  id: string;
  serialNumber: string;
  productName: string;
  category: string;
  leatherType: string;
  artisan: string;
  location: string;
  craftedDate: string;
  registeredDate: string;
  owner: string;
  signature: string;
  tallowRatio: string;
}

export default function AccountDashboard({ currency = "USD" }: { currency?: CurrencyCode }) {
  const [user, setUser] = useState<UserAccount>(DEFAULT_USER);
  const [activeSubTab, setActiveSubTab] = useState<"history" | "active-tracker" | "address" | "vip" | "vault">("history");
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>("AUR-3022");

  // Real-time tracking states
  const [isFetchingTelemetry, setIsFetchingTelemetry] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [lastTelemetryFetchTime, setLastTelemetryFetchTime] = useState<string>("");
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<"log" | "sensor">("log");

  const getLiveShippingLogs = (stageNum: number, date: string): { time: string; location: string; status: string; detail: string; type: string }[] => {
    switch (stageNum) {
      case 0: // Tannery Processing
        return [
          {
            time: "10:30 AM",
            location: "Santa Croce sull'Arno, Italy",
            status: "Tanning Solution Active",
            detail: "pH balanced to 4.2. Pure organic chestnut and mimosa wood extracts introduced into the rotating wood drums.",
            type: "success"
          },
          {
            time: "08:15 AM",
            location: "Tuscan Selection Depot",
            status: "Hide Graded & Certified",
            detail: "Selected Grade-A Full-Grain calfskin hide. Laser scanned for pore density, surface equilibrium, and natural grain integrity.",
            type: "checkpoint"
          },
          {
            time: "07:00 AM",
            location: "Atelier Intake Hub",
            status: "Commission Registered",
            detail: "Client customization specs mapped onto digital atelier pattern board.",
            type: "info"
          }
        ];
      case 1: // Artisan Stitching
        return [
          {
            time: "03:45 PM",
            location: "Florence Atelier, Italy",
            status: "Edge Paint Curing",
            detail: "Third layer of premium protective edge paint applied. Left in dust-free climate chamber under 38% ambient humidity.",
            type: "info"
          },
          {
            time: "11:20 AM",
            location: "Florence Atelier, Italy",
            status: "Saddle-Stitch Reinforcement",
            detail: "Double-needle hand stitching started using heavy-gauge waxed German thread. Seams pull-tested up to 10kg.",
            type: "success"
          },
          {
            time: "08:00 AM",
            location: "Florence Atelier, Italy",
            status: "Pattern Panels Cut",
            detail: "Surgical leather knives used to cut the hand-selected tanned parts. Grain directions aligned for structural durability.",
            type: "checkpoint"
          }
        ];
      case 2: // Quality Inspection
        return [
          {
            time: "02:15 PM",
            location: "Milan Quality Depot, Italy",
            status: "Sealed & Crated",
            detail: "Seam glaze seal verified. Luxury bag wrapped in certified organic cotton dust bag and crated into moisture-tight security chest.",
            type: "checkpoint"
          },
          {
            time: "11:00 AM",
            location: "Milan Quality Depot, Italy",
            status: "Hardware & Lock Tension Calibration",
            detail: "Solid antiqued brass zipper glide test passed. Maximum load-bearing stress verification passed with 15kg load index.",
            type: "success"
          },
          {
            time: "09:30 AM",
            location: "Milan Quality Depot, Italy",
            status: "Crest Hot-Stamp Stamped",
            detail: "The iconic Aurelius Crest of Heritage embossed with high-pressure gold foil into the inner leather pocket panel.",
            type: "info"
          }
        ];
      case 3: // Out for Delivery
        return [
          {
            time: "05:40 PM",
            location: "JFK Transit Terminal, New York",
            status: "White-Glove Courier Dispatch",
            detail: "Transferred into dedicated climate-controlled executive delivery vehicle. Transit casing security locks active.",
            type: "success"
          },
          {
            time: "03:15 PM",
            location: "JFK International Airport",
            status: "Customs Cleared & Inspected",
            detail: "US Customs and Border Protection inspection passed. Cleared for immediate priority land transport.",
            type: "checkpoint"
          },
          {
            time: "10:00 AM",
            location: "Fiumicino Cargo Hub, Rome",
            status: "Overseas Priority Transit (Flight AZ-610)",
            detail: "Loaded into climatized VIP cargo cabin. Internal environment set to 21°C and 40% RH.",
            type: "info"
          }
        ];
      case 4: // Sovereign Handover
        return [
          {
            time: "02:40 PM",
            location: "Sterling Holdings HQ, New York",
            status: "Sovereign Handover Complete",
            detail: "Hand-delivered directly to Marcus Sterling. Certified signature matching complete. Digital ownership certificate signed.",
            type: "success"
          },
          {
            time: "11:15 AM",
            location: "Park Avenue Lobby, New York",
            status: "Security Registry Cleared",
            detail: "Aurelius concierge vehicle parked in VIP lane. Security check-in cleared at ground reception.",
            type: "info"
          },
          {
            time: "09:00 AM",
            location: "Manhattan Depot, New York",
            status: "Final Handover Run Dispatched",
            detail: "Assigned to master courier. Dispatch route optimized via secure, non-stop luxury transport.",
            type: "checkpoint"
          }
        ];
      default:
        return [];
    }
  };

  const triggerTelemetryFetch = () => {
    setIsFetchingTelemetry(true);
    setTelemetryLogs([]);
    
    const steps = [
      "Establishing secure satellite uplink with Florence Atelier central gateway...",
      "Cryptographically handshake-validating luxury cargo seal signature...",
      "Pinging GPS transponders and querying environment metrics...",
      "Decrypting localized supply chain sensor logs..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setTelemetryLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsFetchingTelemetry(false);
          const now = new Date();
          setLastTelemetryFetchTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));
        }, 600);
      }
    }, 400);
  };

  // Automatically trigger a subtle, fast initial fetch on order / stage changes
  useEffect(() => {
    if (selectedTrackingOrderId) {
      setIsFetchingTelemetry(true);
      setTelemetryLogs([]);
      
      const steps = [
        "Initializing direct sat-link to the Tuscan supply gateway...",
        "Validating physical blockchain lock & tamper tag signature...",
        "Querying climatized transport sensors...",
        "Telemetry payload decrypted."
      ];
      
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setTelemetryLogs(prev => [...prev, steps[currentStep]]);
          currentStep++;
        } else {
          clearInterval(interval);
          setIsFetchingTelemetry(false);
          const now = new Date();
          setLastTelemetryFetchTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));
        }
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [selectedTrackingOrderId, activeSubTab]);

  // Persistent simulation state for active orders stages
  const [activeOrderStage, setActiveOrderStage] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("aurelius_active_stages");
    return saved ? JSON.parse(saved) : { "AUR-3022": 1, "AUR-9204": 4, "AUR-8113": 4 };
  });

  useEffect(() => {
    localStorage.setItem("aurelius_active_stages", JSON.stringify(activeOrderStage));
  }, [activeOrderStage]);

  const updateOrderStage = async (orderId: string, stageNum: number) => {
    const nextStages = { ...activeOrderStage, [orderId]: stageNum };
    setActiveOrderStage(nextStages);
    
    // Dynamically align main order history status for consistency across the application
    const updatedHistory = user.orderHistory.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: stageNum === 4 ? "Delivered" : "In Transit"
        };
      }
      return o;
    });

    const nextUser = { ...user, orderHistory: updatedHistory };
    setUser(nextUser);

    // Sync to Firebase Firestore to prevent data loss or drift
    try {
      const userDocRef = doc(db, "users", "marcus_sterling");
      await setDoc(userDocRef, nextUser);
    } catch (err) {
      console.error("Firestore sync interrupted:", err);
    }
  };
  
  // Default fallback Certificates
  const DEFAULT_CERTS: Certificate[] = [
    {
      id: "AUR-CERT-3022-98A",
      serialNumber: "AUR-LH-3022-7319",
      productName: "Leathfocus Men's Cowhide Travel Bag",
      category: "Travel Luggage",
      leatherType: "Vegetable-Tanned Cowhide (Crazy Horse Wax-Infused)",
      artisan: "Master Artisan Giovanni Rossi",
      location: "Florence Atelier, Tuscany, Italy",
      craftedDate: "June 28, 2026",
      registeredDate: "July 11, 2026",
      owner: "Marcus Sterling",
      signature: "G. Rossi",
      tallowRatio: "94.5% High-Retention Organic Tallow"
    },
    {
      id: "AUR-CERT-9204-12C",
      serialNumber: "AUR-ND-9204-0982",
      productName: "Aurelius Navigator Duffel",
      category: "Luxury Travel Gear",
      leatherType: "First-Layer Full-Grain Aniline Calfskin",
      artisan: "Senior Artisan Clara Moretti",
      location: "Florence Atelier, Tuscany, Italy",
      craftedDate: "April 10, 2026",
      registeredDate: "May 14, 2026",
      owner: "Marcus Sterling",
      signature: "C. Moretti",
      tallowRatio: "98.2% Natural Aniline Glaze"
    },
    {
      id: "AUR-CERT-8113-77F",
      serialNumber: "AUR-NS-8113-1120",
      productName: "Aurelius Nomad Leather Sneaker",
      category: "Heritage Footwear",
      leatherType: "Full-Grain Soft Polish Cowhide",
      artisan: "Artisan Matteo Bianchi",
      location: "Florence Atelier, Tuscany, Italy",
      craftedDate: "January 15, 2026",
      registeredDate: "February 02, 2026",
      owner: "Marcus Sterling",
      signature: "M. Bianchi",
      tallowRatio: "92.0% Soft Calf Finish"
    }
  ];

  // Digital Heritage Vault States
  const [certificates, setCertificates] = useState<Certificate[]>(DEFAULT_CERTS);

  const [selectedCertForView, setSelectedCertForView] = useState<Certificate | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"All" | "Bags" | "Footwear">("All");

  // Registration states
  const [regProductName, setRegProductName] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regLeather, setRegLeather] = useState("Vegetable-Tanned Saddle Cowhide");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Sync with Firestore on Mount
  useEffect(() => {
    async function loadFirebaseData() {
      try {
        // Load or initialize user profile
        const userDocRef = doc(db, "users", "marcus_sterling");
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as UserAccount);
        } else {
          await setDoc(userDocRef, DEFAULT_USER);
        }

        // Load or initialize certificates
        const certColRef = collection(db, "certificates");
        const certSnap = await getDocs(certColRef);
        
        if (!certSnap.empty) {
          const loadedCerts: Certificate[] = [];
          certSnap.forEach((doc) => {
            loadedCerts.push(doc.data() as Certificate);
          });
          setCertificates(loadedCerts);
        } else {
          // Empty in Firestore, let's write defaults
          for (const cert of DEFAULT_CERTS) {
            await setDoc(doc(db, "certificates", cert.id), {
              ...cert,
              userId: "marcus_sterling"
            });
          }
        }
      } catch (err) {
        console.error("Error connecting or syncing with Firebase: ", err);
      }
    }
    loadFirebaseData();
  }, []);

  const handleRegisterPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regProductName.trim() || !regSerial.trim()) return;

    setIsRegistering(true);
    
    try {
      const newCertId = `AUR-CERT-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      const newCert: Certificate = {
        id: newCertId,
        serialNumber: regSerial.trim().toUpperCase(),
        productName: regProductName.trim(),
        category: regProductName.toLowerCase().includes("shoe") || regProductName.toLowerCase().includes("sneaker") || regProductName.toLowerCase().includes("boot") ? "Heritage Footwear" : "Travel Luggage",
        leatherType: regLeather,
        artisan: ["Master Artisan Giovanni Rossi", "Senior Artisan Clara Moretti", "Artisan Matteo Bianchi", "Artisan Sofia Lombardi"][Math.floor(Math.random() * 4)],
        location: "Florence Atelier, Tuscany, Italy",
        craftedDate: "Recent Atelier Draft",
        registeredDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        owner: user.name,
        signature: "E. Aurelius",
        tallowRatio: `${(90 + Math.random() * 9).toFixed(1)}% Master Formulation`
      };

      // Save to Firestore
      await setDoc(doc(db, "certificates", newCertId), {
        ...newCert,
        userId: "marcus_sterling"
      });

      // Update local state
      setCertificates(prev => [newCert, ...prev]);
      setRegistrationSuccess(true);
      setRegProductName("");
      setRegSerial("");
      
      // Clear success banner after 4 seconds
      setTimeout(() => setRegistrationSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to register piece to Firestore: ", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDownloadCert = (cert: Certificate) => {
    setDownloadingCertId(cert.id);
    setTimeout(() => {
      const content = `=======================================================
               AURELIUS ATELIER FLORENCE
              CERTIFICATE OF AUTHENTICITY
=======================================================
This document officially certifies the origin, caliber,
and legal registration of the custom leather masterpiece
documented herein.

Owner Registry:      ${cert.owner}
Certificate ID:      ${cert.id}
Serial Stamped ID:   ${cert.serialNumber}

Masterpiece Details:
-------------------------------------------------------
Product Model:       ${cert.productName}
Craft Category:      ${cert.category}
Leather Medium:      ${cert.leatherType}
Natural Glaze Index: ${cert.tallowRatio}

Crafting Heritage:
-------------------------------------------------------
Master Artisan:      ${cert.artisan}
Atelier Location:    ${cert.location}
Date Crafted:        ${cert.craftedDate}
Date Registered:     ${cert.registeredDate}

Verification:
-------------------------------------------------------
This item is hand-burnished and stitched using high-tension
waxed German thread. It carries the signature of our head
master artisan. Aurelius guarantees the lifelong repair
and hydration of this piece at any of our global lounges.

Signed,
${cert.signature}
Master Leather Artisan
Aurelius Atelier, Florence, Italy

Secured ID: [AURELIUS-LEDGER-SECURE-${cert.id}]
=======================================================`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Aurelius_Certificate_${cert.serialNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadingCertId(null);
    }, 1200);
  };


  // VIP point metrics
  const pointsToNextLevel = 1500 - user.points;
  const vipPercent = (user.points / 1500) * 100;

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "layers": return <Layers className="h-4 w-4" />;
      case "artisan": return <Scissors className="h-4 w-4" />;
      case "quality": return <ShieldCheck className="h-4 w-4" />;
      case "plane": return <Plane className="h-4 w-4" />;
      case "warehouse": return <Package className="h-4 w-4" />;
      case "truck": return <Truck className="h-4 w-4" />;
      case "doorstep": return <Home className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTrackingSteps = (orderId: string, status: string, date: string) => {
    const isDelivered = status === "Delivered";
    return [
      {
        title: "Grade-A Hide Selection & Vegetable Tanning",
        location: "Santa Croce sull'Arno, Pisa, Italy",
        description: "Premium full-grain raw cowhide is hand-selected and vegetable-tanned with organic oak bark, chestnut, and mimosa extracts to guarantee a high-caliber finish and lifelong custom patina.",
        timestamp: `${date} • 08:30 AM`,
        status: "completed" as const,
        icon: "layers"
      },
      {
        title: "Master Atelier Handcrafting & Stitching",
        location: "Florence Atelier, Tuscany, Italy",
        description: "Artisans cut patterns with surgical precision, hand-paint raw edges, and double-stitch with heavy-gauge waxed German thread. Custom antiqued solid brass zippers are mounted.",
        timestamp: isDelivered ? "May 15, 2026 • 11:15 AM" : "July 12, 2026 • 11:15 AM",
        status: "completed" as const,
        icon: "artisan"
      },
      {
        title: "24-Point Inspect-to-Wear & Protective Waxing",
        location: "Milan Packaging Depot, Lombardy, Italy",
        description: "Rigorous quality checks verify seam integrity, hardware load-bearing, and pocket symmetry. The bag is treated with our natural organic beeswax formula and placed in a soft linen dust bag.",
        timestamp: isDelivered ? "May 15, 2026 • 04:45 PM" : "July 12, 2026 • 04:45 PM",
        status: "completed" as const,
        icon: "quality"
      },
      {
        title: "Overseas Cargo Logistics Flight",
        location: "Rome Fiumicino (FCO) to New York (JFK)",
        description: "Securely loaded onto cargo aircraft AZ-610. Safely completed pre-cleared US Customs screening at the JFK International Airport cargo terminal.",
        timestamp: isDelivered ? "May 16, 2026 • 09:10 PM" : "July 13, 2026 • 09:10 PM",
        status: "completed" as const,
        icon: "plane"
      },
      {
        title: "Climatized Intake & Sorting",
        location: "Aurelius Center, Long Island City, NY",
        description: "Received at our state-of-the-art climate and humidity-controlled metropolitan distribution hub. Prepared for final executive white-glove route.",
        timestamp: isDelivered ? "May 17, 2026 • 07:15 AM" : "July 14, 2026 • 07:15 AM",
        status: "completed" as const,
        icon: "warehouse"
      },
      {
        title: "Private White-Glove Courier Dispatch",
        location: "Manhattan Delivery Logistics, New York, NY",
        description: isDelivered 
          ? "Bag loaded into luxury delivery vehicle for final downtown route delivery."
          : "Entrusted to our dedicated metropolitan courier service. En route in high-density dust casing for immediate delivery.",
        timestamp: isDelivered ? "May 17, 2026 • 09:30 AM" : "July 14, 2026 • 09:30 AM",
        status: isDelivered ? ("completed" as const) : ("active" as const),
        icon: "truck"
      },
      {
        title: "Sovereign Hand-Delivery to Doorstep",
        location: "Sterling Holdings HQ, Park Avenue, NY",
        description: isDelivered 
          ? "Successfully hand-delivered directly to Marcus Sterling / Executive Suite Reception. Signed by receiver."
          : "Nearing final destination. Our courier is on schedule for secure doorstep drop-off and signature verification.",
        timestamp: isDelivered ? "May 17, 2026 • 02:40 PM" : "Pending Signature • Est. Today by 5:00 PM",
        status: isDelivered ? ("completed" as const) : ("pending" as const),
        icon: "doorstep"
      }
    ];
  };

  return (
    <div id="executive-lounge-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
      
      {/* Top Welcome Card */}
      <div className="bg-[#111] text-white border border-[#C5A05A]/30 rounded p-6 sm:p-8 mb-8 relative overflow-hidden">
        
        {/* Decorative ambient background */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-[#C5A05A]/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-[#2F241F] rounded-full border border-[#C5A05A] flex items-center justify-center text-[#C5A05A]">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-xl sm:text-2.5xl font-medium tracking-tight text-white">{user.name}</h1>
                <span className="bg-[#C5A05A] text-black font-mono text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded font-bold">
                  {user.vipLevel} VIP
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5 flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                {user.email}
              </p>
            </div>
          </div>

          {/* Reward Points Badge */}
          <div className="bg-[#2F241F] border border-[#C5A05A]/45 px-6 py-4 rounded text-center">
            <div className="flex items-center justify-center space-x-1.5 mb-1">
              <Sparkles className="h-4 w-4 text-[#C5A05A] animate-pulse" />
              <span className="text-[10px] uppercase font-semibold text-[#C5A05A] tracking-wider">Atelier Rewards</span>
            </div>
            <span className="font-mono text-2xl font-bold">{user.points} pts</span>
          </div>
        </div>
      </div>

      {/* Main Account Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col space-y-2 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pr-6">
          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center space-x-3 px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded transition-all ${activeSubTab === "history" ? "bg-[#2F241F] text-[#F8F5EF] shadow-md border-l-2 border-[#C5A05A]" : "text-gray-400 hover:bg-neutral-800 hover:text-white"}`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Order Archive</span>
          </button>

          <button
            onClick={() => setActiveSubTab("active-tracker")}
            className={`flex items-center space-x-3 px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded transition-all ${activeSubTab === "active-tracker" ? "bg-[#2F241F] text-[#F8F5EF] shadow-md border-l-2 border-[#C5A05A]" : "text-gray-400 hover:bg-neutral-800 hover:text-white"}`}
          >
            <Clock className="h-4 w-4 text-[#C5A05A]" />
            <span className="flex items-center justify-between w-full">
              <span>Active Order Progress</span>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse ml-2 flex-shrink-0" />
            </span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("address")}
            className={`flex items-center space-x-3 px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded transition-all ${activeSubTab === "address" ? "bg-[#2F241F] text-[#F8F5EF] shadow-md border-l-2 border-[#C5A05A]" : "text-gray-400 hover:bg-neutral-800 hover:text-white"}`}
          >
            <MapPin className="h-4 w-4" />
            <span>Address Book</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("vip")}
            className={`flex items-center space-x-3 px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded transition-all ${activeSubTab === "vip" ? "bg-[#2F241F] text-[#F8F5EF] shadow-md border-l-2 border-[#C5A05A]" : "text-gray-400 hover:bg-neutral-800 hover:text-white"}`}
          >
            <Award className="h-4 w-4" />
            <span>VIP Lounge Benefits</span>
          </button>

          <button
            onClick={() => setActiveSubTab("vault")}
            className={`flex items-center space-x-3 px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded transition-all ${activeSubTab === "vault" ? "bg-[#2F241F] text-[#F8F5EF] shadow-md border-l-2 border-[#C5A05A]" : "text-gray-400 hover:bg-neutral-800 hover:text-white"}`}
          >
            <Fingerprint className="h-4 w-4" />
            <span>Digital Heritage Vault</span>
          </button>
        </div>

        {/* Contents area */}
        <div className="lg:col-span-3">
          
          {/* Order History */}
          {activeSubTab === "history" && (
            <div className="space-y-6">
              
              {/* Live Tracking Timeline */}
              {selectedTrackingOrderId && (() => {
                const currentOrder = user.orderHistory.find(o => o.id === selectedTrackingOrderId);
                if (!currentOrder) return null;
                const steps = getTrackingSteps(currentOrder.id, currentOrder.status, currentOrder.date);
                
                return (
                  <div id="supply-chain-journey" className="bg-[#181818] border border-[#C5A05A]/35 rounded overflow-hidden shadow-2xl mb-8 transition-all">
                    {/* Tracker Header */}
                    <div className="bg-[#111111] px-5 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${currentOrder.status === "In Transit" ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
                          <span className="text-[10px] tracking-widest uppercase text-[#C5A05A] font-bold font-mono">
                            Atelier Courier Route Status: {currentOrder.status}
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-medium text-white mt-1">Supply Chain & Live Logistics Tracker</h3>
                        <p className="text-gray-400 text-[11px] font-mono mt-0.5">
                          Tracking ID: <span className="text-white font-semibold">{currentOrder.trackingNumber || "AUR-ITA-EXPRESS"}</span> • Courier: Aurelius White-Glove VIP
                        </p>
                      </div>

                      {/* Dropdown Selector */}
                      <div className="flex items-center space-x-2.5">
                        <span className="text-gray-400 text-xs">Track order:</span>
                        <select 
                          value={selectedTrackingOrderId}
                          onChange={(e) => setSelectedTrackingOrderId(e.target.value)}
                          className="bg-[#242424] border border-gray-850 hover:border-gray-700 text-white text-xs font-mono rounded px-2.5 py-1.5 focus:border-[#C5A05A] focus:outline-none cursor-pointer"
                        >
                          {user.orderHistory.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.id} — {o.status === "In Transit" ? "In Transit" : "Delivered"}
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={() => setSelectedTrackingOrderId(null)}
                          className="text-gray-500 hover:text-white text-xs font-bold transition-colors pl-1"
                          title="Hide Tracker"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Tracker Content */}
                    <div className="p-6">
                      
                      {/* Transit route badges */}
                      <div className="bg-[#261E1A] border border-[#C5A05A]/15 px-4 py-3 rounded mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#C5A05A] text-black font-mono font-bold text-[9px] px-2 py-0.5 rounded tracking-wider">
                            ORIGIN ATELIER
                          </span>
                          <span className="text-gray-200 font-serif font-medium">Santa Croce sull'Arno, Tuscany, IT</span>
                          <span className="text-[#C5A05A] font-bold">➔</span>
                          <span className="bg-neutral-800 text-gray-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded tracking-wider">
                            DESTINATION
                          </span>
                          <span className="text-gray-200 font-serif font-medium">Manhattan, New York, US</span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Shipment contains: <span className="text-white font-serif italic">{currentOrder.items[0]?.productName}</span>
                        </div>
                      </div>

                      {/* Timeline Steps Grid */}
                      <div className="relative border-l border-gray-800/80 ml-4 md:ml-6 pl-6 md:pl-10 space-y-8 py-2">
                        {steps.map((step, idx) => {
                          const isActive = step.status === "active";
                          const isCompleted = step.status === "completed";
                          const isPending = step.status === "pending";

                          return (
                            <div key={idx} className="relative group">
                              
                              {/* Connector ring */}
                              <div className="absolute -left-[35px] md:-left-[49px] top-1 flex items-center justify-center z-10">
                                {isCompleted && (
                                  <div className="h-7 w-7 rounded-full bg-[#1A1A1A] border-2 border-[#C5A05A] flex items-center justify-center text-[#C5A05A] shadow-md shadow-black/60">
                                    {getStepIcon(step.icon)}
                                  </div>
                                )}
                                {isActive && (
                                  <div className="h-8 w-8 rounded-full bg-[#C5A05A] text-black flex items-center justify-center font-bold shadow-lg shadow-[#C5A05A]/25 animate-pulse scale-105">
                                    {getStepIcon(step.icon)}
                                  </div>
                                )}
                                {isPending && (
                                  <div className="h-7 w-7 rounded-full bg-[#1C1C1C] border border-gray-800 flex items-center justify-center text-gray-600 shadow-sm">
                                    {getStepIcon(step.icon)}
                                  </div>
                                )}
                              </div>

                              {/* Tiny small Completed check mark indicator inside the connector ring */}
                              {isCompleted && (
                                <div className="absolute -left-[23px] md:-left-[37px] top-[1.5px] bg-[#C5A05A] text-black rounded-full p-[1px] z-20 shadow-sm scale-75">
                                  <Check className="h-2 w-2 stroke-[4px]" />
                                </div>
                              )}

                              {/* Timeline detail card */}
                              <div className={`transition-all duration-300 p-4 rounded border ${
                                isActive 
                                  ? "bg-[#2A211B] border-[#C5A05A]/40 shadow-xl" 
                                  : isCompleted 
                                    ? "bg-[#1F1F1F]/45 border-gray-800/60 hover:bg-[#222222]/60" 
                                    : "bg-transparent border-transparent opacity-40"
                              }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                  <div className="flex items-center space-x-2">
                                    <h4 className={`font-serif font-medium text-sm sm:text-base ${
                                      isActive ? "text-[#C5A05A]" : isCompleted ? "text-white" : "text-gray-500"
                                    }`}>
                                      {step.title}
                                    </h4>
                                    {isActive && (
                                      <span className="bg-[#C5A05A]/20 text-[#C5A05A] text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold animate-pulse">
                                        Transit Hub Checkpoint
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[10px] text-gray-400 whitespace-nowrap bg-neutral-900/60 px-2 py-0.5 rounded">
                                    {step.timestamp}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1.5 text-[10px] text-[#C5A05A] font-mono mb-2">
                                  <MapPin className="h-3 w-3" />
                                  <span className="tracking-wide uppercase">{step.location}</span>
                                </div>

                                <p className={`text-xs leading-relaxed ${
                                  isPending ? "text-gray-600 font-light" : "text-gray-300 font-normal"
                                }`}>
                                  {step.description}
                                </p>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                );
              })()}

              <h2 className="font-serif text-lg font-medium tracking-tight mb-4 text-white">Historic Commissions</h2>
              
              {user.orderHistory.map((order) => (
                <div key={order.id} className="bg-[#1A1A1A] border border-gray-800 rounded overflow-hidden shadow-lg">
                  
                  {/* Order Top Summary */}
                  <div className="bg-[#111111]/90 px-5 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap gap-4 font-mono text-gray-400">
                      <div>
                        <span>ORDER ID:</span> <span className="font-bold text-white">{order.id}</span>
                      </div>
                      <div>
                        <span>PLACED:</span> <span className="font-bold text-white">{order.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-white">Total: {formatPrice(order.total, currency)}</span>
                      <span className="bg-green-950/40 text-green-300 border border-green-900/40 px-2 py-0.5 rounded uppercase font-bold text-[9px] tracking-wider">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-5 divide-y divide-gray-800/60 text-xs sm:text-sm">
                    {order.items.map((item, index) => (
                      <div key={index} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-serif font-medium text-white">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 capitalize font-mono">
                            Color shade: {item.color} • Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono text-gray-300">{formatPrice(item.price, currency)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Logistics Tracking section */}
                  {order.trackingNumber && (
                    <div className="bg-[#111111]/40 px-5 py-3 border-t border-gray-800 flex items-center justify-between text-xs font-sans text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <Package className="h-4 w-4 text-[#C5A05A]" />
                        <span>Registered tracking: <span className="font-mono text-white font-semibold">{order.trackingNumber}</span></span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTrackingOrderId(order.id);
                          const el = document.getElementById("supply-chain-journey");
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth" });
                          } else {
                            window.scrollTo({ top: 100, behavior: "smooth" });
                          }
                        }}
                        className="text-[#C5A05A] hover:text-[#A5673F] font-semibold flex items-center text-xs bg-transparent border-none outline-none cursor-pointer"
                      >
                        <span>Track Atelier Supply Chain</span>
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

          {/* Active Order Progress Tracker */}
          {activeSubTab === "active-tracker" && (() => {
            // Find active order or fallback to first order
            const activeOrders = user.orderHistory;
            const currentOrderId = selectedTrackingOrderId || activeOrders[0]?.id || "";
            const currentOrder = activeOrders.find(o => o.id === currentOrderId) || activeOrders[0];
            
            if (!currentOrder) {
              return (
                <div className="text-center py-16 bg-[#161616] border border-gray-850 rounded">
                  <Package className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-serif">No custom commissions or active orders registered under this profile.</p>
                </div>
              );
            }

            const currentStageNum = activeOrderStage[currentOrder.id] !== undefined ? activeOrderStage[currentOrder.id] : 1;

            const stages = [
              {
                title: "Tannery Processing",
                location: "Santa Croce sull'Arno, Tuscany, Italy",
                description: "Premium full-grain raw hides are hand-selected and vegetable-tanned with organic oak bark and chestnut extracts, building a deep structural fiber density and a rich natural base.",
                icon: "layers",
                badge: "Lot #28B - Tuscany",
                log: "Vegetable-tan oil conditioning completed. Natural fiber density approved.",
                artisanQuote: "Master Artisan Giovanni Rossi: 'The raw hide selected for your commission exhibits pristine grain patterns. It has absorbed the organic wax formula with absolute equilibrium.'"
              },
              {
                title: "Artisan Stitching",
                location: "Florence Atelier, Tuscany, Italy",
                description: "Master leathercrafters meticulously cut pattern sheets, burnish raw edges by hand, and double-stitch panels using heavy-gauge waxed German thread.",
                icon: "artisan",
                badge: "Florence Workshop",
                log: "Saddle-stitch reinforcement applied. Edge-painting in third cycle.",
                artisanQuote: "Artisan Matteo Bianchi: 'Edge-painting requires slow precision. Every stroke ensures that your piece resists environmental moisture while developing a flawless structural contour.'"
              },
              {
                title: "Quality Inspection",
                location: "Milan Logistics Depot, Lombardy, Italy",
                description: "Rigorous 24-point inspect-to-wear check validating hardware load endurance, zipper glide resistance, seam tension, and symmetric wax glaze index.",
                icon: "quality",
                badge: "Milan Quality Hub",
                log: "Seam stress test approved. Natural beeswax seal protective coating applied.",
                artisanQuote: "Quality Lead Clara Moretti: 'No details are overlooked. Under 10x magnification, every stitch line shows perfect tension. Your piece is stamped with the Aurelius Crest of authenticity.'"
              },
              {
                title: "Out for Delivery",
                location: "Metropolitan White-Glove Transit",
                description: "Transferred securely to a climate-controlled courier vehicle. En route via priority air transport and dedicated metropolitan courier route.",
                icon: "truck",
                badge: "White-Glove Courier",
                log: "Sealed cargo container loaded. Airport clearance approved.",
                artisanQuote: "Logistics Lead Sofia Lombardi: 'Your bag is cocooned inside our custom linen dust bag and secure hardcase. Our white-glove courier is on schedule for immediate direct transit.'"
              },
              {
                title: "Sovereign Handover",
                location: "Park Avenue, New York, NY",
                description: "Hand-delivered directly to the registered client. Verification signature received, and the ownership certificate is securely logged in your Digital Heritage Vault.",
                icon: "doorstep",
                badge: "Registered Delivery",
                log: "Signature received. Ownership ledger officially certified.",
                artisanQuote: "Aurelius Concierge: 'The handover is complete. Your masterpiece has embarked on its lifetime patina journey. It is our honor to serve you.'"
              }
            ];

            const currentStageObj = stages[currentStageNum];

            return (
              <div className="space-y-8 animate-fade-in">
                
                {/* Section Header */}
                <div className="bg-[#181818] border border-[#C5A05A]/35 rounded p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#C5A05A]/5 to-transparent pointer-events-none" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-[9px] text-[#C5A05A] tracking-[0.3em] uppercase block mb-1">
                        Active Commission Supply Chain
                      </span>
                      <h2 className="font-serif text-2xl font-medium text-white">Active Order Progress</h2>
                      <p className="text-gray-400 text-xs mt-1 font-light">
                        Track the handcrafting process, tanning steps, and logistics route of your bespoke leather masterpieces.
                      </p>
                    </div>

                    {/* Order Selection dropdown */}
                    <div className="flex items-center space-x-2 bg-[#222] border border-gray-800 rounded px-3 py-1.5 self-stretch sm:self-auto justify-between">
                      <span className="text-xs text-gray-400 font-mono">Commission:</span>
                      <select
                        value={currentOrder.id}
                        onChange={(e) => setSelectedTrackingOrderId(e.target.value)}
                        className="bg-transparent text-xs text-white font-mono focus:outline-none cursor-pointer border-none pl-1 font-semibold text-[#C5A05A]"
                      >
                        {user.orderHistory.map(o => (
                          <option key={o.id} value={o.id} className="bg-[#111] text-white">
                            {o.id} ({o.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main Order card */}
                <div className="bg-[#141414] border border-gray-850 rounded p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-[#1A1A1A] border border-[#C5A05A]/25 rounded flex items-center justify-center text-[#C5A05A] p-2 flex-shrink-0">
                      <Package className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500">ID: <span className="text-white font-semibold">{currentOrder.id}</span></span>
                        <span className="bg-[#261E1A] text-[#C5A05A] font-mono font-bold text-[8px] px-2 py-0.5 rounded tracking-wider uppercase">
                          {currentOrder.status}
                        </span>
                      </div>
                      <h3 className="font-serif text-base font-semibold text-white mt-1">
                        {currentOrder.items[0]?.productName || "Aurelius Masterpiece"}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        Placed: <span className="text-gray-300">{currentOrder.date}</span> • Color Shade: <span className="text-gray-300">{currentOrder.items[0]?.color || "Default"}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end font-mono">
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Commission Cost</span>
                    <span className="text-xl font-bold text-white mt-0.5">{formatPrice(currentOrder.total, currency)}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Tracking Number: {currentOrder.trackingNumber || "AUR-ITA-EXPRESS"}</span>
                  </div>
                </div>

                {/* Progress Visual Tracker Stepper */}
                <div className="bg-[#181818] border border-gray-850 rounded p-6 sm:p-8">
                  
                  {/* Stepper Pipeline */}
                  <div className="relative">
                    
                    {/* Background Progress Bar Line */}
                    <div className="hidden md:block absolute top-7 left-[8%] right-[8%] h-0.5 bg-neutral-800 z-0">
                      <div 
                        className="bg-gradient-to-r from-[#A5673F] to-[#C5A05A] h-full transition-all duration-700"
                        style={{ width: `${(currentStageNum / (stages.length - 1)) * 100}%` }}
                      />
                    </div>

                    {/* Stepper Steps (Horizontal on desktop, vertical on mobile) */}
                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:gap-4">
                      {stages.map((stg, index) => {
                        const isCompleted = index < currentStageNum;
                        const isActive = index === currentStageNum;
                        
                        return (
                          <div key={index} className="flex md:flex-col items-center md:text-center md:flex-1 group">
                            
                            {/* Step Node */}
                            <div className="relative flex-shrink-0 mb-0 md:mb-3 mr-4 md:mr-0">
                              {/* Glowing Ring for Active */}
                              {isActive && (
                                <div className="absolute inset-0 rounded-full bg-[#C5A05A]/25 animate-ping scale-110" />
                              )}
                              
                              <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                                isCompleted 
                                  ? "bg-[#2F241F] border-[#C5A05A] text-[#C5A05A] shadow-md shadow-black"
                                  : isActive
                                    ? "bg-[#C5A05A] border-[#C5A05A] text-black shadow-lg shadow-[#C5A05A]/25 scale-105"
                                    : "bg-[#161616] border-gray-850 text-gray-600"
                              }`}>
                                {isCompleted ? (
                                  <Check className="h-6 w-6 stroke-[3px]" />
                                ) : (
                                  getStepIcon(stg.icon)
                                )}
                              </div>

                              {/* Tiny Step Number */}
                              <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                                isCompleted 
                                  ? "bg-[#C5A05A] text-black"
                                  : isActive
                                    ? "bg-[#2F241F] text-[#C5A05A] border border-[#C5A05A]"
                                    : "bg-neutral-800 text-gray-500"
                              }`}>
                                {index + 1}
                              </div>
                            </div>

                            {/* Mobile connection vertical line */}
                            {index < stages.length - 1 && (
                              <div className="md:hidden absolute left-[26px] top-[56px] w-0.5 h-10 bg-neutral-800 -z-10">
                                <div 
                                  className="bg-gradient-to-b from-[#A5673F] to-[#C5A05A] w-full transition-all duration-700"
                                  style={{ height: isCompleted ? "100%" : "0%" }}
                                />
                              </div>
                            )}

                            {/* Step Description text */}
                            <div className="min-w-0 text-left md:text-center">
                              <h4 className={`font-serif text-sm font-semibold transition-colors duration-300 ${
                                isActive ? "text-[#C5A05A]" : isCompleted ? "text-white" : "text-gray-500"
                              }`}>
                                {stg.title}
                              </h4>
                              <p className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${
                                isActive ? "text-amber-500" : isCompleted ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {stg.location.split(",")[0]}
                              </p>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

                {/* Grid layout for Spotlight Details & Client Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Stage Detail Spotlight (col-span 7) */}
                  <div className="lg:col-span-7 bg-[#181818] border border-gray-850 rounded p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-850 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Atelier Stage Spotlight</span>
                      </div>
                      <span className="font-mono text-[9px] uppercase bg-[#C5A05A]/10 text-[#C5A05A] px-2 py-0.5 rounded border border-[#C5A05A]/25">
                        {currentStageObj.badge}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-serif text-lg font-medium text-white">{currentStageObj.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-mono mt-1">
                          <MapPin className="h-3.5 w-3.5 text-[#C5A05A]" />
                          <span>{currentStageObj.location}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-light">
                        {currentStageObj.description}
                      </p>

                      {/* Log output */}
                      <div className="bg-[#1F1F1F]/60 border border-gray-800 rounded p-3.5 font-mono text-[11px] leading-relaxed">
                        <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Atelier Ledger Registry Log</span>
                        <span className="text-[#C5A05A] font-bold">➔</span> <span className="text-gray-200">{currentStageObj.log}</span>
                      </div>

                      {/* Artisan quote */}
                      <div className="bg-[#241E1A] border border-[#C5A05A]/20 rounded p-4 relative overflow-hidden">
                        <div className="absolute -right-2 -bottom-4 text-7xl font-serif text-[#C5A05A]/5 select-none leading-none">“</div>
                        <p className="text-xs text-[#E6DFD5] italic leading-relaxed font-serif relative z-10">
                          {currentStageObj.artisanQuote}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Stage Simulator Controller (col-span 5) */}
                  <div className="lg:col-span-5 bg-[#181818] border border-gray-850 rounded p-6 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
                        <Sparkles className="h-4.5 w-4.5 text-[#C5A05A]" />
                        <h3 className="font-serif text-sm font-semibold text-white">Client Privilege Controls</h3>
                      </div>
                      
                      <p className="text-xs text-gray-400 leading-relaxed font-light">
                        Aurelius provides our distinguished clientele with complete visibility. Use the simulation console below to cycle between handcraft stages and observe the dynamic tracking system.
                      </p>

                      {/* Quick stage selection buttons */}
                      <div className="space-y-2 pt-2 text-[10px] font-mono">
                        <span className="text-gray-500 uppercase tracking-wider block mb-1">Jump to Workshop Stage:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {stages.map((stg, i) => (
                            <button
                              key={i}
                              onClick={() => updateOrderStage(currentOrder.id, i)}
                              className={`px-3 py-2 rounded text-left border transition-all truncate cursor-pointer ${
                                i === currentStageNum
                                  ? "bg-[#C5A05A] border-[#C5A05A] text-black font-bold"
                                  : "bg-[#1E1E1E] border-gray-850 text-gray-400 hover:border-gray-600 hover:text-white"
                              }`}
                            >
                              {i + 1}. {stg.title.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step navigation buttons */}
                    <div className="space-y-3 border-t border-gray-850 pt-4 mt-2">
                      <div className="flex gap-2.5">
                        <button
                          disabled={currentStageNum === 0}
                          onClick={() => updateOrderStage(currentOrder.id, currentStageNum - 1)}
                          className="flex-1 bg-neutral-900 border border-gray-800 hover:border-gray-600 disabled:opacity-30 disabled:pointer-events-none text-gray-300 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                        >
                          ◀ Prev Stage
                        </button>
                        <button
                          disabled={currentStageNum === stages.length - 1}
                          onClick={() => updateOrderStage(currentOrder.id, currentStageNum + 1)}
                          className="flex-1 bg-gradient-to-r from-[#A5673F] to-[#C5A05A] text-white disabled:opacity-30 disabled:pointer-events-none py-2 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Next Stage ▶
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-500 italic font-light text-center leading-relaxed">
                        "Your masterworks take time. Every phase is hand-validated by our Florence atelier stewards."
                      </p>
                    </div>

                  </div>

                </div>

                {/* Real-time Shipping Logs & GPS Telemetry Timeline */}
                <div className="bg-[#181818] border border-gray-850 rounded p-6 space-y-6">
                  
                  {/* Panel Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-850 pb-5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-[#C5A05A] animate-pulse" />
                        <span className="font-mono text-[9px] tracking-[0.3em] text-[#C5A05A] uppercase block">
                          Real-Time Courier Telemetry
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-medium text-white mt-1">Live Shipment Tracking & Sensorial Logs</h3>
                      <p className="text-xs text-gray-400 mt-1 font-light">
                        Real-time GPS transponder ping and environmental telemetry of your active commission cargo container.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between font-mono">
                      {lastTelemetryFetchTime && (
                        <span className="text-[10px] text-gray-500">
                          Last sync: {lastTelemetryFetchTime}
                        </span>
                      )}
                      <button
                        onClick={triggerTelemetryFetch}
                        disabled={isFetchingTelemetry}
                        className="bg-[#222] hover:bg-[#2F241F] border border-[#C5A05A]/35 hover:border-[#C5A05A] text-[#C5A05A] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetchingTelemetry ? "animate-spin" : ""}`} />
                        <span>{isFetchingTelemetry ? "Retrieving Logs..." : "Refresh Satellite Link"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Satellite Handshake Logs (visible during mock fetch) */}
                  {isFetchingTelemetry && (
                    <div className="bg-[#111111] border border-[#C5A05A]/25 rounded p-4 font-mono text-[11px] text-gray-400 space-y-1.5 animate-pulse">
                      <div className="text-amber-500 font-bold mb-1">➔ INITIATING SECURE ENCRYPTED LOG HANDSHAKE</div>
                      {telemetryLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[#C5A05A]">●</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isFetchingTelemetry && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      {/* Left: Dynamic Timeline Component (col-span 7) */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif text-xs font-semibold text-[#C5A05A] uppercase tracking-wider">
                            Logistics Checkpoints Timeline
                          </h4>
                          <span className="text-[9px] font-mono text-gray-500 uppercase bg-neutral-900 px-2 py-0.5 rounded">
                            Stage {currentStageNum + 1} feed
                          </span>
                        </div>

                        <div className="relative border-l border-gray-850 ml-3 pl-6 space-y-6">
                          {getLiveShippingLogs(currentStageNum, currentOrder.date).map((log, idx) => (
                            <div key={idx} className="relative group">
                              {/* Timeline indicator circle */}
                              <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-[#111] border-2 border-[#C5A05A] flex items-center justify-center">
                                <span className={`h-1.5 w-1.5 rounded-full ${log.type === "success" ? "bg-green-500" : log.type === "checkpoint" ? "bg-[#C5A05A]" : "bg-blue-400"}`} />
                              </span>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between font-serif">
                                  <span className="text-xs font-semibold text-white">
                                    {log.status}
                                  </span>
                                  <span className="font-mono text-[9px] text-gray-500">
                                    {log.time}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 font-mono text-[9px] text-[#C5A05A] uppercase">
                                  <MapPin className="h-3 w-3" />
                                  <span>{log.location}</span>
                                </div>
                                <p className="text-[11px] text-gray-400 font-light leading-relaxed">
                                  {log.detail}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Environmental & GPS Dial (col-span 5) */}
                      <div className="lg:col-span-5 bg-[#141414] border border-gray-850 rounded p-5 space-y-5">
                        <div className="border-b border-gray-850 pb-3 flex items-center justify-between">
                          <h4 className="font-serif text-xs font-semibold text-white uppercase tracking-wider">
                            Container Safe-Box Telemetry
                          </h4>
                          <span className="text-[9px] font-mono text-green-400 bg-green-950/30 px-1.5 py-0.5 rounded border border-green-900/30 font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                            SECURE
                          </span>
                        </div>

                        {/* Environmental metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Thermometer */}
                          <div className="bg-[#1A1A1A] border border-gray-800 p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono text-gray-400 uppercase">Climatized Temp</span>
                              <Thermometer className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="font-mono text-sm font-bold text-white">
                              {currentStageNum === 4 ? "Room Temp" : "21.4 °C"}
                            </div>
                            <div className="w-full bg-neutral-800 h-1 rounded overflow-hidden mt-2">
                              <div className="bg-red-400 h-full w-[65%]" />
                            </div>
                            <span className="text-[8px] font-mono text-gray-500 block mt-1">Preservation Threshold OK</span>
                          </div>

                          {/* Humidity */}
                          <div className="bg-[#1A1A1A] border border-gray-800 p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono text-gray-400 uppercase">Ambient RH</span>
                              <Droplets className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="font-mono text-sm font-bold text-white">
                              {currentStageNum === 4 ? "Ambient" : "44.5 %"}
                            </div>
                            <div className="w-full bg-neutral-800 h-1 rounded overflow-hidden mt-2">
                              <div className="bg-blue-400 h-full w-[45%]" />
                            </div>
                            <span className="text-[8px] font-mono text-gray-500 block mt-1">Leather-Safe Index</span>
                          </div>
                        </div>

                        {/* GPS Sensor coordinates */}
                        <div className="bg-[#1A1A1A] border border-gray-800 rounded p-4 font-mono text-[10px] space-y-2.5">
                          <div className="flex items-center justify-between text-[9px] text-gray-500 uppercase">
                            <span>GPS Satellite Ping</span>
                            <Compass className="h-3.5 w-3.5 text-[#C5A05A] animate-spin animate-duration-2000" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Current Lat:</span>
                              <span className="text-white font-semibold">
                                {currentStageNum === 0 ? "43.7696° N" : currentStageNum === 1 ? "43.7696° N" : currentStageNum === 2 ? "45.4642° N" : currentStageNum === 3 ? "40.7128° N" : "40.7128° N"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Current Lon:</span>
                              <span className="text-white font-semibold">
                                {currentStageNum === 0 ? "11.2558° E" : currentStageNum === 1 ? "11.2558° E" : currentStageNum === 2 ? "9.1900° E" : currentStageNum === 3 ? "74.0060° W" : "74.0060° W"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Altimetry:</span>
                              <span className="text-white font-semibold">
                                {currentStageNum === 3 ? "11,280 meters (FCO-JFK)" : "Sea Level"}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-850 pt-2 flex items-center justify-between text-[8px] text-gray-500 uppercase">
                            <span>Security Hardware Seal:</span>
                            <span className="text-green-400 font-bold">LOCKED & VERIFIED</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            );
          })()}

          {/* Address book */}
          {activeSubTab === "address" && (
            <div>
              <h2 className="font-serif text-lg font-medium tracking-tight mb-4 text-white">Corporate Registry</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                
                <div className="border border-[#C5A05A]/35 bg-[#222222]/40 p-5 rounded relative">
                  <div className="absolute top-4 right-4 bg-[#C5A05A] text-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded font-bold font-mono">
                    Primary Office
                  </div>
                  <p className="font-serif font-semibold text-white mb-2">Sterling Holdings HQ</p>
                  <p className="text-gray-300 leading-relaxed">
                    120 Park Avenue, Floor 44<br />
                    Manhattan, NY 10017<br />
                    United States
                  </p>
                  <p className="text-gray-500 mt-3 font-mono text-[10px]">+1 (212) 555-0182</p>
                </div>

                <div className="border border-gray-800 bg-[#1A1A1A] p-5 rounded hover:border-gray-700 transition-colors">
                  <p className="font-serif font-semibold text-white mb-2">Hamptons Estate</p>
                  <p className="text-gray-300 leading-relaxed">
                    42 Meadow Lane<br />
                    Southampton, NY 11968<br />
                    United States
                  </p>
                  <p className="text-gray-500 mt-3 font-mono text-[10px]">+1 (631) 555-0140</p>
                </div>

              </div>
            </div>
          )}

          {/* VIP Benefits */}
          {activeSubTab === "vip" && (
            <div className="space-y-6">
              <h2 className="font-serif text-lg font-medium tracking-tight mb-4 text-white">Aurelius VIP Lounge</h2>
              
              {/* Point bar progress */}
              <div className="bg-[#2E241F] text-white p-6 rounded border border-[#C5A05A]/40 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-serif font-semibold text-base text-[#F8F5EF]">Platinum Membership Status</span>
                  <span className="font-mono text-xs font-bold text-[#C5A05A]">{user.points} / 1500 pts</span>
                </div>
                
                {/* Bar */}
                <div className="w-full bg-white/10 h-2.5 rounded overflow-hidden my-3">
                  <div 
                    className="bg-gradient-to-r from-[#A5673F] to-[#C5A05A] h-full rounded"
                    style={{ width: `${vipPercent}%` }}
                  />
                </div>

                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Earn another <span className="font-mono font-bold text-[#C5A05A]">{pointsToNextLevel}</span> points to unlock <span className="font-bold text-[#C5A05A]">"Aurelius Elite"</span> tier status (giving you complimentary annual care kit deliveries and invitation-only product previews).
                </p>
              </div>

              {/* Verified Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div className="p-4 border border-gray-800 bg-[#1A1A1A] rounded text-center">
                  <ShieldCheck className="h-6 w-6 text-[#C5A05A] mx-auto mb-2" />
                  <p className="font-semibold text-white mb-1">Lifetime Restoration</p>
                  <p className="text-gray-400 text-[10.5px]">Unconditional repairs and hydration buffing at our regional ateliers.</p>
                </div>
                <div className="p-4 border border-gray-800 bg-[#1A1A1A] rounded text-center">
                  <Package className="h-6 w-6 text-[#C5A05A] mx-auto mb-2" />
                  <p className="font-semibold text-white mb-1">Priority Allocation</p>
                  <p className="text-gray-400 text-[10.5px]">Guaranteed access to extremely low-run Crazy Horse leather luggage drafts.</p>
                </div>
                <div className="p-4 border border-gray-800 bg-[#1A1A1A] rounded text-center">
                  <Sparkles className="h-6 w-6 text-[#C5A05A] mx-auto mb-2" />
                  <p className="font-semibold text-white mb-1">Concierge Line</p>
                  <p className="text-gray-400 text-[10.5px]">Direct priority routing to senior leather consultants in Milan.</p>
                </div>
              </div>

            </div>
          )}

          {/* Digital Heritage Vault */}
          {activeSubTab === "vault" && (() => {
            const filteredCerts = certificates.filter(cert => {
              const matchesSearch = cert.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    cert.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    cert.id.toLowerCase().includes(searchQuery.toLowerCase());
              
              const matchesCat = filterCategory === "All" || 
                                 (filterCategory === "Bags" && cert.category.toLowerCase().includes("luggage")) ||
                                 (filterCategory === "Footwear" && cert.category.toLowerCase().includes("footwear"));
                                 
              return matchesSearch && matchesCat;
            });

            return (
              <div className="space-y-6">
                
                {/* Vault Banner */}
                <div className="bg-[#181818] border border-[#C5A05A]/35 rounded p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#C5A05A]/5 to-transparent pointer-events-none" />
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#2F241F] rounded-full border border-[#C5A05A]/50 text-[#C5A05A] flex-shrink-0">
                      <Fingerprint className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-[#C5A05A] tracking-[0.3em] uppercase block mb-1">
                        Secure Cryptographic Ownership Ledger
                      </span>
                      <h2 className="font-serif text-xl font-medium text-white mb-2">Digital Heritage Vault</h2>
                      <p className="text-gray-400 text-xs leading-relaxed max-w-2xl font-light">
                        A dynamic archive of your authenticated Aurelius masterpieces. Each handcrafted bag and pair of heritage footwear is embedded with a registered serial number and cataloged at our workshop in Santa Croce sull'Arno, Italy. View, print, or download cryptographically verified Certificates of Authenticity below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filters and Registration Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Registered Certificates (col-span 8) */}
                  <div className="lg:col-span-8 space-y-4">
                    
                    {/* Toolbar search & filters */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161616] border border-gray-850 p-3 rounded text-xs">
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search serial, model name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#202020] border border-gray-800 rounded pl-9 pr-3 py-1.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#C5A05A]"
                        />
                      </div>
                      
                      <div className="flex gap-1.5 w-full sm:w-auto font-mono text-[9px] uppercase tracking-wider">
                        {(["All", "Bags", "Footwear"] as const).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                              filterCategory === cat 
                                ? "bg-[#C5A05A] border-[#C5A05A] text-black font-semibold"
                                : "bg-[#1C1C1C] border-gray-800 text-gray-400 hover:text-white"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cert List */}
                    <div className="space-y-4">
                      {filteredCerts.length === 0 ? (
                        <div className="text-center py-12 border border-gray-850 bg-[#141414] rounded text-xs text-gray-500">
                          No registered certificates found matching the search criteria.
                        </div>
                      ) : (
                        filteredCerts.map(cert => {
                          const isDownloading = downloadingCertId === cert.id;
                          return (
                            <div 
                              key={cert.id} 
                              className="bg-[#1A1A1A] border border-gray-850 hover:border-[#C5A05A]/30 rounded p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300"
                            >
                              <div className="flex items-start gap-3.5 min-w-0">
                                <div className="p-3 bg-[#242424] border border-[#C5A05A]/20 rounded text-[#C5A05A] flex-shrink-0">
                                  <QrCode className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono text-[8px] text-[#C5A05A] uppercase tracking-widest bg-[#C5A05A]/10 px-1.5 py-0.5 rounded border border-[#C5A05A]/20">
                                      {cert.category}
                                    </span>
                                    <span className="font-mono text-[9px] text-gray-500">
                                      ID: {cert.id}
                                    </span>
                                  </div>
                                  <h4 className="font-serif text-sm font-semibold text-white truncate">
                                    {cert.productName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[10.5px] text-gray-400 font-mono mt-1">
                                    <span>Serial:</span>
                                    <span className="text-white font-medium bg-[#222] px-1.5 py-0.25 rounded border border-gray-800">{cert.serialNumber}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions buttons */}
                              <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-gray-850 pt-3 sm:pt-0">
                                <button
                                  onClick={() => setSelectedCertForView(cert)}
                                  className="flex-1 sm:flex-initial bg-neutral-900 border border-gray-800 hover:border-gray-600 text-gray-300 px-3.5 py-2 rounded text-[10.5px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View Certificate</span>
                                </button>
                                
                                <button
                                  onClick={() => handleDownloadCert(cert)}
                                  disabled={isDownloading}
                                  className="flex-1 sm:flex-initial bg-[#C5A05A] hover:bg-[#A5673F] disabled:bg-neutral-800 text-black disabled:text-gray-500 px-3.5 py-2 rounded text-[10.5px] uppercase font-mono tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                  title="Download certificate txt file"
                                >
                                  {isDownloading ? (
                                    <>
                                      <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                      <span className="text-[9px]">Securing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-3.5 w-3.5" />
                                      <span>Download</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>

                  {/* Right Column: Register New Piece Form (col-span 4) */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-[#181818] border border-gray-850 rounded p-5 relative overflow-hidden shadow-lg">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-4">
                        <Plus className="h-4.5 w-4.5 text-[#C5A05A]" />
                        <h3 className="font-serif text-sm font-semibold text-white">Register Stamped Piece</h3>
                      </div>

                      {registrationSuccess && (
                        <div className="bg-green-950/40 border border-green-900/50 rounded p-3 text-green-300 text-[11px] leading-relaxed mb-4 flex items-start gap-2 animate-fade-in">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold block">Secured in Registry</span>
                            New Certificate of Authenticity is now minted and securely linked to your profile!
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleRegisterPiece} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
                            Aurelius Product Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Aurelius Executive Briefcase"
                            value={regProductName}
                            onChange={(e) => setRegProductName(e.target.value)}
                            className="w-full bg-[#202020] border border-gray-800 rounded px-3 py-2 text-white outline-none focus:border-[#C5A05A]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
                            Brass Stamped Serial ID
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. AUR-EX-9024-3311"
                            value={regSerial}
                            onChange={(e) => setRegSerial(e.target.value)}
                            className="w-full bg-[#202020] border border-gray-800 rounded px-3 py-2 text-white outline-none focus:border-[#C5A05A] font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
                            Atelier Leather Class
                          </label>
                          <select
                            value={regLeather}
                            onChange={(e) => setRegLeather(e.target.value)}
                            className="w-full bg-[#202020] border border-gray-800 rounded px-3 py-2 text-white outline-none focus:border-[#C5A05A]"
                          >
                            <option value="Vegetable-Tanned Saddle Cowhide">Vegetable-Tanned Saddle Cowhide</option>
                            <option value="Italian Full-Grain Aniline Calfskin">Italian Full-Grain Aniline Calfskin</option>
                            <option value="Heavy-Gauge Forest Wax Suede">Heavy-Gauge Forest Wax Suede</option>
                            <option value="Hand-Glazed Full-Grain Pebble Skin">Hand-Glazed Full-Grain Pebble Skin</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={isRegistering || !regProductName || !regSerial}
                          className="w-full bg-[#C5A05A] hover:bg-[#A5673F] disabled:bg-neutral-800 text-black disabled:text-gray-500 py-2.5 rounded font-mono text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isRegistering ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Securing Signature...</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-3.5 w-3.5" />
                              <span>Verify & Register Piece</span>
                            </>
                          )}
                        </button>
                      </form>

                      <p className="text-[10px] text-gray-500 leading-relaxed font-light mt-4 italic text-center">
                        "Ownership registration verifies legal pedigree and activates lifetime repair coverage at our lounges."
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}
        </div>

      </div>

      {/* Dynamic Heritage Vault View Modal */}
      {selectedCertForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative bg-[#F8F5EF] text-[#221F1A] border-4 border-[#C5A05A]/70 max-w-xl w-full p-6 sm:p-8 rounded shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col justify-between">
            
            {/* Vintage style ornate border corners */}
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-[#C5A05A]/25 pointer-events-none" />

            {/* Close Button */}
            <button 
              onClick={() => setSelectedCertForView(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black z-10 transition-colors p-1 rounded-full bg-white/40 hover:bg-white/80"
              title="Close Certificate View"
            >
              ✕
            </button>

            {/* Certificate Body */}
            <div className="space-y-6 text-center pt-4 relative">
              
              {/* Gold Crest Header */}
              <div className="flex flex-col items-center">
                <Shield className="h-10 w-10 text-[#C5A05A] stroke-[1.5px] fill-[#C5A05A]/10 mb-2" />
                <span className="font-serif text-[10px] tracking-[0.4em] uppercase text-[#A5673F] font-bold block">
                  Aurelius Atelier Florence
                </span>
                <h2 className="font-serif text-xl sm:text-2xl tracking-wide uppercase text-gray-950 font-bold mt-1 border-b border-[#C5A05A] pb-1.5 px-4">
                  Certificate of Authenticity
                </h2>
              </div>

              {/* Sub declaration */}
              <p className="text-[11.5px] text-gray-600 max-w-sm mx-auto leading-relaxed italic">
                "This document officially certifies the origin, caliber, and legal ownership of the luxury leather masterpiece documented herein."
              </p>

              {/* Specifications Box */}
              <div className="bg-[#F0EDE6] border border-[#C5A05A]/30 p-4.5 rounded text-left font-serif text-xs space-y-3 shadow-inner">
                <div className="flex justify-between items-center border-b border-[#C5A05A]/15 pb-2">
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Registered Owner</span>
                  <span className="font-bold text-gray-900">{selectedCertForView.owner}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C5A05A]/15 pb-2">
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Masterpiece Model</span>
                  <span className="font-bold text-gray-900">{selectedCertForView.productName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C5A05A]/15 pb-2">
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Craft Category</span>
                  <span className="text-gray-900 font-medium">{selectedCertForView.category}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C5A05A]/15 pb-2">
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Medium / Hide</span>
                  <span className="text-gray-900 text-[11px] font-medium leading-tight max-w-xs text-right">
                    {selectedCertForView.leatherType}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#C5A05A]/15 pb-2">
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Glaze Tallow Ratio</span>
                  <span className="font-mono font-bold text-gray-900">{selectedCertForView.tallowRatio}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Chassis Serial Number</span>
                  <span className="font-mono font-bold text-[#A5673F] bg-white border border-[#C5A05A]/20 px-2 py-0.5 rounded shadow-sm text-[11px]">
                    {selectedCertForView.serialNumber}
                  </span>
                </div>
              </div>

              {/* Crafting & Registration Credentials */}
              <div className="grid grid-cols-2 gap-4 text-xs text-left pt-2">
                <div className="space-y-1">
                  <span className="text-[8.5px] uppercase font-mono text-gray-500 tracking-wider block">Authorized Maker</span>
                  <span className="font-medium text-gray-900 block">{selectedCertForView.artisan}</span>
                  <span className="text-[10px] text-gray-400 block italic leading-tight">{selectedCertForView.location}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[8.5px] uppercase font-mono text-gray-500 tracking-wider block">Registry Stamped</span>
                  <span className="font-medium text-gray-900 block">{selectedCertForView.registeredDate}</span>
                  <span className="text-[10px] text-gray-400 block font-mono">ID: {selectedCertForView.id}</span>
                </div>
              </div>

              {/* Seal Signatures */}
              <div className="flex items-center justify-between border-t border-[#C5A05A]/30 pt-5 mt-4">
                {/* Hand Sign */}
                <div className="text-left">
                  <span className="text-[8px] uppercase font-mono text-gray-400 tracking-wider block">Signature of Registry</span>
                  <span className="font-serif italic font-extrabold text-gray-800 text-lg leading-none tracking-wider mt-1 block select-none">
                    {selectedCertForView.signature}
                  </span>
                </div>

                {/* Dry Stamp Emblem */}
                <div className="relative flex items-center justify-center bg-[#F4EFEB] h-14 w-14 rounded-full border border-dashed border-[#C5A05A] text-[#C5A05A] shadow-inner select-none">
                  <Sparkles className="h-6 w-6 opacity-80" />
                  <div className="absolute inset-0 text-[5px] font-mono font-bold uppercase tracking-widest text-[#C5A05A]/50 flex items-center justify-center text-center leading-none p-1 pointer-events-none">
                    Aurelius Atelier Florence
                  </div>
                </div>
              </div>

            </div>

            {/* Certificate Footer actions */}
            <div className="mt-8 flex gap-3 text-xs">
              <button
                onClick={() => setSelectedCertForView(null)}
                className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-gray-700 py-2.5 rounded font-medium transition-colors cursor-pointer"
              >
                Close Portal
              </button>
              
              <button
                onClick={() => {
                  handleDownloadCert(selectedCertForView);
                  setSelectedCertForView(null);
                }}
                className="flex-1 bg-gradient-to-r from-[#A5673F] to-[#C5A05A] text-white py-2.5 rounded font-mono text-[9px] uppercase tracking-widest font-bold transition-all hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#C5A05A]/15"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Ledger</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
