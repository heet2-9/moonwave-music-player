"use client";

import { useTogetherStore } from "@/store/togetherStore";
import { siteConfig } from "@/config/site";
import { Wifi, RefreshCw, AlertTriangle, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SyncIndicator({ className }: { className?: string }) {
  const { syncState, driftMs, syncQuality, isHost, connectionState } = useTogetherStore();

  const partnerName = isHost ? siteConfig.partnerName || "Aaru" : siteConfig.hostName || "Heet";

  let statusText = `Synced with ${partnerName}`;
  let statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  let dotColor = "bg-emerald-400";
  let Icon = Wifi;

  if (connectionState === "Disconnected") {
    statusText = "Disconnected";
    statusColor = "text-rose-400 border-rose-500/30 bg-rose-500/10";
    dotColor = "bg-rose-500";
    Icon = WifiOff;
  } else if (connectionState === "Connecting" || syncState === "SYNCING") {
    statusText = `Syncing with ${partnerName}...`;
    statusColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
    dotColor = "bg-amber-400";
    Icon = RefreshCw;
  } else if (syncState === "DRIFT DETECTED") {
    statusText = `Adjusting sync (${Math.round(driftMs)}ms drift)`;
    statusColor = "text-amber-300 border-amber-500/30 bg-amber-500/15";
    dotColor = "bg-amber-300";
    Icon = AlertTriangle;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-all shadow-sm select-none",
        statusColor,
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <span className={cn("w-2 h-2 rounded-full", dotColor)} />
        {syncState === "SYNCED" && (
          <span className={cn("absolute w-3 h-3 rounded-full animate-ping opacity-75", dotColor)} />
        )}
      </div>

      <Icon
        className={cn(
          "w-3.5 h-3.5",
          (syncState === "SYNCING" || connectionState === "Connecting") && "animate-spin"
        )}
      />

      <span className="truncate">{statusText}</span>

      <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded bg-black/20">
        {syncQuality}
      </span>
    </div>
  );
}
