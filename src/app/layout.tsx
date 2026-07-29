import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ceylon Green Life Plantation (PVT) LTD | Premium Sri Lankan Plantations",
  description:
    "Ceylon Green Life Plantation (PVT) LTD — Leading plantation company in Sri Lanka specializing in sustainable tea, rubber, and spice cultivation. Committed to green practices and community development.",
  keywords: [
    "Ceylon Green Life",
    "plantation",
    "Sri Lanka",
    "tea plantation",
    "sustainable agriculture",
    "green energy",
    "Warakapola",
  ],
  openGraph: {
    title: "Ceylon Green Life Plantation (PVT) LTD",
    description:
      "Leading plantation company in Sri Lanka specializing in sustainable agriculture and green practices.",
    type: "website",
    locale: "en_US",
    siteName: "Ceylon Green Life Plantation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
