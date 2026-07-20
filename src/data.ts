import { Product, BlogArticle, UserAccount, Review } from "./types";

export const BRAND_NAME = "Aurelius";

// High-fidelity curated luxury leather products
export const PRODUCTS: Product[] = [
  {
    id: "leathfocus-duffle",
    name: "Leathfocus Men's Cowhide Travel Bag Women's Weekend Handbag Large Capacity Vintage Duffle Bag Crazy Horse Leather Laptop Bag",
    price: 245,
    originalPrice: 295,
    category: "bags",
    subcategory: "Travel Duffle",
    rating: 4.9,
    reviewsCount: 188,
    image: "/src/assets/images/regenerated_image_1784236303482.webp",
    images: [
      "/src/assets/images/regenerated_image_1784236303482.webp",
      "/src/assets/images/regenerated_image_1784075688944.jpg"
    ],
    description: `Material Explanation:

Natural first layer cowhide will also have a little inherent texture, scratches, creases, skin spots, blood bands,

texture and other differences, which are the characteristics of natural leather, non-quality issues.



About Crazy Horse Leather:

1. Crazy horse brand cowhide products just started to use, the surface will have floating color.

In the early use try to avoid light-colored clothes with,

when the leather surface is brighter (can also be reduced by applying oil care).

2. there are creases where you can use your hand to rub back and forth to make the creases,

scratches lighten or even disappear.



Maintenance Instructions：

1. Although the leather has a certain degree of water resistance, but should try to avoid water,

water should be dried as soon as possible to dry, do not wash water immersion.

2. Avoid sharp objects scratching the leather surface, do not long time high temperature exposure to the sun,

keep clean and dry, moisture storage.

3. Can use leather maintenance oil regularly to protect, and dry cotton cloth to rub color metal accessories,

so that its bright.....`,
    features: [
      "Brand Name: LEATHFOCUS",
      "Material Composition: Cowhide Genuine Leather",
      "Model Number: 30020",
      "Hardness: SOFT",
      "Closure Type: Zipper"
    ],
    variantColors: ["Vintage Brown", "Coffee Color", "Black"],
    variantColorsHex: ["#8B5A2B", "#3E2723", "#111111"],
    dimensions: "50cm L x 24cm W x 26cm H",
    weight: "1.8 kg",
    capacity: "31 Litres",
    laptopCompatibility: "Integrated sleeve fits up to 15.6-inch laptops",
    waterResistance: "Moderate water resistance. Avoid water immersion.",
    careInstructions: "Although the leather has a certain degree of water resistance, but should try to avoid water, water should be dried as soon as possible to dry, do not wash water immersion. Avoid sharp objects scratching the leather surface, do not long time high temperature exposure to the sun, keep clean and dry, moisture storage. Can use leather maintenance oil regularly to protect, and dry cotton cloth to rub color metal accessories, so that its bright.",
    inStock: 14,
    legacyStory: "Hand-crafted from selection grade-A first layer cowhide, featuring LEATHFOCUS traditional brass-zippered pockets, durable double stitched straps, and protective bottom metal studs.",
    customSpecs: {
      "High-concerned chemical": "None",
      "Place Of Origin": "China (mainland)",
      "Genuine Leather Type": "Cow Leather",
      "Occasion": "Versatile",
      "Material Composition": "Cowhide",
      "Item Width": "24cm",
      "Item Length": "50cm",
      "Model Number": "30020",
      "Hardness": "SOFT",
      "Travel Bag": "Travel Duffle",
      "Pattern Type": "Solid",
      "Style": "Casual",
      "Have Drawbars": "No",
      "Main Material": "Genuine Leather",
      "Brand Name": "LEATHFOCUS",
      "Origin": "Mainland China, CN, Guangdong",
      "Gender": "Men",
      "Item Type": "travel bags",
      "Item Height": "26",
      "Closure Type": "Zipper",
      "Item Weight": "1.8"
    }
  },
  {
    id: "nav-duffel",
    name: "Aurelius Navigator Duffel",
    price: 420,
    originalPrice: 495,
    category: "bags",
    subcategory: "Travel Duffels",
    rating: 4.9,
    reviewsCount: 148,
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "An absolute masterclass in luxury travel. The Navigator Duffel is hand-shaped from our signature full-grain Crazy Horse leather. Built to rest elegantly in private lounges and cabin overhead compartments, its character matures on every single voyage, developing a rich, copper patina that tells the stories of your life's chapters.",
    features: [
      "Signature 2.0mm Hand-Selected Crazy Horse Leather",
      "Premium Solid Brass Hardware & Double-Stitched Rivets",
      "45-Litre Capacity with Expansive Easy-Access U-Zip opening",
      "Reinforced Leather Shoulder Strap with Ergonomic Padded Backing"
    ],
    variantColors: ["Saddle Brown", "Dark Espresso", "Matte Black"],
    variantColorsHex: ["#7A4E2D", "#2F241F", "#111111"],
    laptopCompatibility: "Up to 16-inch Macbook Pro in secure exterior document sleeve",
    waterResistance: "Naturally repels light rain and splashes, develops barrier through natural wax",
    dimensions: "22.5\" L x 11.5\" W x 11\" H (TSA Approved Carry-On)",
    weight: "4.8 lbs (Empty)",
    capacity: "45 Litres",
    careInstructions: "Apply Aurelius Beeswax Conditioner once every six months. Protect from saturated, prolonged downpours.",
    inStock: 12,
    legacyStory: "Hand-crafted by our master artisans in Tuscany, utilizing 100-year-old traditional techniques. Each hide takes over 24 days to vegetable-tan using organic oak bark and mimosa extracts."
  },
  {
    id: "overlander-weekend",
    name: "Aurelius Overlander Weekend Bag",
    price: 480,
    category: "bags",
    subcategory: "Travel Duffels",
    rating: 4.8,
    reviewsCount: 92,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "Meticulously built for weekend road trips and luxury retreats. The Overlander features a dedicated ventilated shoe compartment lined in waterproof oxford canvas to separate your fine footwear. Spacious, rigid, and engineered with a masculine, structured profile.",
    features: [
      "Premium Calfskin full-grain leather with water-repellent coating",
      "Dedicated side-access ventilated footwear compartment",
      "YKK Excella ultra-smooth double zippers",
      "Interior zippered jewelry pocket, watch roll anchor, and business card slots"
    ],
    variantColors: ["Dark Espresso", "Saddle Brown"],
    variantColorsHex: ["#2F241F", "#7A4E2D"],
    laptopCompatibility: "Integrated 15-inch neoprene sleeve",
    waterResistance: "Waterproof inner shoe pouch; water-resistant leather exterior",
    dimensions: "21.2\" L x 11.0\" W x 11.8\" H",
    weight: "5.1 lbs",
    capacity: "42 Litres",
    careInstructions: "Wipe with a clean microfibre cloth. Spot clean the interior nylon lining with warm soapy water.",
    inStock: 5,
    stockLevel: 3,
    legacyStory: "Engineered for rugged luxury, merging military-grade stitching with high-fashion Italian calfskin. A staple for coastal weekend getaways."
  },
  {
    id: "exec-briefcase",
    name: "Aurelius Executive Briefcase",
    price: 350,
    originalPrice: 380,
    category: "bags",
    subcategory: "Business Laptop Bags",
    rating: 5.0,
    reviewsCount: 74,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "The ultimate business asset. Command the boardroom with a leather briefcase that projects confidence, sophistication, and relentless work ethic. Designed with an ultra-slim profile yet fully optimized to host your computer, files, and modern accessories.",
    features: [
      "Full-grain Veg-Tanned Leather with hand-painted burnished edges",
      "Dual divided main sections with luxurious olive green herringbone liner",
      "Rear integrated trolley-strap to attach seamlessly to rolling luggage",
      "Reinforced heavy-duty dual drop handles"
    ],
    variantColors: ["Matte Black", "Dark Espresso", "Leather Tan"],
    variantColorsHex: ["#111111", "#2F241F", "#B98B5D"],
    laptopCompatibility: "Specially padded divider for up to 16-inch Macbook Pro",
    waterResistance: "Polished rainproof wax-sealed coating",
    dimensions: "16\" L x 3\" W x 11.5\" H",
    weight: "3.5 lbs",
    capacity: "12 Litres",
    careInstructions: "Avoid deep scratches from sharp metal objects. Wipe with specialized leather cream.",
    inStock: 18,
    stockLevel: 2,
    legacyStory: "Designed for corporate lawyers and high-stakes executives. This briefcase is crafted using high-tensile British bonded threads to guarantee structural lifetime durability."
  },
  {
    id: "sovereign-oxford",
    name: "Aurelius Sovereign Oxford",
    price: 280,
    category: "shoes",
    subcategory: "Handmade Leather Shoes",
    rating: 4.9,
    reviewsCount: 65,
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "The epitome of British luxury footwear. Each Sovereign Oxford is painstakingly Goodyear welted, ensuring that the sole can be replaced indefinitely across decades of service. Created from French calf skin, hand-burnished for a rich, deep aesthetic finish.",
    features: [
      "Goodyear Welted construction for lifetime resole-ability",
      "Hand-burnished Italian calf skin",
      "Full glove-leather breathable lining for supreme comfortable wear",
      "Cork-bed midsole that molds perfectly to your foot shape over time"
    ],
    variantColors: ["Saddle Brown", "Matte Black"],
    variantColorsHex: ["#7A4E2D", "#111111"],
    waterResistance: "Water-repellent welted seams",
    dimensions: "Standard UK/US dress shoe sizing (D width)",
    weight: "1.4 lbs per shoe",
    careInstructions: "Polishing with premium shoe wax regularly. Always store with natural cedar shoe trees.",
    inStock: 15,
    legacyStory: "Takes over 120 steps and 3 weeks of hand construction in Northamptonshire, England, by cobblers with three generations of inherited heritage."
  },
  {
    id: "nomad-sneaker",
    name: "Aurelius Nomad Leather Sneaker",
    price: 190,
    category: "shoes",
    subcategory: "Leather Sneakers",
    rating: 4.7,
    reviewsCount: 110,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "Redefine your casual dress code. The Nomad merges the comfort of premium running athletic insoles with the unmistakable elegance of top-grade, hand-selected Italian matte calf leather. A perfect companion for casual Fridays, creative meetings, or elite city strolls.",
    features: [
      "Ultra-soft full grain Italian milled leather",
      "High-density custom memory foam footbed with active charcoal inserts",
      "Durable Margom Italian rubber cupsole (stitched, not just glued)",
      "Waxed luxury cotton laces"
    ],
    variantColors: ["Warm White", "Leather Tan", "Matte Black"],
    variantColorsHex: ["#FCFCFA", "#B98B5D", "#111111"],
    waterResistance: "Resists light puddles, dirt brushes off easily",
    dimensions: "True to size. Half-sizes should size down.",
    weight: "1.1 lbs per shoe",
    careInstructions: "Use a premium leather sneaker cleaner. Avoid machine washing.",
    inStock: 34,
    legacyStory: "A revolutionary modern design blending heritage luxury hide with premium custom rubber molds. Hand-stitched in Civitanova, Italy."
  },
  {
    id: "chelsea-boot",
    name: "Aurelius Chelsea Boot",
    price: 310,
    category: "shoes",
    subcategory: "British Style Shoes",
    rating: 4.9,
    reviewsCount: 88,
    image: "https://images.unsplash.com/photo-1639006570490-79c0c53f1080?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1639006570490-79c0c53f1080?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "Sleek, confident, and incredibly versatile. Hand-shaped from premium Italian Suede with double-stitched rear pulls and robust elastic side panels. This boot pairs beautifully with custom tailored suits or high-end vintage denim.",
    features: [
      "100% Water-repellent treated Italian Suede leather",
      "Flexible and breathable leather lining",
      "Studded rubber-injected leather sole for all-weather traction",
      "Heavy-duty elastic stretch panels designed to resist slackening"
    ],
    variantColors: ["Cognac Suede", "Matte Black"],
    variantColorsHex: ["#A5673F", "#111111"],
    waterResistance: "Prefinished with suede protector coating",
    dimensions: "Runs slightly large (recommend taking half size down)",
    weight: "1.6 lbs per boot",
    careInstructions: "Brush with a soft brass suede brush after wear. Store away from dampness.",
    inStock: 9,
    legacyStory: "Inspired by the classical 1960s London silhouette, enhanced with a modern reinforced toe-box and custom weatherizing treatment."
  },
  {
    id: "heritage-wallet",
    name: "Aurelius Heritage Wallet",
    price: 85,
    category: "accessories",
    subcategory: "Leather Wallets",
    rating: 4.9,
    reviewsCount: 215,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "A masterwork of minimalism. Crafted from ultra-thin vegetable-tanned leather to keep your pockets perfectly flat while hosting all your essential cards and folded bills. Integrates modern RFID defense seamlessly without adding bulk.",
    features: [
      "Premium vegetable-tanned leather with burnished gold stamp",
      "RFID-protection shield embedded in lining",
      "8 card slots, 2 quick-access pockets, and central spacious cash compartment",
      "Ultra-slim 0.4\" empty profile"
    ],
    variantColors: ["Saddle Brown", "Matte Black", "Leather Tan"],
    variantColorsHex: ["#7A4E2D", "#111111", "#B98B5D"],
    dimensions: "4.3\" L x 3.3\" W x 0.4\" H",
    weight: "1.8 oz",
    careInstructions: "Condition with light natural oils once a year. Keep dry.",
    inStock: 45,
    legacyStory: "Drawn from timeless bi-fold heritage, stitched with high-tensile nylon to ensure it never splits or opens under pressure."
  },
  {
    id: "aviator-watch",
    name: "Aurelius Aviator Watch",
    price: 380,
    category: "accessories",
    subcategory: "Leather Watches",
    rating: 4.8,
    reviewsCount: 57,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "Classic aviation design combined with high-precision mechanics. Encased in beautiful brushed copper bezel with anti-reflective sapphire crystal glass, anchored securely by a thick, authentic Crazy Horse leather band.",
    features: [
      "High-precision Japanese automatic movement (self-winding)",
      "Premium 22mm Crazy Horse tan leather strap with gold steel buckle",
      "Genuine sapphire crystal scratch-proof glass",
      "5 ATM Waterproof rating (Splash & showerproof)"
    ],
    variantColors: ["Leather Tan", "Matte Black"],
    variantColorsHex: ["#B98B5D", "#111111"],
    dimensions: "42mm Case Diameter, 11mm Thickness, 22mm Band Width",
    weight: "2.8 oz",
    careInstructions: "Keep leather band away from prolonged immersion in water.",
    inStock: 8,
    legacyStory: "A tribute to historical pilot timepieces, customized with Aurelius signature patinating leather straps that tell a story with every flight."
  },
  {
    id: "care-kit",
    name: "Aurelius Leather Care Kit",
    price: 35,
    category: "accessories",
    subcategory: "Leather Care Products",
    rating: 4.9,
    reviewsCount: 304,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "Preserve your investment. This kit contains everything you need to keep your fine leather goods clean, intensely hydrated, water-repellent, and protected for a lifetime. Essential for maintaining Crazy Horse and calfskins.",
    features: [
      "Premium 2oz organic triple-filtrated beeswax moisturizing cream",
      "100% Genuine horsehair brush with polished ergonomic walnut wood handle",
      "Ultra-soft grey microfibre cleaning and polishing cloth",
      "Luxury drawstring storage pouch"
    ],
    variantColors: ["Natural"],
    variantColorsHex: ["#F8F5EF"],
    dimensions: "6.5\" L x 4.0\" W x 2.2\" H",
    weight: "7.5 oz",
    careInstructions: "Keep care kit stored in a cool, dry place away from direct sunlight.",
    inStock: 120,
    legacyStory: "Formulated with 100% all-natural beeswax, sweet almond oil, and clean pine resin. Free from toxic silicones, petroleum distillates, or chemical fragrances."
  }
];

