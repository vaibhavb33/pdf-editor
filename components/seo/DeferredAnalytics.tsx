"use client";

import { useEffect } from "react";

/**
 * DeferredAnalytics component:
 * - Loads NO third-party scripts by default.
 * - If NEXT_PUBLIC_PLAUSIBLE_DOMAIN or NEXT_PUBLIC_GA_ID is configured,
 *   defers script insertion until after first user interaction (pointerdown, scroll, keydown)
 *   or idle callback timeout, preserving 100% of main thread performance for LCP and INP.
 */
export function DeferredAnalytics() {
  useEffect(() => {
    const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    const gaId = process.env.NEXT_PUBLIC_GA_ID;

    // Zero third-party scripts by default
    if (!plausibleDomain && !gaId) {
      return;
    }

    let loaded = false;

    const loadAnalyticsScripts = () => {
      if (loaded) return;
      loaded = true;

      // Remove listeners once loaded
      cleanupListeners();

      // 1. Plausible Analytics (Privacy-friendly, GDPR compliant, < 1KB)
      if (plausibleDomain) {
        const script = document.createElement("script");
        script.src = "https://plausible.io/js/script.js";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-domain", plausibleDomain);
        document.head.appendChild(script);
      }

      // 2. Google Analytics 4 (Deferred)
      if (gaId) {
        const script = document.createElement("script");
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        const inlineScript = document.createElement("script");
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { 'send_page_view': false });
        `;
        document.head.appendChild(inlineScript);
      }
    };

    const events = ["pointerdown", "touchstart", "keydown", "scroll"];
    const cleanupListeners = () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, loadAnalyticsScripts);
      });
    };

    // Attach passive interaction listeners
    events.forEach((evt) => {
      window.addEventListener(evt, loadAnalyticsScripts, { once: true, passive: true });
    });

    // Fallback: load after browser idle or 6 seconds
    let idleId: number | undefined;
    if ("requestIdleCallback" in window) {
      idleId = (window as Window).requestIdleCallback(loadAnalyticsScripts, { timeout: 6000 });
    } else {
      const timer = setTimeout(loadAnalyticsScripts, 6000);
      return () => {
        cleanupListeners();
        clearTimeout(timer);
      };
    }

    return () => {
      cleanupListeners();
      if (idleId && "cancelIdleCallback" in window) {
        (window as Window).cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}
