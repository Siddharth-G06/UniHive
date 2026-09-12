import React from "react";
import {
  CreditCard,
  KeyRound,
  Wallet,
  Smartphone,
  Laptop,
  BookOpen,
  Headphones,
  FlaskConical,
  Bike,
  Calculator,
  PlugZap,
  BatteryCharging,
  Umbrella,
  BookText,
  Ruler,
  Package,
} from "lucide-react";

/**
 * Maps category names to their respective Lucide React icon components.
 */
export const CATEGORY_ICON_MAP = {
  // Lost & Found categories
  "ID Card": CreditCard,
  "Keys": KeyRound,
  "Wallet": Wallet,
  "Phone": Smartphone,
  "Laptop": Laptop,
  "Books": BookOpen,
  "Earphones": Headphones,
  "Water Bottle": FlaskConical,
  
  // Peer Exchange categories
  "Cycle": Bike,
  "Calculator": Calculator,
  "Scientific Calculator": Calculator,
  "Charger": PlugZap,
  "Power Bank": BatteryCharging,
  "Umbrella": Umbrella,
  "Lab Coat": FlaskConical,
  "Notebook": BookText,
  "Drafter": Ruler,
  
  // Default / Fallback
  "Others": Package,
};

/**
 * Renders a Lucide icon based on category name.
 */
export default function CategoryIcon({ category, size = 18, className = "", style = {} }) {
  const IconComponent = CATEGORY_ICON_MAP[category] || Package;
  return <IconComponent size={size} className={className} style={style} aria-hidden="true" />;
}
