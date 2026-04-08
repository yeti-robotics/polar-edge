import { Header } from "@/components/layout/header/Header";
import { OfflineStatusBar } from "@/components/offline/OfflineStatusBar";
import { OfflineToastListener } from "@/components/offline/OfflineToastListener";
import { QueueCountProvider } from "@/lib/offline/queue-count-context";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueueCountProvider>
      <Header />
      <OfflineStatusBar />
      <OfflineToastListener />
      {children}
    </QueueCountProvider>
  );
}