// Curated luxurious blogs
export const BLOGS: BlogArticle[] = [
  {
    id: "care-guide",
    title: "The Patina Journey: Caring for Crazy Horse Leather",
    category: "Craftsmanship",
    readTime: "6 min read",
    date: "June 24, 2026",
    excerpt: "Crazy Horse leather doesn't degrade; it travels and evolves. Discover the art of moisturizing, polishing, and embracing the scratches that detail your legacy.",
    content: "Crazy Horse leather (often called saddle leather) is created by applying special natural wax coatings to a buffed full-grain surface. This process gives it an incredibly unique property: when scratched or rubbed, the wax shifts to create custom highlights and beautiful color transitions. In this article, our master artisans explain how to treat your bag to beeswax conditioning, how to use natural warmth from your hands to buff out minor marks, and why you should never fear the rain.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
    tags: ["Leather Care", "Atelier Tips", "Patina"]
  },
  {
    id: "packing-guide",
    title: "Pack Like a Leader: The Ultimate Executive Carry-On Guide",
    category: "Guides",
    readTime: "4 min read",
    date: "July 02, 2026",
    excerpt: "Maximizing luxury space for a 3-day high-stakes business trip. Inside the layout of the Aurelius Navigator Duffel.",
    content: "Packing is an exercise in editing. Business leaders don't carry clutter; they bring assets. We break down the optimal layout for a 45L Duffel. Learn the roll-and-anchor method to protect bespoke suits, how the Overlander's shoe compartment isolates clean linens, and why our dedicated laptop external compartment streamlines airport security screenings.",
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800",
    tags: ["Business Travel", "Packing", "Airport Lounge"]
  },
  {
    id: "goodyear-welt-art",
    title: "What is Goodyear Welt? A Footwear Philosophy",
    category: "Lifestyle",
    readTime: "8 min read",
    date: "July 12, 2026",
    excerpt: "Why premium men choose stitched welt soles over glued alternatives. The history and mechanics of fine European shoemaking.",
    content: "In an era of disposable fashion, Goodyear welting stands as a fortress of sustainability and status. Invented by Charles Goodyear Jr. in 1869, this technique runs a heavy canvas strip (the 'welt') along the sole, securing the upper and insole with dense stitching. Our cobbler details how cork filling conforms to your personal gait, why this outsole resists high-impact rain, and how Aurelius resolves to make footwear that lasts half a century.",
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=800",
    tags: ["Northampton", "Heritage", "Sovereign Series"]
  }
];

