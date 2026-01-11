import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import "@repo/ui/globals.css";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/theme";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  // note that suppressHydrationWarning must be added b/c of next-themes
  // see: https://github.com/pacocoursey/next-themes
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
          <Header />
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
