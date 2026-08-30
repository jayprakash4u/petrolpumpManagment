"use client";

import { useState, useMemo } from "react";
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Filter,
  Receipt,
  Plus,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  X,
  Layers,
  Percent,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input, Field } from "@/components/ui/Field";
import { fmtRs } from "@/lib/money";
import {
  SUBSCRIPTION_DURATIONS,
  calculatePackagePrice,
  type SubscriptionDuration,
} from "@/lib/subscription-plans";

export interface StationBillingRecord {
  id: string;
  stationName: string;
  slug: string;
  location: string;
  dealerCode: string;
  planName: "Forecourt Starter" | "Station Pro + IRD Sync" | "Petroleum Group Enterprise";
  monthlyRateNpr: number;
  duration: SubscriptionDuration;
  annualFeeNpr: number;
  lastPaymentDateBS: string;
  nextRenewalDateBS: string;
  daysRemaining: number;
  paymentMode: "NABIL_BANK_TRANSFER" | "FONEPAY_CORP_QR" | "BANK_CHEQUE" | "CASH";
  status: "ACTIVE" | "EXPIRING_SOON" | "OVERDUE_GRACE";
  contactPerson: string;
  phone: string;
}

export function TenantBillingView() {
  const [stations, setStations] = useState<StationBillingRecord[]>([
    {
      id: "st-1",
      stationName: "Shree Pashupati Petroleum Center",
      slug: "shree-petroleum",
      location: "Maharajgunj, Kathmandu",
      dealerCode: "KTM-DEALER-4091",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-06-01",
      nextRenewalDateBS: "2083-06-01",
      daysRemaining: 24,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Prakash Shrestha",
      phone: "9851023941",
    },
    {
      id: "st-2",
      stationName: "Pokhara Highway Fuel Center",
      slug: "pokhara-highway",
      location: "Prithvi Chowk, Pokhara",
      dealerCode: "PKR-DEALER-1082",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-07-15",
      nextRenewalDateBS: "2083-07-15",
      daysRemaining: 68,
      paymentMode: "FONEPAY_CORP_QR",
      status: "ACTIVE",
      contactPerson: "Bikram Gurung",
      phone: "9846011290",
    },
    {
      id: "st-3",
      stationName: "Everest Oil Traders",
      slug: "everest-oil",
      location: "Bharatpur, Chitwan",
      dealerCode: "CHW-DEALER-3390",
      planName: "Petroleum Group Enterprise",
      monthlyRateNpr: 7500,
      duration: "3_YEARS",
      annualFeeNpr: 200000,
      lastPaymentDateBS: "2082-08-01",
      nextRenewalDateBS: "2085-08-01",
      daysRemaining: 740,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Rajesh Adhikari",
      phone: "9855021940",
    },
    {
      id: "st-4",
      stationName: "Birgunj Border Fuel Hub",
      slug: "birgunj-fuel",
      location: "Dry Port Road, Birgunj",
      dealerCode: "BRG-DEALER-8812",
      planName: "Petroleum Group Enterprise",
      monthlyRateNpr: 7500,
      duration: "12_MONTHS",
      annualFeeNpr: 75000,
      lastPaymentDateBS: "2082-05-20",
      nextRenewalDateBS: "2083-05-20",
      daysRemaining: 12,
      paymentMode: "BANK_CHEQUE",
      status: "EXPIRING_SOON",
      contactPerson: "Sunil Keshari",
      phone: "9855034199",
    },
    {
      id: "st-5",
      stationName: "Butwal Petroleum Center",
      slug: "butwal-petroleum",
      location: "Traffic Chowk, Butwal",
      dealerCode: "BTW-DEALER-4491",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "6_MONTHS",
      annualFeeNpr: 21000,
      lastPaymentDateBS: "2082-11-15",
      nextRenewalDateBS: "2083-05-15",
      daysRemaining: 7,
      paymentMode: "FONEPAY_CORP_QR",
      status: "EXPIRING_SOON",
      contactPerson: "Deepak Shrestha",
      phone: "9857022194",
    },
    {
      id: "st-6",
      stationName: "Lumbini Energy Links",
      slug: "lumbini-energy",
      location: "Bhairahawa Airport Road",
      dealerCode: "BHA-DEALER-2109",
      planName: "Forecourt Starter",
      monthlyRateNpr: 1500,
      duration: "12_MONTHS",
      annualFeeNpr: 15000,
      lastPaymentDateBS: "2082-09-01",
      nextRenewalDateBS: "2083-09-01",
      daysRemaining: 115,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Santosh Yadav",
      phone: "9847012941",
    },
    {
      id: "st-7",
      stationName: "Itahari Express Fuel Center",
      slug: "itahari-express",
      location: "Main Highway, Itahari",
      dealerCode: "ITH-DEALER-7712",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-10-10",
      nextRenewalDateBS: "2083-10-10",
      daysRemaining: 154,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Binod Basnet",
      phone: "9852033910",
    },
    {
      id: "st-8",
      stationName: "Biratnagar Industrial Fuel Hub",
      slug: "biratnagar-fuel",
      location: "Rani Mill Area, Biratnagar",
      dealerCode: "BRT-DEALER-9011",
      planName: "Petroleum Group Enterprise",
      monthlyRateNpr: 7500,
      duration: "3_YEARS",
      annualFeeNpr: 200000,
      lastPaymentDateBS: "2082-08-20",
      nextRenewalDateBS: "2085-08-20",
      daysRemaining: 760,
      paymentMode: "BANK_CHEQUE",
      status: "ACTIVE",
      contactPerson: "Pramod Agrawal",
      phone: "9852044812",
    },
    {
      id: "st-9",
      stationName: "Nepalgunj Highway Petroleum",
      slug: "nepalgunj-highway",
      location: "Surkhet Road, Nepalgunj",
      dealerCode: "NPJ-DEALER-6022",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "3_MONTHS",
      annualFeeNpr: 10500,
      lastPaymentDateBS: "2082-02-12",
      nextRenewalDateBS: "2083-05-12",
      daysRemaining: 4,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "EXPIRING_SOON",
      contactPerson: "Mohammad Arif",
      phone: "9858022901",
    },
    {
      id: "st-10",
      stationName: "Dhangadhi Western Fuel Center",
      slug: "dhangadhi-fuel",
      location: "Chauraha, Dhangadhi",
      dealerCode: "DHG-DEALER-5102",
      planName: "Forecourt Starter",
      monthlyRateNpr: 1500,
      duration: "12_MONTHS",
      annualFeeNpr: 15000,
      lastPaymentDateBS: "2082-11-01",
      nextRenewalDateBS: "2083-11-01",
      daysRemaining: 175,
      paymentMode: "FONEPAY_CORP_QR",
      status: "ACTIVE",
      contactPerson: "Ganesh Bhatt",
      phone: "9858421098",
    },
    {
      id: "st-11",
      stationName: "Hetauda Commercial Petroleum",
      slug: "hetauda-commercial",
      location: "Industrial District, Hetauda",
      dealerCode: "HTD-DEALER-4410",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-07-01",
      nextRenewalDateBS: "2083-07-01",
      daysRemaining: 54,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Hari Shrestha",
      phone: "9855067210",
    },
    {
      id: "st-12",
      stationName: "Janakpur Dham Fuel Center",
      slug: "janakpur-fuel",
      location: "Bhanu Chowk, Janakpur",
      dealerCode: "JNK-DEALER-3011",
      planName: "Forecourt Starter",
      monthlyRateNpr: 1500,
      duration: "6_MONTHS",
      annualFeeNpr: 9000,
      lastPaymentDateBS: "2082-11-15",
      nextRenewalDateBS: "2083-05-15",
      daysRemaining: 7,
      paymentMode: "CASH",
      status: "ACTIVE",
      contactPerson: "Rameshwar Shah",
      phone: "9854021944",
    },
    {
      id: "st-13",
      stationName: "Dharan Hills Energy Center",
      slug: "dharan-hills",
      location: "Bhanu Chowk, Dharan",
      dealerCode: "DHN-DEALER-7890",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-09-20",
      nextRenewalDateBS: "2083-09-20",
      daysRemaining: 134,
      paymentMode: "FONEPAY_CORP_QR",
      status: "ACTIVE",
      contactPerson: "Subash Rai",
      phone: "9852089100",
    },
    {
      id: "st-14",
      stationName: "Surkhet Valley Fuel Hub",
      slug: "surkhet-valley",
      location: "Birendranagar, Surkhet",
      dealerCode: "SKT-DEALER-1109",
      planName: "Forecourt Starter",
      monthlyRateNpr: 1500,
      duration: "1_MONTH",
      annualFeeNpr: 1500,
      lastPaymentDateBS: "2083-04-10",
      nextRenewalDateBS: "2083-05-10",
      daysRemaining: 2,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "EXPIRING_SOON",
      contactPerson: "Kamal Rawal",
      phone: "9858055210",
    },
    {
      id: "st-15",
      stationName: "Banepa Valley Petroleum",
      slug: "banepa-valley",
      location: "Araniko Highway, Banepa",
      dealerCode: "BNP-DEALER-4402",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-06-25",
      nextRenewalDateBS: "2083-06-25",
      daysRemaining: 48,
      paymentMode: "FONEPAY_CORP_QR",
      status: "ACTIVE",
      contactPerson: "Rabin Karmacharya",
      phone: "9851088421",
    },
    {
      id: "st-16",
      stationName: "Bhaktapur Heritage Fuel Center",
      slug: "bhaktapur-fuel",
      location: "Sallaghari, Bhaktapur",
      dealerCode: "BKT-DEALER-3399",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-07-10",
      nextRenewalDateBS: "2083-07-10",
      daysRemaining: 63,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Govinda Prajapati",
      phone: "9851076120",
    },
    {
      id: "st-17",
      stationName: "Lalitpur Auto Energy",
      slug: "lalitpur-auto",
      location: "Satdobato, Lalitpur",
      dealerCode: "LLT-DEALER-9912",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-06-18",
      nextRenewalDateBS: "2083-06-18",
      daysRemaining: 41,
      paymentMode: "FONEPAY_CORP_QR",
      status: "ACTIVE",
      contactPerson: "Birendra Maharjan",
      phone: "9851044190",
    },
    {
      id: "st-18",
      stationName: "Baglung Highway Petroleum",
      slug: "baglung-highway",
      location: "Mid-Hill Highway, Baglung",
      dealerCode: "BGL-DEALER-1002",
      planName: "Forecourt Starter",
      monthlyRateNpr: 1500,
      duration: "9_MONTHS",
      annualFeeNpr: 12825,
      lastPaymentDateBS: "2082-08-01",
      nextRenewalDateBS: "2083-05-01",
      daysRemaining: 3,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "EXPIRING_SOON",
      contactPerson: "Narayan Sharma",
      phone: "9857620194",
    },
    {
      id: "st-19",
      stationName: "Ghorahi Energy Hub",
      slug: "ghorahi-energy",
      location: "Main Road, Ghorahi Dang",
      dealerCode: "DNG-DEALER-5511",
      planName: "Forecourt Starter",
      monthlyRateNpr: 1500,
      duration: "12_MONTHS",
      annualFeeNpr: 15000,
      lastPaymentDateBS: "2082-11-15",
      nextRenewalDateBS: "2083-11-15",
      daysRemaining: 189,
      paymentMode: "FONEPAY_CORP_QR",
      status: "ACTIVE",
      contactPerson: "Dilli Raj Chaudhary",
      phone: "9857821940",
    },
    {
      id: "st-20",
      stationName: "Birtamode Commercial Fuel",
      slug: "birtamode-fuel",
      location: "East-West Highway, Jhapa",
      dealerCode: "JHP-DEALER-8820",
      planName: "Station Pro + IRD Sync",
      monthlyRateNpr: 3500,
      duration: "12_MONTHS",
      annualFeeNpr: 35000,
      lastPaymentDateBS: "2082-07-01",
      nextRenewalDateBS: "2083-07-01",
      daysRemaining: 54,
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "ACTIVE",
      contactPerson: "Umesh Agrawal",
      phone: "9852640192",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [invoicingStation, setInvoicingStation] = useState<StationBillingRecord | null>(null);
  const [renewingStation, setRenewingStation] = useState<StationBillingRecord | null>(null);
  const [renewDuration, setRenewDuration] = useState<SubscriptionDuration>("12_MONTHS");
  const [renewPaymentMode, setRenewPaymentMode] = useState<string>("NABIL_BANK_TRANSFER");
  const [renewRefCode, setRenewRefCode] = useState("");
  const [renewSuccess, setRenewSuccess] = useState<string | null>(null);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (planFilter !== "ALL" && s.planName !== planFilter) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.stationName.toLowerCase().includes(q);
        const matchLoc = s.location.toLowerCase().includes(q);
        const matchCode = s.dealerCode.toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchCode) return false;
      }
      return true;
    });
  }, [stations, planFilter, statusFilter, searchQuery]);

  const financialSummary = useMemo(() => {
    const totalARR = stations.reduce((sum, s) => sum + s.annualFeeNpr, 0);
    const totalMRR = Math.round(totalARR / 12);
    const expiringCount = stations.filter((s) => s.status === "EXPIRING_SOON").length;
    const activeCount = stations.filter((s) => s.status === "ACTIVE").length;
    return {
      totalARR,
      totalMRR,
      totalCount: stations.length,
      activeCount,
      expiringCount,
    };
  }, [stations]);

  const renewalQuote = useMemo(() => {
    if (!renewingStation) return null;
    return calculatePackagePrice(renewingStation.monthlyRateNpr, renewDuration);
  }, [renewingStation, renewDuration]);

  const handleConfirmRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingStation || !renewalQuote) return;

    const termOption = SUBSCRIPTION_DURATIONS.find((d) => d.id === renewDuration)!;
    const daysToAdd = termOption.months * 30;

    setStations((prev) =>
      prev.map((s) =>
        s.id === renewingStation.id
          ? {
              ...s,
              duration: renewDuration,
              annualFeeNpr: renewalQuote.grossPayable,
              lastPaymentDateBS: "2083-05-08",
              nextRenewalDateBS: `2083+${termOption.months}M`,
              daysRemaining: daysToAdd,
              status: "ACTIVE",
              paymentMode: renewPaymentMode as any,
            }
          : s
      )
    );

    setRenewSuccess(
      `Station "${renewingStation.stationName}" subscription extended for ${termOption.label} (${fmtRs(renewalQuote.grossPayable)}).`
    );
    setRenewingStation(null);
    setRenewRefCode("");
    setTimeout(() => setRenewSuccess(null), 4000);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Station Name",
      "Station Code",
      "Location",
      "Dealer Code",
      "SaaS Plan Tier",
      "Package Term",
      "Fee (NPR)",
      "Last Paid (BS)",
      "Next Renewal (BS)",
      "Days Remaining",
      "Payment Mode",
      "Status",
      "Contact Person",
      "Phone",
    ];

    const rows = filteredStations.map((s) => [
      `"${s.stationName}"`,
      `"${s.slug}"`,
      `"${s.location}"`,
      `"${s.dealerCode}"`,
      `"${s.planName}"`,
      `"${s.duration}"`,
      `"${s.annualFeeNpr}"`,
      `"${s.lastPaymentDateBS}"`,
      `"${s.nextRenewalDateBS}"`,
      `"${s.daysRemaining}"`,
      `"${s.paymentMode}"`,
      `"${s.status}"`,
      `"${s.contactPerson}"`,
      `"${s.phone}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `multi_tenant_saas_billing_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <CreditCard size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Multi-Tenant SaaS Billing & Subscriptions (पम्प ग्राहक बिलिङ तथा सदस्यता खाता)
            </h2>
            <p className="text-[12px] text-text-muted">
              Flexible subscription terms (1M, 3M, 6M, 9M, 12M, 3Y), automated VAT invoicing, and renewal collections across 20 petrol pumps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export Billing CSV
          </GhostButton>
        </div>
      </div>

      {renewSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {renewSuccess}
        </div>
      )}

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Annual Recurring Revenue (ARR)"
          value={fmtRs(financialSummary.totalARR)}
          icon={DollarSign}
          tone="accent"
        />
        <StatCard
          label="Monthly Recurring Revenue (MRR)"
          value={fmtRs(financialSummary.totalMRR)}
          icon={TrendingUp}
          tone="text"
        />
        <StatCard
          label="Active Petrol Pump Tenants"
          value={`${financialSummary.activeCount} / ${financialSummary.totalCount} Active`}
          icon={Building2}
          tone="success"
        />
        <StatCard
          label="Expiring Licenses (< 30 Days)"
          value={`${financialSummary.expiringCount} Pumps Due`}
          icon={AlertTriangle}
          tone={financialSummary.expiringCount > 0 ? "error" : "success"}
          small
        />
      </div>

      {/* Expiring Soon Alert Banner */}
      {financialSummary.expiringCount > 0 && (
        <div className="animate-fade-in flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/8 p-4 text-[12.5px] text-text">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <div className="space-y-1 flex-1">
            <div className="font-bold text-text text-[13.5px]">
              {financialSummary.expiringCount} Petrol Pump Subscriptions Expiring Soon
            </div>
            <div className="text-text-muted">
              The following pumps are due for renewal:{" "}
              <strong>
                {stations
                  .filter((s) => s.status === "EXPIRING_SOON")
                  .map((s) => `${s.stationName} (${s.daysRemaining} days left)`)
                  .join(" · ")}
              </strong>
              . Send renewal notice or extend package.
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search 20 Stations by name, city (e.g. Pokhara, Birgunj), or Dealer Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={13} /> Plan:
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All SaaS Plans</option>
            <option value="Forecourt Starter">Starter (Rs 1,500/mo)</option>
            <option value="Station Pro + IRD Sync">Pro + IRD (Rs 3,500/mo)</option>
            <option value="Petroleum Group Enterprise">Enterprise (Rs 7,500/mo)</option>
          </select>

          <div className="flex items-center gap-1.5 text-text-muted ml-2">
            Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* 20 Stations Billing Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[940px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">PETROL PUMP TENANT</th>
                <th className="px-3 py-3.5">LOCATION / CITY</th>
                <th className="px-3 py-3.5">PACKAGE TERM</th>
                <th className="px-3 py-3.5 text-right font-bold">PACKAGE FEE</th>
                <th className="px-3 py-3.5 text-center">STATUS</th>
                <th className="px-4 py-3.5 text-right">RENEWAL DUE (BS)</th>
                <th className="px-4 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted font-body">
                    No station billing records found.
                  </td>
                </tr>
              ) : (
                filteredStations.map((s) => {
                  const durationObj = SUBSCRIPTION_DURATIONS.find((d) => d.id === s.duration);
                  return (
                    <tr key={s.id} className="hover:bg-surface-hi/40 transition-colors">
                      <td className="px-4 py-3.5 font-body">
                        <div className="font-bold text-[13.5px] text-text">{s.stationName}</div>
                        <div className="font-mono text-[11px] text-text-muted flex items-center gap-1.5">
                          <span className="text-accent font-semibold">{s.dealerCode}</span>
                          <span>·</span>
                          <span>{s.contactPerson} ({s.phone})</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 font-body text-text-muted text-[12px]">
                        {s.location}
                      </td>

                      <td className="px-3 py-3.5 font-body">
                        <div className="font-medium text-text text-[12px]">{s.planName}</div>
                        <div className="text-[11px] text-accent font-semibold">
                          {durationObj?.label || "12 Months"}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right font-bold text-[13.5px] text-accent">
                        {fmtRs(s.annualFeeNpr)}
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        {s.status === "ACTIVE" ? (
                          <Badge tone="success">ACTIVE</Badge>
                        ) : (
                          <Badge tone="error">EXPIRING ({s.daysRemaining}D)</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right text-text-muted text-[12px]">
                        <div className="font-semibold text-text">{s.nextRenewalDateBS}</div>
                        <div className="text-[10.5px] text-text-muted">
                          {s.daysRemaining} days remaining
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-body">
                        <div className="flex items-center justify-end gap-1.5">
                          <GhostButton
                            type="button"
                            onClick={() => setInvoicingStation(s)}
                            className="px-2 py-1 text-[11.5px]"
                            title="Generate SaaS VAT Invoice"
                          >
                            <Receipt size={13} /> Invoice
                          </GhostButton>

                          <PrimaryButton
                            type="button"
                            onClick={() => {
                              setRenewingStation(s);
                              setRenewDuration(s.duration);
                            }}
                            className="px-2.5 py-1 text-[11.5px]"
                          >
                            <RefreshCw size={12} /> Renew
                          </PrimaryButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: SaaS VAT Tax Invoice Generator */}
      {invoicingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Tax Invoice: {invoicingStation.stationName}
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    SaaS Subscription · IRD Annexure 5 Format
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoicingStation(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[12.5px]">
              {/* Printable Invoice Ticket */}
              <div className="print-area rounded-xl border border-border bg-bg p-4 space-y-3">
                <div className="text-center border-b border-dashed border-border pb-2.5">
                  <div className="font-display text-[15px] font-bold text-text">
                    PETRO CLOUD TECHNOLOGIES PVT. LTD.
                  </div>
                  <div className="text-[11px] text-text-muted">Kathmandu, Nepal · PAN: 609182391</div>
                  <div className="font-bold text-accent text-[12.5px] mt-1">
                    TAX INVOICE (कर बिजक)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div>
                    <span className="text-text-muted block">Billed To (Client Station):</span>
                    <strong className="text-text">{invoicingStation.stationName}</strong>
                    <div className="text-text-muted">{invoicingStation.location}</div>
                  </div>
                  <div>
                    <span className="text-text-muted block">Invoice #:</span>
                    <span className="font-mono font-bold text-accent">INV-2083-0941</span>
                    <span className="text-text-muted block mt-1">Dealer Code: {invoicingStation.dealerCode}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-border pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">
                      {invoicingStation.planName} ({SUBSCRIPTION_DURATIONS.find((d) => d.id === invoicingStation.duration)?.label || "12 Months"} License):
                    </span>
                    <span className="font-data font-medium">Rs {(invoicingStation.annualFeeNpr / 1.13).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">13% Value Added Tax (VAT):</span>
                    <span className="font-data font-medium">Rs {(invoicingStation.annualFeeNpr - invoicingStation.annualFeeNpr / 1.13).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-bold text-[14px]">
                    <span className="text-accent">Gross Total Amount:</span>
                    <span className="font-data text-accent">{fmtRs(invoicingStation.annualFeeNpr)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border bg-surface-hi px-5 py-3.5">
              <GhostButton onClick={handlePrintInvoice} className="text-[12.5px]">
                <Printer size={14} /> Print Tax Invoice
              </GhostButton>
              <GhostButton onClick={() => setInvoicingStation(null)} className="text-[12.5px]">
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Record License Renewal & Package Term Selector */}
      {renewingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleConfirmRenewal}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <RefreshCw size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Renew & Extend Subscription Package
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    {renewingStation.stationName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRenewingStation(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[12.5px]">
              {/* Package Term Chips (1M, 3M, 6M, 9M, 12M, 3Y) */}
              <div>
                <label className="text-[12px] font-bold text-text block mb-1.5">
                  Select Renewal Duration (प्याकेज अवधि):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBSCRIPTION_DURATIONS.map((dur) => {
                    const isSelected = renewDuration === dur.id;
                    return (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setRenewDuration(dur.id)}
                        className={clsx(
                          "rounded-xl border p-2 text-center text-[11.5px] font-semibold transition-all cursor-pointer",
                          isSelected
                            ? "border-accent bg-accent text-[#1A1306] font-bold shadow-2xs"
                            : "border-border bg-bg text-text hover:bg-surface-hi"
                        )}
                      >
                        <div>{dur.label}</div>
                        {dur.discountPercent > 0 && (
                          <div
                            className={clsx(
                              "text-[9.5px]",
                              isSelected ? "text-black/80 font-extrabold" : "text-success"
                            )}
                          >
                            {dur.discountPercent}% OFF
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Box */}
              {renewalQuote && (
                <div className="rounded-xl border border-accent/30 bg-accent/8 p-3.5 space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] text-text font-semibold">
                      {renewingStation.planName} ({renewalQuote.months} Months)
                    </span>
                    <span className="font-data font-bold text-accent text-[15px]">
                      {fmtRs(renewalQuote.grossPayable)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-text-muted pt-1 border-t border-border/60">
                    <span>Effective Monthly:</span>
                    <span className="font-data text-text font-medium">
                      {fmtRs(renewalQuote.monthlyEffective)}/mo
                    </span>
                  </div>

                  {renewalQuote.discountAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-success">
                      <span>Term Discount ({renewalQuote.discountPercent}%):</span>
                      <span className="font-data">-{fmtRs(renewalQuote.discountAmount)}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-text-muted text-right">
                    Includes 13% Nepal VAT ({fmtRs(renewalQuote.vatAmount)})
                  </div>
                </div>
              )}

              {/* Payment Mode Selector */}
              <div>
                <label className="text-[12px] font-medium text-text-muted block mb-1">
                  Payment Collection Mode
                </label>
                <select
                  value={renewPaymentMode}
                  onChange={(e) => setRenewPaymentMode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text font-medium"
                >
                  <option value="NABIL_BANK_TRANSFER">Nabil Bank Corporate Wire Transfer</option>
                  <option value="FONEPAY_CORP_QR">Fonepay Corporate QR Payment</option>
                  <option value="BANK_CHEQUE">Bank Clearance Cheque</option>
                  <option value="CASH">Direct Cash Collection</option>
                </select>
              </div>

              <Field label="Bank Voucher / Cheque / Trace Ref" htmlFor="renewRef">
                <Input
                  id="renewRef"
                  value={renewRefCode}
                  onChange={(e) => setRenewRefCode(e.target.value)}
                  placeholder="e.g. NABIL-VOUCHER-984102 / FP-77219"
                  required
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-hi px-5 py-3.5">
              <GhostButton type="button" onClick={() => setRenewingStation(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Confirm Renewal & Extend License
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
