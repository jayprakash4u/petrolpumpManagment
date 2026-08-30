"use client";

import { useState } from "react";
import {
  LifeBuoy,
  BookOpen,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Headphones,
  ShieldAlert,
  Fuel,
  CreditCard,
  Gauge,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export function HelpSupportView() {
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketPriority, setTicketPriority] = useState("MEDIUM");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      category: "Fleet Billing",
      question: "How do I bill a vehicle to a corporate customer's credit account (खाता)?",
      answer:
        "When recording a new sale on the New Sale screen, select 'Credit' under Payment Mode. Choose the customer organization (e.g. Sajha Yatayat) and key in the vehicle license plate number (e.g. BA 2 KHA 1234). The system automatically tracks the vehicle's consumption and adds the invoice to the customer's outstanding balance.",
    },
    {
      id: "faq-2",
      category: "Tank Inventory",
      question: "What is the procedure for recording physical underground tank dip readings?",
      answer:
        "Insert the calibrated brass dip tape vertically into the tank riser pipe until it touches the datum strike plate. Read the fuel mark (in millimeters) and check the water bottom paste if applied. Go to Inventory → Tank Dips and enter the millimeter value. The system computes volume against the official tank calibration chart and flags any shift variances.",
    },
    {
      id: "faq-3",
      category: "Shift Closing",
      question: "How should pump attendants hand over shifts and reconcile cash?",
      answer:
        "At the end of each shift, record the closing totaliser meter reading for each dispenser nozzle under Pumps → Shift Close. The system multiplies volume sold by the unit rate to calculate expected cash. Compare this with physical cash and POS receipts to record any minor variance.",
    },
    {
      id: "faq-4",
      category: "System & Offline",
      question: "What happens if the internet connection or local power is disrupted?",
      answer:
        "The system runs with local offline caching on the forecourt counter terminal. Sales continue to be recorded, receipt slips can still be printed locally, and transactions are queued to sync with IRD CBMS servers automatically once internet connectivity resumes.",
    },
    {
      id: "faq-5",
      category: "Safety Protocol",
      question: "What is the emergency shutdown (E-Stop) protocol during a fuel spill?",
      answer:
        "Immediately hit the nearest red E-Stop button on the dispenser island or cashier booth. This cuts electrical power to all submersible turbine pumps (STPs). Evacuate vehicles from the bay, deploy dry chemical powder / foam extinguishers, and do not crank vehicle ignitions until cleared.",
    },
  ];

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    setTicketSuccess(true);
    setTicketSubject("");
    setTicketDesc("");
    setTimeout(() => setTicketSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <LifeBuoy size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Help & Operating Support (सहयोग तथा सञ्चालन निर्देशिका)
            </h2>
            <p className="text-[12px] text-text-muted">
              Station standard operating procedures (SOPs), attendant guides, emergency contacts, and 24/7 technical helpdesk.
            </p>
          </div>
        </div>
      </div>

      {ticketSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[13px] text-success font-medium">
          <CheckCircle2 size={16} /> Support ticket #TCK-4819 submitted. Our technician will respond within 15 minutes.
        </div>
      )}

      {/* Emergency & Helpline Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-accent">
            <Headphones size={18} />
            <span className="font-display font-bold text-[14px]">Software ERP Helpdesk</span>
          </div>
          <div className="font-mono font-bold text-text text-[15px]">+977-9851023941</div>
          <div className="text-[11.5px] text-text-muted">24/7 Technical Support & Dispatch</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-warning">
            <Fuel size={18} />
            <span className="font-display font-bold text-[14px]">NOC Regional Depot</span>
          </div>
          <div className="font-mono font-bold text-text text-[15px]">+977-1-4589211</div>
          <div className="text-[11.5px] text-text-muted">Thankot Fuel Depot Indent Desk</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-error">
            <ShieldAlert size={18} />
            <span className="font-display font-bold text-[14px]">NBSM Metrology Dept</span>
          </div>
          <div className="font-mono font-bold text-text text-[15px]">+977-1-4350123</div>
          <div className="text-[11.5px] text-text-muted">Pump Meter Stamping & Inspection</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Knowledge Base & FAQs (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BookOpen size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Station Operating Guidelines & FAQs
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-border bg-bg overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between p-3.5 text-left text-[13px] font-semibold text-text hover:bg-surface-hi transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone="accent">{faq.category}</Badge>
                      <span>{faq.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-text-muted shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-text-muted shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-surface p-3.5 text-[12.5px] text-text-muted leading-relaxed animate-fade-in font-body">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Support Request Form (1 col) */}
        <form onSubmit={handleSendTicket} className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Send size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Submit Technician Request
            </h3>
          </div>

          <Field label="Issue Subject" htmlFor="tickSubj">
            <Input
              id="tickSubj"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="e.g. Dispenser 02 Flowmeter Calibration"
              required
            />
          </Field>

          <div>
            <label className="text-[12.5px] text-text-muted font-medium block mb-1">
              Priority Level
            </label>
            <select
              value={ticketPriority}
              onChange={(e) => setTicketPriority(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg p-2 text-[12px] text-text"
            >
              <option value="LOW">Low (Routine Query)</option>
              <option value="MEDIUM">Medium (Minor Variance / Account Issue)</option>
              <option value="HIGH">High (Dispenser Bay Down / Hardware Issue)</option>
              <option value="CRITICAL">Critical (Station Halted / Emergency)</option>
            </select>
          </div>

          <div>
            <label className="text-[12.5px] text-text-muted font-medium block mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              placeholder="Describe the issue, dispenser nozzle affected, or error code..."
              className="w-full rounded-xl border border-border bg-bg p-2.5 text-[12.5px] text-text focus:outline-none focus:border-accent"
              required
            />
          </div>

          <PrimaryButton type="submit" className="w-full justify-center text-[12.5px]">
            <Send size={13} /> Submit Request
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
