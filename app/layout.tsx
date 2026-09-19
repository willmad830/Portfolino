import type { Metadata, Viewport } from "next";
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
  title: "Portfolino — Full-Ride грант из вашего портфолио",
  description:
    "Portfolino автоматически рассчитывает финансовый вес ваших достижений, выявляет пробелы в заявке и строит пошаговый Roadmap до поступления на 100% финансирование.",
  applicationName: "Portfolino",
};

export const viewport: Viewport = {
  themeColor: "#070709",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-background font-sans text-foreground antialiased"
      >
        {children}
      </body>
    </html>
  );
}
