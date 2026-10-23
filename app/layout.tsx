import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./editor-fonts.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { constructMetadata } from "@/lib/seo/metadata";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { DeferredAnalytics } from "@/components/seo/DeferredAnalytics";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  ...constructMetadata(),
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('pdfivo-theme');
                var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-white text-zinc-900 transition-colors duration-150 selection:bg-blue-600 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
        {/* Skip to Content for Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <ToastProvider>
            <Header />
            <main
              id="main-content"
              tabIndex={-1}
              className="flex flex-1 flex-col focus:outline-none"
            >
              {children}
            </main>
            <Footer />
            <DeferredAnalytics />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
