import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = (status || "").toLowerCase();

  let bg = "bg-slate-100 text-slate-800 border-slate-200";
  let dot = "bg-slate-500";
  let label = status;

  switch (norm) {
    case "active":
    case "present":
    case "approved":
    case "valid":
    case "completed":
    case "synced":
      bg = "bg-emerald-50 text-emerald-800 border-emerald-200";
      dot = "bg-emerald-600";
      label = norm === "present" ? "Present (Verified)" : norm === "valid" ? "VALID AUTHORIZATION" : "Active";
      break;

    case "pending":
    case "open":
    case "scheduled":
      bg = "bg-amber-50 text-amber-800 border-amber-200";
      dot = "bg-amber-500";
      label = norm === "pending" ? "Pending Teacher Verification" : norm.toUpperCase();
      break;

    case "late":
      bg = "bg-orange-50 text-orange-800 border-orange-200";
      dot = "bg-orange-500";
      label = "Late (Verified)";
      break;

    case "expired":
      bg = "bg-amber-100 text-amber-900 border-amber-300";
      dot = "bg-amber-700";
      label = "EXPIRED";
      break;

    case "redeemed":
    case "already_redeemed":
      bg = "bg-blue-50 text-blue-800 border-blue-200";
      dot = "bg-blue-600";
      label = "ALREADY REDEEMED";
      break;

    case "suspended":
      bg = "bg-rose-100 text-rose-900 border-rose-300";
      dot = "bg-rose-600";
      label = "SUSPENDED";
      break;

    case "revoked":
    case "rejected":
    case "denied":
    case "invalid":
    case "cancelled":
      bg = "bg-red-50 text-red-800 border-red-200";
      dot = "bg-red-600";
      label = norm.toUpperCase();
      break;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
