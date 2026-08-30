"use client";

import { useState } from "react";
import {
  UserCog,
  Shield,
  KeyRound,
  CheckCircle2,
  Building2,
  Calendar,
  Lock,
  Globe,
  Save,
  Clock,
  Laptop,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export function UserProfileView({
  userName = "Jay Prakash Yadav",
  userRole = "OWNER",
}: {
  userName?: string;
  userRole?: string;
}) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState("jyprakash2021@gmail.com");
  const [phone, setPhone] = useState("+977-9851023941");
  const [pin, setPin] = useState("4091");
  
  // Password state
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preference state
  const [preferredCalendar, setPreferredCalendar] = useState("BS");
  const [preferredLang, setPreferredLang] = useState("EN");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <UserCog size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              User Profile & Security (प्रयोगकर्ता प्रोफाइल र सुरक्षा)
            </h2>
            <p className="text-[12px] text-text-muted">
              Account credentials, authorization PIN, calendar preferences, and security sessions.
            </p>
          </div>
        </div>

        <PrimaryButton type="submit" className="text-[13px] px-4 py-2">
          <Save size={15} /> Save Profile
        </PrimaryButton>
      </div>

      {savedSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[13px] text-success font-medium">
          <CheckCircle2 size={16} /> Profile settings and security preferences updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Account Profile Details */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-accent" />
              <h3 className="font-display text-[15px] font-bold text-text">
                Account Details
              </h3>
            </div>
            <Badge tone="accent">STATION OPERATOR</Badge>
          </div>

          <Field label="Full Name" htmlFor="profName">
            <Input
              id="profName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Contact Email" htmlFor="profEmail">
            <Input
              id="profEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Mobile Number" htmlFor="profPhone">
            <Input
              id="profPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Field>

          <Field label="4-Digit Quick Authorization PIN" htmlFor="profPin">
            <Input
              id="profPin"
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
            />
          </Field>
        </div>

        {/* 2. Password & Security Credentials */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <KeyRound size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Change Account Password
            </h3>
          </div>

          <Field label="Current Password" htmlFor="currPass">
            <Input
              id="currPass"
              type="password"
              value={currPassword}
              onChange={(e) => setCurrPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Field label="New Password" htmlFor="newPass">
            <Input
              id="newPass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {/* Localization Preferences */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="font-semibold text-[13px] text-text">
              Display & Calendar Localization
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11.5px] text-text-muted block mb-1">
                  Primary Calendar:
                </label>
                <select
                  value={preferredCalendar}
                  onChange={(e) => setPreferredCalendar(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text font-medium"
                >
                  <option value="BS">Bikram Sambat (BS २०८३)</option>
                  <option value="AD">Gregorian (AD 2026)</option>
                </select>
              </div>

              <div>
                <label className="text-[11.5px] text-text-muted block mb-1">
                  UI Language:
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text font-medium"
                >
                  <option value="EN">English (US)</option>
                  <option value="NE">नेपाली (Nepali)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Assigned Station Information */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Assigned Petrol Pump
            </h3>
          </div>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Station Legal Name:</span>
              <strong className="text-text">Shree Pashupati Petroleum Center</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Dealership Code:</span>
              <span className="font-mono text-accent font-bold">KTM-DEALER-4091</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">PAN / VAT:</span>
              <span className="font-mono text-text font-bold">301928491</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Assigned Forecourt Bays:</span>
              <span className="text-text">4 Active Islands / 8 Nozzles</span>
            </div>
          </div>
        </div>

        {/* 4. Active Security Sessions */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Laptop size={18} className="text-success" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Current Active Session
            </h3>
          </div>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg p-2.5">
              <div>
                <div className="font-semibold text-text">Station Counter POS (This Device)</div>
                <div className="text-[11px] text-text-muted">Windows 11 · Next.js Local Server</div>
              </div>
              <Badge tone="success">CURRENT ACTIVE</Badge>
            </div>
            <div className="flex justify-between text-[11.5px] text-text-muted pt-1">
              <span>Session Authenticated: Today 08:30 AM</span>
              <span>IP: 127.0.0.1 (Local Forecourt LAN)</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
