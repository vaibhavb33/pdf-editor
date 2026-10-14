"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { siteConfig } from "@/content/site";
import { getAllTools } from "@/content";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/Badge";

export function Header() {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const tools = getAllTools();
  const organizeTools = tools.filter((t) => t.category === "organize");
  const convertTools = tools.filter((t) => t.category === "convert");
  const editTools = tools.filter((t) => t.category === "edit");
  const secureTools = tools.filter((t) => t.category === "secure");

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaMenuOpen(false);
        setMobileMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMegaMenuOpen(false);
      }
    };

    if (megaMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [megaMenuOpen]);

  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-950/90"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Trust badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            id="header-brand-logo"
            className="group flex min-h-[44px] items-center gap-2.5 rounded-xl py-1 text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30 transition-colors group-hover:bg-blue-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              pdfivo<span className="text-blue-600 dark:text-blue-400">.co</span>
            </span>
          </Link>

          <div className="hidden lg:block">
            <Badge variant="success" className="py-0.5 text-[11px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              100% Client-Side
            </Badge>
          </div>
        </div>

        {/* Desktop Navigation with Mega-Menu */}
        <nav
          id="desktop-nav"
          aria-label="Main Navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {/* Mega-Menu Trigger */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              id="mega-menu-button"
              aria-expanded={megaMenuOpen}
              aria-haspopup="true"
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:hover:text-white"
            >
              <span>All Tools</span>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${
                  megaMenuOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : "text-zinc-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mega-Menu Dropdown Panel */}
            {megaMenuOpen && (
              <div
                ref={megaMenuRef}
                id="mega-menu-panel"
                role="region"
                aria-label="All PDF tools grouped by category"
                className="animate-in fade-in slide-in-from-top-2 absolute top-full left-0 z-50 mt-2 grid w-[720px] grid-cols-4 gap-6 rounded-3xl border border-zinc-200 bg-white/98 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/98"
              >
                {/* 1. Organize Column */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                      Organize
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {organizeTools.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${t.slug}`}
                          onClick={() => setMegaMenuOpen(false)}
                          className="block rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-blue-400"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Convert Column */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <h3 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                      Convert
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {convertTools.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${t.slug}`}
                          onClick={() => setMegaMenuOpen(false)}
                          className="block rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-emerald-400"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Edit Column */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <span className="h-2 w-2 rounded-full bg-amber-600" />
                    <h3 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                      Edit
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {editTools.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${t.slug}`}
                          onClick={() => setMegaMenuOpen(false)}
                          className="block rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-amber-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-amber-400"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Secure Column */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <span className="h-2 w-2 rounded-full bg-purple-600" />
                    <h3 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                      Secure
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {secureTools.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${t.slug}`}
                          onClick={() => setMegaMenuOpen(false)}
                          className="block rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-purple-400"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Direct tool quick links */}
          {siteConfig.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions: Theme Toggle & Mobile Menu Trigger */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile Menu Hamburger Button (touch target >= 44px) */}
          <button
            type="button"
            id="mobile-menu-toggle-btn"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white/80 text-zinc-700 transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none md:hidden dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:text-white"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Responsive Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="animate-in fade-in max-h-[calc(100vh-64px)] overflow-y-auto border-t border-zinc-200 bg-white px-4 py-6 md:hidden dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="space-y-6">
            {/* Group 1: Organize */}
            <div>
              <h4 className="mb-2.5 text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                Organize PDF
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {organizeTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${t.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Group 2: Convert */}
            <div>
              <h4 className="mb-2.5 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                Convert PDF
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {convertTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${t.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Group 3: Edit */}
            <div>
              <h4 className="mb-2.5 text-xs font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                Edit PDF
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {editTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${t.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Group 4: Secure */}
            <div>
              <h4 className="mb-2.5 text-xs font-bold tracking-wider text-purple-600 uppercase dark:text-purple-400">
                Secure PDF
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {secureTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${t.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Link
                href="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center justify-between rounded-xl px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400"
              >
                <span>Privacy Architecture</span>
                <span className="font-bold text-emerald-500">100% Client-Side</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
