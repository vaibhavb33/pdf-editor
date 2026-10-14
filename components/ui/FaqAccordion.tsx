"use client";

import React, { useState } from "react";
import { ToolFaq } from "@/content/types";

interface FaqAccordionProps {
  faqs: ToolFaq[];
  className?: string;
  allowMultiple?: boolean;
}

export function FaqAccordion({ faqs, className = "", allowMultiple = false }: FaqAccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]); // First item open by default

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {faqs.map((faq, index) => {
        const isOpen = openIndices.includes(index);
        const buttonId = `faq-btn-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(index)}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-zinc-900 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none sm:text-base dark:text-zinc-100 dark:hover:text-blue-400 dark:focus-visible:ring-blue-500"
            >
              <span className="pr-2 font-semibold">{faq.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 ${
                  isOpen
                    ? "rotate-180 border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400"
                    : ""
                }`}
                aria-hidden="true"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-zinc-100 px-5 pt-1 pb-5 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800/60 dark:text-zinc-400"
              >
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
