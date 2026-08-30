/**
 * SaaS Subscription Packages, Durations, and Discount Rules.
 * Supported Terms: 1 Month, 3 Months, 6 Months, 9 Months, 12 Months (1 Year), and 3 Years.
 */

export type SubscriptionDuration =
  | "1_MONTH"
  | "3_MONTHS"
  | "6_MONTHS"
  | "9_MONTHS"
  | "12_MONTHS"
  | "3_YEARS";

export interface DurationOption {
  id: SubscriptionDuration;
  label: string;
  nepaliLabel: string;
  months: number;
  discountPercent: number;
  badge?: string;
}

export const SUBSCRIPTION_DURATIONS: DurationOption[] = [
  {
    id: "1_MONTH",
    label: "1 Month",
    nepaliLabel: "१ महिने (मासिक)",
    months: 1,
    discountPercent: 0,
  },
  {
    id: "3_MONTHS",
    label: "3 Months",
    nepaliLabel: "३ महिने (त्रैमासिक)",
    months: 3,
    discountPercent: 0,
  },
  {
    id: "6_MONTHS",
    label: "6 Months",
    nepaliLabel: "६ महिने (अर्ध-वार्षिक)",
    months: 6,
    discountPercent: 0,
  },
  {
    id: "9_MONTHS",
    label: "9 Months",
    nepaliLabel: "९ महिने (३-चौमासिक)",
    months: 9,
    discountPercent: 5,
  },
  {
    id: "12_MONTHS",
    label: "12 Months (1 Year)",
    nepaliLabel: "१ वर्ष (वार्षिक)",
    months: 12,
    discountPercent: 10,
    badge: "10% OFF",
  },
  {
    id: "3_YEARS",
    label: "3 Years (Enterprise Lock)",
    nepaliLabel: "३ वर्षे (दीर्घकालीन सम्झौता)",
    months: 36,
    discountPercent: 25,
    badge: "25% OFF · PRICE LOCK",
  },
];

export interface SaaSPlan {
  id: string;
  name: string;
  nepaliName: string;
  description: string;
  monthlyRateNpr: number;
  popular?: boolean;
  features: string[];
}

export const SAAS_PLANS: SaaSPlan[] = [
  {
    id: "starter",
    name: "Forecourt Starter",
    nepaliName: "स्टार्टर प्याकेज",
    description: "Standard cash POS billing for standalone 1-2 island stations.",
    monthlyRateNpr: 1500,
    features: [
      "Up to 2 Dispenser Islands (4 Nozzles)",
      "Cashier POS & Thermal Slip Print",
      "Underground Tank Dip Log (mm)",
      "Daily Shift Cash Closing & Handoff",
      "Standard Email & Phone Support",
    ],
  },
  {
    id: "pro",
    name: "Station Pro + IRD Sync",
    nepaliName: "प्रो + IRD कर सिङ्क",
    description: "Full automated station operations with real-time IRD CBMS tax push.",
    monthlyRateNpr: 3500,
    popular: true,
    features: [
      "Up to 6 Dispenser Islands (12 Nozzles)",
      "Real-time IRD CBMS Electronic Invoicing",
      "Fleet Corporate Portal & Customer Credit (खाता)",
      "Vehicle-wise Consumption Ledgers & Statements",
      "NOC Indent & Decanting Temperature/Density Dip",
      "24/7 Priority Support Hotline",
    ],
  },
  {
    id: "enterprise",
    name: "Petroleum Group Enterprise",
    nepaliName: "इन्टरप्राइज बहु-स्टेशन",
    description: "For multi-station holding groups, highway fuel hubs & fleet operators.",
    monthlyRateNpr: 7500,
    features: [
      "Unlimited Pumps, Tanks & Dispenser Bays",
      "Multi-Station Centralized HQ Console",
      "Full Forecourt Automation Controller Link",
      "Dedicated Database Partition & 99.99% SLA",
      "Custom ERP/Tally/SAP API Gateway",
      "Dedicated Account Manager & Field Engineer",
    ],
  },
];

export function calculatePackagePrice(
  monthlyRateNpr: number,
  durationId: SubscriptionDuration
): {
  months: number;
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  netBeforeTax: number;
  vatAmount: number;
  grossPayable: number;
  monthlyEffective: number;
} {
  const duration = SUBSCRIPTION_DURATIONS.find((d) => d.id === durationId) || SUBSCRIPTION_DURATIONS[4];
  const months = duration.months;
  const baseAmount = monthlyRateNpr * months;
  const discountPercent = duration.discountPercent;
  const discountAmount = Math.round((baseAmount * discountPercent) / 100);
  const netBeforeTax = baseAmount - discountAmount;
  const vatAmount = Math.round(netBeforeTax * 0.13); // 13% Nepal VAT
  const grossPayable = netBeforeTax + vatAmount;
  const monthlyEffective = Math.round(grossPayable / months);

  return {
    months,
    baseAmount,
    discountPercent,
    discountAmount,
    netBeforeTax,
    vatAmount,
    grossPayable,
    monthlyEffective,
  };
}
