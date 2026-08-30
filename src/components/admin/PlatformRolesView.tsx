"use client";

import { Shield, ShieldAlert, Key, Check, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

export function PlatformRolesView() {
  const roles = [
    {
      id: "super_admin",
      name: "Platform Super Admin",
      nepali: "सर्वोच्च प्लेटफर्म एडमिन",
      description: "Full unconstrained control across all multi-tenant stations, billing overrides, database operations, and operator provisioning.",
      operatorCount: 1,
      permissions: [
        "Provision and suspend station tenants",
        "Override fuel pricing and subscription terms",
        "Direct database snapshot export & cluster failover",
        "Provision and revoke platform operator staff",
        "View nationwide IRD sync telemetry & audit trails",
      ],
    },
    {
      id: "billing_operator",
      name: "Billing & Revenue Operator",
      nepali: "बिलिङ तथा राजस्व अधिकृत",
      description: "Handles station subscription renewals, VAT tax invoices, gateway reconciliation, and payment collections.",
      operatorCount: 1,
      permissions: [
        "Generate and print SaaS VAT Invoices",
        "Record bank transfer and Fonepay QR payments",
        "Extend tenant subscription validity",
        "Export financial ledgers for revenue audits",
      ],
    },
    {
      id: "support_engineer",
      name: "Support & Field Engineer",
      nepali: "प्राविधिक सहयोग इन्जिनियर",
      description: "Assists stations with forecourt automation controller links, thermal printers, and dispenser calibrations.",
      operatorCount: 1,
      permissions: [
        "Inspect station health and sync queues",
        "Debug pump dispenser island communication",
        "Send operational notices to station dashboards",
      ],
    },
    {
      id: "security_auditor",
      name: "Security & Compliance Auditor",
      nepali: "सुरक्षा तथा अनुपालन लेखापरीक्षक",
      description: "Read-only access to immutable audit trails, IRD CBMS tax gateway verification, and regulatory logs.",
      operatorCount: 1,
      permissions: [
        "View immutable security audit log",
        "Verify IRD electronic billing timestamps",
        "Export compliance dossiers for IRD tax officers",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <ShieldAlert size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Global Permission Roles & RBAC Matrix (भूमिका तथा अधिकार म्याट्रिक्स)
            </h2>
            <p className="text-[12px] text-text-muted">
              Role-Based Access Control (RBAC) tiers governing platform headquarters personnel.
            </p>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {roles.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="font-display text-[16px] font-bold text-text">{r.name}</h3>
                <div className="text-[11.5px] text-accent font-medium mt-0.5">{r.nepali}</div>
              </div>
              <Badge tone="accent">{r.operatorCount} Active Staff</Badge>
            </div>

            <p className="text-[12.5px] text-text-muted leading-relaxed">
              {r.description}
            </p>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Granted System Capabilities:
              </div>
              {r.permissions.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-text">
                  <Check size={14} className="text-success shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
