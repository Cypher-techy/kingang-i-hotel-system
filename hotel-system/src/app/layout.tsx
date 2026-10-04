import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "King’ang’i Hotel | Delicious meals. Great moments.",
  description: "Freshly prepared Kenyan meals and warm hospitality at King’ang’i Hotel, Egerton Main Gate and Njokerio.",
  keywords: ["King'ang'i Hotel", "Kenyan food", "Egerton Main Gate", "Njokerio", "Njoro restaurant"],
  openGraph: {
    title: "King’ang’i Hotel",
    description: "Delicious meals. Great moments. Warm hospitality.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
