import type { Metadata } from "next";
import "./globals.css";

// Some local execution environments expose an incomplete `localStorage` object to Node.
// Next.js expects browser-like methods when this global exists, so we normalize it here.
if (typeof globalThis !== "undefined") {
  const maybeStorage = (globalThis as { localStorage?: unknown }).localStorage;
  if (maybeStorage && typeof (maybeStorage as Storage).getItem !== "function") {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem() {
          return null;
        },
        setItem() {},
        removeItem() {},
        clear() {},
        key() {
          return null;
        },
        length: 0
      } satisfies Storage,
      configurable: true
    });
  }
}

export const metadata: Metadata = {
  title: "Website Builder",
  description: "Phase 1 local website generation builder"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
