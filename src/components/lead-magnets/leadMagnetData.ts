import { BookOpen, Calculator, FileText, LucideIcon } from "lucide-react";

interface LeadMagnet {
  title: string;
  description: string;
  type: string;
  icon: LucideIcon;
  isLocked: boolean;
  isTemplate: boolean;
}

export const leadMagnets: LeadMagnet[] = [
  {
    title: "2024 Home Buyer's Guide",
    description: "Complete guide for first-time home buyers with tips and checklists",
    type: "guide",
    icon: BookOpen,
    isLocked: true,
    isTemplate: false,
  },
  {
    title: "Property Value Calculator",
    description: "Estimate your property's value with our advanced calculator",
    type: "calculator",
    icon: Calculator,
    isLocked: false,
    isTemplate: true,
  },
  {
    title: "Market Analysis Report",
    description: "In-depth analysis of current real estate market trends",
    type: "report",
    icon: FileText,
    isLocked: true,
    isTemplate: false,
  },
];