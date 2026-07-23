import jsPDF from "jspdf";
import { CartItem, CurrencyCode, formatPrice } from "../types";

export interface ReceiptData {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  gateway: string;
  cart: CartItem[];
  subtotalUSD: number;
  shippingCostUSD: number;
  totalUSD: number;
  currency: CurrencyCode;
  date?: string;
}

export function generatePDFReceipt(data: ReceiptData) {
  const {
    orderRef,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    gateway,
    cart,
    subtotalUSD,
    shippingCostUSD,
    totalUSD,
    currency,
    date
  } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const formattedDate = date || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Top Dark Header Banner
  doc.setFillColor(20, 20, 20); // #141414
  doc.rect(0, 0, 210, 38, "F");

  // Gold Accent Strip
  doc.setFillColor(197, 160, 90); // #C5A05A
  doc.rect(0, 38, 210, 2, "F");

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AURELIUS ATELIER", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(197, 160, 90);
  doc.text("LUXURY LEATHER GOODS & BESPOKE COMMISSIONS", 15, 24);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("Via de' Tornabuoni 12, 50123 Firenze, Italy  |  concierge@aurelius.it", 15, 30);

  // Invoice Title & Status
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("OFFICIAL RECEIPT / INVOICE", 15, 52);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(`Receipt Reference: ${orderRef}`, 15, 58);
  doc.text(`Transaction Date: ${formattedDate}`, 15, 63);

  // Paid Status Badge
  doc.setFillColor(235, 247, 238);
  doc.setDrawColor(52, 168, 83);
  doc.roundedRect(142, 45, 53, 18, 2, 2, "FD");
  doc.setTextColor(30, 126, 52);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PAID & CLEARED", 146, 52);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 110, 70);
  doc.text(`Escrow Node: ${gateway ? gateway.toUpperCase() : "PAYSTACK"}`, 146, 58);

  // Section Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(15, 69, 195, 69);

  // Client Details Box
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(15, 74, 88, 38, 2, 2, "F");

  doc.setTextColor(140, 106, 47); // Gold accent
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT INFORMATION", 19, 80);

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Name: ${customerName || "Patron"}`, 19, 86);
  doc.text(`Email: ${customerEmail || "concierge@aurelius.it"}`, 19, 92);
  doc.text(`Phone: ${customerPhone || "N/A"}`, 19, 98);

  // Shipping Destination Box
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(107, 74, 88, 38, 2, 2, "F");

  doc.setTextColor(140, 106, 47);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("SHIPPING DESTINATION", 111, 80);

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Courier: DHL Express Worldwide`, 111, 86);
  
  const splitAddress = doc.splitTextToSize(`Address: ${shippingAddress || "Complimentary DHL Hub Delivery"}`, 80);
  doc.text(splitAddress, 111, 92);

  // Item Table Header
  let y = 120;
  doc.setFillColor(20, 20, 20);
  doc.rect(15, y, 180, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ITEM DESCRIPTION", 19, y + 5.5);
  doc.text("COLOR / VARIANT", 98, y + 5.5);
  doc.text("QTY", 138, y + 5.5);
  doc.text("UNIT PRICE", 152, y + 5.5);
  doc.text("SUBTOTAL", 175, y + 5.5);

  y += 8;

  // Items Rows
  if (cart && cart.length > 0) {
    cart.forEach((item, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 249, isEven ? 255 : 249, isEven ? 255 : 246);
      doc.rect(15, y, 180, 9, "F");

      doc.setDrawColor(240, 240, 238);
      doc.line(15, y + 9, 195, y + 9);

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      const itemName = item.product?.name || "Aurelius Masterpiece";
      const nameTruncated = itemName.length > 38 ? itemName.substring(0, 35) + "..." : itemName;
      doc.text(nameTruncated, 19, y + 6);
      doc.text(item.selectedColor || "Standard", 98, y + 6);
      doc.text(String(item.quantity || 1), 140, y + 6);
      doc.text(formatPrice(item.product?.price || 0, currency), 152, y + 6);
      doc.text(formatPrice((item.product?.price || 0) * (item.quantity || 1), currency), 175, y + 6);

      y += 9;
    });
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, y, 180, 9, "F");
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Custom Aurelius Leather Commission", 19, y + 6);
    doc.text(formatPrice(totalUSD, currency), 175, y + 6);
    y += 9;
  }

  y += 6;

  // Summary Box
  const summaryBoxX = 115;
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(summaryBoxX, y, 80, 30, 2, 2, "F");

  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  
  doc.text("Items Subtotal:", summaryBoxX + 4, y + 7);
  doc.text(formatPrice(subtotalUSD, currency), 188, y + 7, { align: "right" });

  doc.text("DHL Express Shipping:", summaryBoxX + 4, y + 14);
  doc.text(shippingCostUSD === 0 ? "FREE" : formatPrice(shippingCostUSD, currency), 188, y + 14, { align: "right" });

  doc.setDrawColor(210, 210, 200);
  doc.line(summaryBoxX + 4, y + 18, summaryBoxX + 76, y + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(140, 106, 47);
  doc.text("Total Paid:", summaryBoxX + 4, y + 25);
  doc.text(formatPrice(totalUSD, currency), 188, y + 25, { align: "right" });

  // Lifetime Warranty & Certificate of Authenticity Box
  y += 38;
  doc.setFillColor(250, 247, 242);
  doc.setDrawColor(225, 200, 150);
  doc.roundedRect(15, y, 180, 22, 2, 2, "FD");

  doc.setTextColor(140, 106, 47);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ATELIER AUTHENTICITY GUARANTEE & LIFETIME WARRANTY", 19, y + 6);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Every Aurelius creation is handcrafted from 100% full-grain vegetable-tanned leather. This receipt serves as your official lifetime warranty certificate and proof of authenticity.", 19, y + 12, { maxWidth: 172 });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Aurelius Atelier S.r.l.  •  P.IVA IT09283740129  •  Firenze, Italia  •  www.aurelius.it", 105, 285, { align: "center" });

  // Download PDF file
  const sanitizeRef = orderRef.replace(/[^a-zA-Z0-9_-]/g, "");
  doc.save(`Aurelius_Receipt_${sanitizeRef}.pdf`);
}