// Rich customer details with order history and reward points
export const DEFAULT_USER: UserAccount = {
  name: "Marcus Sterling",
  email: "m.sterling@sterlingholdings.com",
  points: 1250,
  vipLevel: "Platinum",
  orderHistory: [
    {
      id: "AUR-3022",
      date: "July 11, 2026",
      total: 245,
      status: "In Transit",
      items: [
        {
          productName: "Leathfocus Men's Cowhide Travel Bag",
          quantity: 1,
          color: "Vintage Brown",
          price: 245
        }
      ],
      trackingNumber: "AUR-ITA-77391"
    },
    {
      id: "AUR-9204",
      date: "May 14, 2026",
      total: 420,
      status: "Delivered",
      items: [
        {
          productName: "Aurelius Navigator Duffel",
          quantity: 1,
          color: "Saddle Brown",
          price: 420
        }
      ],
      trackingNumber: "UPS-1A82F90428"
    },
    {
      id: "AUR-8113",
      date: "Feb 02, 2026",
      total: 225,
      status: "Delivered",
      items: [
        {
          productName: "Aurelius Nomad Leather Sneaker",
          quantity: 1,
          color: "Warm White",
          price: 190
        },
        {
          productName: "Aurelius Leather Care Kit",
          quantity: 1,
          color: "Natural",
          price: 35
        }
      ],
      trackingNumber: "FEDEX-81204859"
    }
  ]
};

// Default high-quality reviews pool to seed our screens
export const DEFAULT_REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Richard V.",
    rating: 5,
    date: "2 weeks ago",
    text: "The patina on this Crazy Horse leather bag is stunning after just two trips. I was caught in a light drizzle in Heathrow and it repelled the moisture beautifully. Absolute private lounge vibe.",
    verified: true,
    helpfulCount: 42
  },
  {
    id: "rev-2",
    author: "Capt. Michael T.",
    rating: 5,
    date: "1 month ago",
    text: "As a pilot, I need durability. This duffel sits behind my flight deck seats. The brass buckles are solid, and the smell of premium full-grain leather is intoxicating every time I unzip it.",
    verified: true,
    helpfulCount: 18
  },
  {
    id: "rev-3",
    author: "Dmitri K.",
    rating: 4,
    date: "3 weeks ago",
    text: "Meticulous stitch lines. A bit heavy when empty, but that is expected with thick, high-caliber genuine leather. Highly recommended.",
    verified: true,
    helpfulCount: 9
  }
];
