import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ava - IDBI Digital Wealth Advisor",
  description: "AI-Powered personalized wealth management prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col ${GeistSans.className}`}>{children}</body>
    </html>
  );
}
