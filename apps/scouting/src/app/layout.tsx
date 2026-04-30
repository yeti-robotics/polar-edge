import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import "./globals.css";
import { Toaster } from "@repo/ui/components/sonner";
import { PlausibleProvider } from "@/components/plausible-provider";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${libreFranklin.variable} bg-background dark:prose-invert min-h-screen font-sans overscroll-none`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PlausibleProvider />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
