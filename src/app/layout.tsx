import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME ?? "EduManage",
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? "EduManage"}`,
  },
  description:
    "Professional Student Management & Academic Portal for educational institutions.",
  keywords: [
    "student management",
    "academic portal",
    "school management",
    "attendance",
    "marks",
    "grades",
  ],
  authors: [{ name: "EduManage" }],
  robots: "noindex, nofollow", // Internal app — don't index
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
