import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { Suspense } from "react";
// Use shared UI package global styles (exported by @repo/ui)
import "@repo/ui/globals.css";

import { SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import AppSidebar from "@/components/app/sidebar";
import MainContent from "@/components/MainContent";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@repo/ui/components/toaster";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
});

export const metadata: Metadata = {
  title: "Polar Edge Analytics",
  description: "A NC FRC Scouting Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${libreFranklin.variable} bg-background dark:prose-invert min-h-screen font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <Header />
            <AppSidebar />
            {/* MainContent is a client component that reads sidebar state and adjusts page margin */}
            <MainContent>
              <SidebarTrigger />
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </MainContent>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
