import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function Card({ children, className = "", hoverEffect = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all duration-200 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/70 ${
        hoverEffect
          ? "hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
