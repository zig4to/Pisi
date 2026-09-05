import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeScript from "@/components/theme/ThemeScript";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pisi — beležke",
  description: "Beležke, sekcije in strani na enem mestu.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sl"
      data-theme="light"
      suppressHydrationWarning
      className={`${rubik.variable} h-full overflow-x-hidden antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {children}
        <Script src="/install-promo.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
