"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync if queued items exist
      if (queuedCount > 0) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queuedCount]);

  const triggerSync = async () => {
    setSyncing(true);
    // Simulate background outbox flush
    setTimeout(() => {
      setQueuedCount(0);
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  if (isOnline && queuedCount === 0 && !syncSuccess) {
    return null; // Keep topbar clean when connection is normal
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-all animate-fade-in",
        !isOnline
          ? "border-warning/40 bg-warning/15 text-warning"
          : syncSuccess
          ? "border-success/40 bg-success/15 text-success"
          : "border-accent/40 bg-accent/15 text-accent"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff size={13} className="animate-pulse" />
          <span>Offline Mode · Sales Queued Locally ({queuedCount})</span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw size={13} className="animate-spin" />
          <span>Syncing Queued Sales...</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={13} />
          <span>Network Restored · Outbox Synced</span>
        </>
      )}
    </div>
  );
}
