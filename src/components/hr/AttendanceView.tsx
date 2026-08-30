"use client";

import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  PlusCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { Role } from "@/lib/permissions";
import {
  type AttendanceRecord,
  type LeaveRequest,
  type AttendanceStatus,
  type ShiftType,
  type LeaveType,
} from "@/lib/hr";
import {
  getAttendanceRecords,
  getLeaveRequests,
  markAttendance,
  submitLeaveRequest,
  updateLeaveStatus,
} from "@/lib/mock/hr";
import { ROLE_LABEL } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

const STATUS_TONES: Record<AttendanceStatus, Tone> = {
  PRESENT: "success",
  HALF_DAY: "accent",
  ON_LEAVE: "muted",
  ABSENT: "error",
};

const LEAVE_TONES: Record<LeaveRequest["status"], Tone> = {
  APPROVED: "success",
  PENDING: "accent",
  REJECTED: "error",
};

export function AttendanceView({
  currentUser,
}: {
  currentUser: { id: string; name: string; role: Role | string; username: string };
}) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getAttendanceRecords());
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => getLeaveRequests());
  const [notification, setNotification] = useState<string | null>(null);

  // Apply leave modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL");
  const [startDateBS, setStartDateBS] = useState("2083-05-15");
  const [endDateBS, setEndDateBS] = useState("2083-05-16");
  const [totalDays, setTotalDays] = useState("2");
  const [leaveReason, setLeaveReason] = useState("");

  // Manual check-in punch modal state
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchEmployeeName, setPunchEmployeeName] = useState("");
  const [punchShift, setPunchShift] = useState<ShiftType>("DAY");
  const [punchInTime, setPunchInTime] = useState("08:00 AM");
  const [punchOutTime, setPunchOutTime] = useState("04:00 PM");
  const [punchHours, setPunchHours] = useState("8");
  const [punchOvertime, setPunchOvertime] = useState("0");
  const [punchStatus, setPunchStatus] = useState<AttendanceStatus>("PRESENT");
  const [punchNotes, setPunchNotes] = useState("");

  const canManage = currentUser.role === "OWNER" || currentUser.role === "MANAGER";

  const refreshData = () => {
    setAttendance(getAttendanceRecords());
    setLeaves(getLeaveRequests());
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    submitLeaveRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      role: currentUser.role,
      leaveType,
      startDateBS,
      endDateBS,
      totalDays: parseInt(totalDays, 10) || 1,
      reason: leaveReason.trim(),
    });

    setNotification(`Leave request submitted for ${totalDays} day(s).`);
    setIsLeaveModalOpen(false);
    setLeaveReason("");
    refreshData();
  };

  const handleLeaveStatus = (leaveId: string, status: "APPROVED" | "REJECTED") => {
    const res = updateLeaveStatus(leaveId, status, `${currentUser.name} (${ROLE_LABEL[currentUser.role]})`);
    if (res.success) {
      setNotification(res.message);
      refreshData();
    }
  };

  const handleManualPunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchEmployeeName.trim()) return;

    markAttendance({
      dateBS: "2083-05-08",
      employeeId: `usr-${Date.now()}`,
      employeeName: punchEmployeeName.trim(),
      role: "ATTENDANT",
      shiftType: punchShift,
      checkIn: punchInTime,
      checkOut: punchOutTime,
      hoursWorked: parseFloat(punchHours) || 8,
      overtimeHours: parseFloat(punchOvertime) || 0,
      status: punchStatus,
      notes: punchNotes.trim() || undefined,
    });

    setNotification(`Attendance recorded for ${punchEmployeeName}.`);
    setIsPunchModalOpen(false);
    setPunchEmployeeName("");
    setPunchNotes("");
    refreshData();
  };

  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "HALF_DAY").length;
  const onLeaveCount = attendance.filter((a) => a.status === "ON_LEAVE").length;
  const totalOvertimeHours = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present on Shift Today" value={String(presentCount)} icon={UserCheck} tone="success" />
        <StatCard label="On Approved Leave" value={String(onLeaveCount)} icon={UserX} tone="text" />
        <StatCard label="Overtime Logged Today" value={`${totalOvertimeHours} hrs`} icon={Clock} tone="accent" />
        <StatCard label="Active Roster Size" value={String(attendance.length)} icon={CalendarCheck} tone="text" />
      </div>

      {/* Today's Attendance Table Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Daily Shift Attendance Register</h3>
            <span className="font-data text-[11.5px] text-text-muted">Today: Bhadra 08, 2083 BS</span>
          </div>

          <div className="flex items-center gap-2">
            <GhostButton onClick={() => setIsLeaveModalOpen(true)} className="text-[12.5px]">
              <Calendar size={14} /> Apply for Leave
            </GhostButton>
            {canManage && (
              <PrimaryButton onClick={() => setIsPunchModalOpen(true)} className="text-[12.5px] py-1.5">
                <PlusCircle size={14} /> Record Punch
              </PrimaryButton>
            )}
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Shift</th>
                  <th className="p-3">Check-In / Out</th>
                  <th className="p-3">Hours Logged</th>
                  <th className="p-3">Overtime</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="p-3 font-semibold text-text">
                      {rec.employeeName}
                      {rec.notes && <div className="text-[11px] font-normal text-text-muted italic">{rec.notes}</div>}
                    </td>
                    <td className="p-3 font-data text-text-muted">{ROLE_LABEL[rec.role]}</td>
                    <td className="p-3 font-data">
                      <span className="rounded bg-surface-hi px-2 py-0.5 text-[11px] font-medium text-text">
                        {rec.shiftType}
                      </span>
                    </td>
                    <td className="p-3 font-data text-text-muted whitespace-nowrap">
                      {rec.checkIn} — {rec.checkOut}
                    </td>
                    <td className="p-3 font-data font-bold text-text">{rec.hoursWorked} hrs</td>
                    <td className="p-3 font-data">
                      {rec.overtimeHours > 0 ? (
                        <span className="font-bold text-accent">+{rec.overtimeHours} hrs</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge tone={STATUS_TONES[rec.status]}>{rec.status.replace(/_/g, " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Leave Requests Ledger */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-text">Staff Leave Applications</h3>
          <span className="text-[12px] text-text-muted">{leaves.length} Recorded Application(s)</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leaves.map((leave) => (
            <Card key={leave.id} className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-text text-[14px]">{leave.employeeName}</h4>
                    <span className="font-data text-[11px] text-text-muted">{ROLE_LABEL[leave.role]}</span>
                  </div>
                  <Badge tone={LEAVE_TONES[leave.status]}>{leave.status}</Badge>
                </div>

                <div className="rounded-lg bg-bg p-2.5 text-[12px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Type:</span>
                    <span className="font-semibold text-text">{leave.leaveType} LEAVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Period:</span>
                    <span className="font-data text-text">{leave.startDateBS} to {leave.endDateBS}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Duration:</span>
                    <span className="font-bold text-accent">{leave.totalDays} Day(s)</span>
                  </div>
                </div>

                <p className="text-[12px] text-text-muted italic">"{leave.reason}"</p>
                {leave.approvedBy && (
                  <div className="text-[11px] text-success">Approved by: {leave.approvedBy}</div>
                )}
              </div>

              {canManage && leave.status === "PENDING" && (
                <div className="flex items-center gap-2 border-t border-border pt-2.5">
                  <GhostButton
                    tone="error"
                    onClick={() => handleLeaveStatus(leave.id, "REJECTED")}
                    className="flex-1 py-1 text-[11.5px]"
                  >
                    Reject
                  </GhostButton>
                  <PrimaryButton
                    onClick={() => handleLeaveStatus(leave.id, "APPROVED")}
                    className="flex-1 py-1 text-[11.5px]"
                  >
                    Approve
                  </PrimaryButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Apply Leave Modal Dialog */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Calendar size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Apply for Leave</h3>
              </div>
              <button onClick={() => setIsLeaveModalOpen(false)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-4 text-[13px]">
              <Field label="Leave Type *" htmlFor="leaveType">
                <Select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                >
                  <option value="CASUAL">Casual Leave (Personal / Family)</option>
                  <option value="SICK">Sick / Medical Leave</option>
                  <option value="FESTIVAL">Festival / Dashain-Tihar Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date (BS) *" htmlFor="startDateBS">
                  <Input
                    id="startDateBS"
                    value={startDateBS}
                    onChange={(e) => setStartDateBS(e.target.value)}
                    placeholder="2083-05-15"
                    required
                  />
                </Field>
                <Field label="End Date (BS) *" htmlFor="endDateBS">
                  <Input
                    id="endDateBS"
                    value={endDateBS}
                    onChange={(e) => setEndDateBS(e.target.value)}
                    placeholder="2083-05-16"
                    required
                  />
                </Field>
              </div>

              <Field label="Total Days *" htmlFor="totalDays">
                <Input
                  id="totalDays"
                  type="number"
                  value={totalDays}
                  onChange={(e) => setTotalDays(e.target.value)}
                  min="1"
                  required
                />
              </Field>

              <div>
                <label htmlFor="leaveReason" className="mb-1 block text-[12.5px] font-medium text-text-muted">
                  Reason for Leave <span className="text-error">*</span>
                </label>
                <textarea
                  id="leaveReason"
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Explain reason for leave application..."
                  className="w-full rounded-lg border border-border bg-bg p-2.5 font-data text-[13px] text-text"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsLeaveModalOpen(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" className="py-2 text-[13px]">
                  Submit Application
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Punch Modal Dialog */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <PlusCircle size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Record Shift Attendance</h3>
              </div>
              <button onClick={() => setIsPunchModalOpen(false)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleManualPunch} className="mt-4 space-y-4 text-[13px]">
              <Field label="Employee Name *" htmlFor="punchName">
                <Input
                  id="punchName"
                  value={punchEmployeeName}
                  onChange={(e) => setPunchEmployeeName(e.target.value)}
                  placeholder="e.g. Ramesh Thapa"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Shift Type" htmlFor="punchShift">
                  <Select
                    id="punchShift"
                    value={punchShift}
                    onChange={(e) => setPunchShift(e.target.value as ShiftType)}
                  >
                    <option value="MORNING">Morning Shift (06:00 - 14:00)</option>
                    <option value="DAY">Day Shift (14:00 - 22:00)</option>
                    <option value="NIGHT">Night Shift (22:00 - 06:00)</option>
                    <option value="FULL_DAY">Full Day Shift</option>
                  </Select>
                </Field>

                <Field label="Attendance Status" htmlFor="punchStatus">
                  <Select
                    id="punchStatus"
                    value={punchStatus}
                    onChange={(e) => setPunchStatus(e.target.value as AttendanceStatus)}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="ABSENT">Absent</option>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-In Time" htmlFor="punchIn">
                  <Input
                    id="punchIn"
                    value={punchInTime}
                    onChange={(e) => setPunchInTime(e.target.value)}
                    placeholder="08:00 AM"
                  />
                </Field>
                <Field label="Check-Out Time" htmlFor="punchOut">
                  <Input
                    id="punchOut"
                    value={punchOutTime}
                    onChange={(e) => setPunchOutTime(e.target.value)}
                    placeholder="04:00 PM"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Hours Worked" htmlFor="punchHours">
                  <Input
                    id="punchHours"
                    type="number"
                    step="0.5"
                    value={punchHours}
                    onChange={(e) => setPunchHours(e.target.value)}
                  />
                </Field>
                <Field label="Overtime Hours" htmlFor="punchOvertime">
                  <Input
                    id="punchOvertime"
                    type="number"
                    step="0.5"
                    value={punchOvertime}
                    onChange={(e) => setPunchOvertime(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Shift Notes (Optional)" htmlFor="punchNotes">
                <Input
                  id="punchNotes"
                  value={punchNotes}
                  onChange={(e) => setPunchNotes(e.target.value)}
                  placeholder="e.g. Assigned to Dispenser Bay 1"
                />
              </Field>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsPunchModalOpen(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" className="py-2 text-[13px]">
                  Save Attendance Record
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
