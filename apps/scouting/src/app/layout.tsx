import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { Suspense } from "react";
// Use shared UI package global styles (exported by @repo/ui)
import "@repo/ui/globals.css";
import { SidebarProvider } from "@repo/ui/components/sidebar";
import AppSidebar from "@/components/app/sidebar";
import MainContent from "@/components/MainContent";
import StickyNavbar from "@/components/StickyNavbar";
import { ThemeProvider } from "@/components/theme";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
});

export const metadata: Metadata = {
  title: "Polar Edge Analytics",
  description: "A NC FRC Scouting Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${libreFranklin.variable} bg-background dark:prose-invert min-h-screen font-sans`}
      >
        <section>
          <div className=" top-0 z-50 flex justify-center">
            <StickyNavbar />
          </div>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppSidebar />
              {/* MainContent is a client component that reads sidebar state and adjusts page margin */}
              <MainContent>
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              </MainContent>
            </SidebarProvider>
          </ThemeProvider>
        </section>
      </body>
    </html>
  );
}
