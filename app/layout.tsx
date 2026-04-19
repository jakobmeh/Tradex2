import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaLedger Journal",
  description: "Private trading journal with auth, templates, screenshots, and performance tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
