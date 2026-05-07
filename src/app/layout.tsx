import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام إدارة الطلبات",
  description: "نظام إدارة طلبات العملاء والتجار",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
