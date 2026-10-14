"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-900/60 dark:bg-emerald-950/40">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Message Received</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Thank you for reaching out. We will review your message promptly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div>
        <label
          htmlFor="contact-name"
          className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Your Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          placeholder="Jane Doe"
          className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Email Address
        </label>
        <input
          id="contact-email"
          type="email"
          required
          placeholder="jane@example.com"
          className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          placeholder="Feature suggestion or feedback"
          className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Your Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          placeholder="Describe your feedback, suggestion, or question in detail..."
          className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Submit Message
      </Button>
    </form>
  );
}
