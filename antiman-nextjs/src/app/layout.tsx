import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import { Toaster } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "hummane - Empowering Humans",
  description: "Modern HR management system for managing your company and employees",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
