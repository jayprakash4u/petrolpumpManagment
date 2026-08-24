"use client";

import { useState } from "react";
import {
  ScrollText,
  PlusCircle,
  Search,
  CheckCircle2,
  Printer,
  Eye,
  Receipt,
} from "lucide-react";
import { type CreditDebitNote } from "@/lib/accounts";
import {
  getCreditDebitNotes,
  createCreditDebitNote,
  getLedgerHeads,
} from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function NotesView({
  userName = "Station Manager",
}: {
  userName?: string;
}) {
  const [notes, setNotes] = useState<CreditDebitNote[]>(() => getCreditDebitNotes());
  const [ledgers] = useState(() => getLedgerHeads());
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CreditDebitNote | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [noteType, setNoteType] = useState<"DEBIT_NOTE" | "CREDIT_NOTE">("DEBIT_NOTE");
  const [dateBS, setDateBS] = useState("2083-05-08");
  const [partyName, setPartyName] = useState("");
  const [partyLedgerId, setPartyLedgerId] = useState(ledgers[0]?.id || "");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");

  const refreshData = () => {
    setNotes(getCreditDebitNotes());
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const created = createCreditDebitNote({
      type: noteType,
      dateBS,
      partyName: partyName.trim(),
      partyLedgerId,
      reason: reason.trim() || "Account adjustment note",
      amountNpr: parsedAmount,
      invoiceRef: invoiceRef.trim() || "N/A",
      issuedByName: userName,
    });

    setNotification(`Note ${created.noteNo} created successfully.`);
    setIsModalOpen(false);
    setPartyName("");
    setAmount("");
    setReason("");
    setInvoiceRef("");
    refreshData();
  };

  const filtered = notes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = n.noteNo.toLowerCase().includes(q);
      const matchParty = n.partyName.toLowerCase().includes(q);
      const matchReason = n.reason.toLowerCase().includes(q);
      const matchInv = n.invoiceRef.toLowerCase().includes(q);
      if (!matchNo && !matchParty && !matchReason && !matchInv) return false;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ScrollText size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Credit & Debit Notes Register</h3>
            <p className="text-[12.5px] text-text-muted">
              Issue and track debit notes against supplier returns and credit notes for customer bill revisions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Notes
          </GhostButton>
          <PrimaryButton onClick={() => setIsModalOpen(true)} className="py-2 text-[12.5px]">
            <PlusCircle size={14} /> Issue Note
          </PrimaryButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note #, party name, or invoice..."
            className="pl-8 text-[12.5px]"
          />
        </div>
        <span className="font-data text-[12.5px] text-text-muted">{filtered.length} Note(s) Recorded</span>
      </div>

      {/* Notes Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3">Note #</th>
                <th className="p-3">Type</th>
                <th className="p-3">Date (BS)</th>
                <th className="p-3">Party Name & Invoice</th>
                <th className="p-3">Reason / Particulars</th>
                <th className="p-3 text-right">Amount (NPR)</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((note) => (
                <tr key={note.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{note.noteNo}</td>
                  <td className="p-3 whitespace-nowrap">
                    <Badge tone={note.type === "DEBIT_NOTE" ? "accent" : "muted"}>
                      {note.type === "DEBIT_NOTE" ? "DEBIT NOTE" : "CREDIT NOTE"}
                    </Badge>
                  </td>
                  <td className="p-3 font-data whitespace-nowrap text-text-muted">{note.dateBS}</td>
                  <td className="p-3">
                    <div className="font-semibold text-text">{note.partyName}</div>
                    <div className="font-data text-[11px] text-text-muted">Inv Ref: {note.invoiceRef}</div>
                  </td>
                  <td className="p-3 text-text-muted">{note.reason}</td>
                  <td className="p-3 font-data text-right font-bold text-accent text-[13.5px] whitespace-nowrap">
                    {fmtRs(note.amountNpr)}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <GhostButton
                      onClick={() => setSelectedNote(note)}
                      className="py-1 px-2.5 text-[11.5px]"
                    >
                      <Eye size={13} /> View Slip
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <PlusCircle size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Issue Credit / Debit Note</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="mt-4 space-y-3.5 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Note Type *" htmlFor="nType">
                  <Select
                    id="nType"
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                  >
                    <option value="DEBIT_NOTE">Debit Note (Against Supplier)</option>
                    <option value="CREDIT_NOTE">Credit Note (To Customer)</option>
                  </Select>
                </Field>

                <Field label="Date (BS) *" htmlFor="nDate">
                  <Input
                    id="nDate"
                    value={dateBS}
                    onChange={(e) => setDateBS(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field label="Party Name *" htmlFor="nParty">
                <Input
                  id="nParty"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Nepal Lubricants Pvt Ltd or KMC Fleet"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (NPR) *" htmlFor="nAmount">
                  <Input
                    id="nAmount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 14500"
                    required
                  />
                </Field>

                <Field label="Original Invoice Ref #" htmlFor="nInv">
                  <Input
                    id="nInv"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="e.g. NL-INV-9901"
                  />
                </Field>
              </div>

              <div>
                <label htmlFor="nReason" className="mb-1 block text-[12.5px] font-medium text-text-muted">
                  Reason for Adjustment <span className="text-error">*</span>
                </label>
                <textarea
                  id="nReason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Damaged goods returned or billing correction..."
                  className="w-full rounded-lg border border-border bg-bg p-2.5 font-data text-[13px] text-text"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsModalOpen(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" className="py-2 text-[13px]">
                  Issue Note
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Slip Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="border-b border-border pb-4 text-center">
              <h3 className="font-display text-[18px] font-bold text-text">Shree Petroleum</h3>
              <div className="text-[11.5px] text-text-muted">Kathmandu, Nepal · PAN/VAT: 601928374</div>
              <div className="mt-2 font-display text-[13.5px] font-semibold text-accent uppercase tracking-wider">
                {selectedNote.type.replace(/_/g, " ")} — {selectedNote.noteNo}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-border py-3 text-[12px]">
              <div>
                <span className="text-text-muted">Party Name:</span>
                <div className="font-bold text-text">{selectedNote.partyName}</div>
              </div>
              <div>
                <span className="text-text-muted">Date (BS):</span>
                <div className="font-bold text-text">{selectedNote.dateBS}</div>
              </div>
              <div>
                <span className="text-text-muted">Invoice Ref:</span>
                <div className="font-data text-text">{selectedNote.invoiceRef}</div>
              </div>
              <div>
                <span className="text-text-muted">Issued By:</span>
                <div className="font-text text-text">{selectedNote.issuedByName}</div>
              </div>
            </div>

            <div className="py-3 text-[12.5px] space-y-2">
              <div className="rounded-xl border border-border bg-bg p-3">
                <span className="text-[11px] text-text-muted block">Reason / Details:</span>
                <p className="mt-0.5 text-text italic">"{selectedNote.reason}"</p>
              </div>

              <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 flex justify-between items-center text-[13.5px]">
                <strong className="text-text">Total Adjusted Amount:</strong>
                <span className="font-data font-bold text-accent text-[16px]">{fmtRs(selectedNote.amountNpr)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11px] text-text-muted border-t border-border mt-4">
              <div className="border-t border-dashed border-border pt-1">Authorized Signatory</div>
              <div className="border-t border-dashed border-border pt-1">Receiver Sign & Stamp</div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
              <GhostButton onClick={() => setSelectedNote(null)}>Close</GhostButton>
              <GhostButton onClick={handlePrint} className="text-[12.5px]">
                <Printer size={14} /> Print Note
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
