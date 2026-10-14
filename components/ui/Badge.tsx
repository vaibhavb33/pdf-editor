import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "accent" | "outline";
  className?: string;
}

export function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const variantStyles = {
    primary:
      "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80",
    success:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80",
    accent:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80",
    outline:
      "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
  };

  const hasCustomDisplay = /(^|\s)(hidden|flex|inline-flex|block|inline-block|grid)(\s|$)/.test(
    className
  );
  const displayClass = hasCustomDisplay ? "" : "inline-flex";

  return (
    <span
      className={`${displayClass} items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${variantStyles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
