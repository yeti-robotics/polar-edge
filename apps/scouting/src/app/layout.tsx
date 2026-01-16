import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { Suspense } from "react";
import "./styles/globals.css";

import { SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import { Sidebar as AppSidebar } from "@repo/ui/components/sidebar";
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
            <main>
              <SidebarTrigger />
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </main>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
