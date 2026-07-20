export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: "bags" | "shoes" | "accessories";
  subcategory: string;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  variantColors: string[];
  variantColorsHex: string[];
  laptopCompatibility?: string;
  waterResistance?: string;
  dimensions: string;
  weight: string;
  capacity?: string;
  careInstructions: string;
  inStock: number;
  stockLevel?: number;
  legacyStory?: string;
  customSpecs?: Record<string, string>;
  video?: string;
  skus?: {
    sku: string;
    color: string;
    inStock: number;
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  photos?: string[];
  helpfulCount: number;
}

export interface BlogArticle {
  id: string;
  title: string;
  category: "Lifestyle" | "Craftsmanship" | "Guides";
  readTime: string;
  date: string;
  excerpt: string;
  content: string;
  image: string;
  tags: string[];
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: "Delivered" | "Processing" | "Shipped" | "In Transit";
  items: {
    productName: string;
    quantity: number;
    color: string;
    price: number;
  }[];
  trackingNumber?: string;
}

export interface UserAccount {
  name: string;
  email: string;
  points: number;
  vipLevel: "Bronze" | "Silver" | "Gold" | "Platinum" | "Aurelius Elite";
  orderHistory: Order[];
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | "GHS";

export interface CurrencyConfig {
  symbol: string;
  rate: number;
  label: string;
}

export const CURRENCY_MAP: Record<CurrencyCode, CurrencyConfig> = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 0.78, label: "GBP (£)" },
  JPY: { symbol: "¥", rate: 155.0, label: "JPY (¥)" },
  CAD: { symbol: "CA$", rate: 1.36, label: "CAD (CA$)" },
  AUD: { symbol: "A$", rate: 1.50, label: "AUD (A$)" },
  GHS: { symbol: "GH₵", rate: 15.2, label: "GHS (GH₵)" },
};

export function formatPrice(price: number, currency: CurrencyCode): string {
  const { symbol, rate } = CURRENCY_MAP[currency];
  const converted = price * rate;
  // If the converted value is an integer, render without decimals, else with 2 decimals
  const displayVal = Number.isInteger(converted) ? converted.toFixed(0) : converted.toFixed(2);
  return `${symbol}${displayVal}`;
}

