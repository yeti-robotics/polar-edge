import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkInBattery,
  checkOutBattery,
  addBattery as dbAddBattery,
  deleteBattery as dbDeleteBattery,
  deleteSession as dbDeleteSession,
  getActiveSessions,
  getCompletedSessions,
  getDashboardStats,
  getFleetBatteries,
} from "@/services/tracker/db";
import type {
  BatterySession,
  DashboardStats,
  FleetBattery,
  SessionPerformance,
} from "@/services/tracker/types";
import { JuiceNav } from "../JuiceNav";
import { AddBatteryDialog } from "./AddBatteryDialog";
import { BatteryCard } from "./BatteryCard";
import { CheckOutDialog } from "./CheckOutDialog";
import { DashboardView } from "./DashboardView";
import { LogView } from "./LogView";

export function TrackerApp() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    available: 0,
    inUse: 0,
    brownouts: 0,
  });
  const [fleet, setFleet] = useState<FleetBattery[]>([]);
  const [activeSessions, setActiveSessions] = useState<BatterySession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<BatterySession[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [s, f, a, c] = await Promise.all([
      getDashboardStats(),
      getFleetBatteries(),
      getActiveSessions(),
      getCompletedSessions(),
    ]);
    setStats(s);
    setFleet(f);
    setActiveSessions(a);
    setCompletedSessions(c);
  }, []);

  useEffect(() => {
    refresh().then(() => setLoaded(true));
  }, [refresh]);

  const handleAddBattery = async (name: string, notes: string) => {
    await dbAddBattery(name, notes);
    await refresh();
  };

  const handleCheckOut = async (
    batteryId: string,
    batteryName: string,
    kw700: number | null,
    voltage: number | null
  ) => {
    await checkOutBattery(batteryId, batteryName, kw700, voltage);
    await refresh();
  };

  const handleCheckIn = async (
    sessionId: string,
    performance: SessionPerformance,
    hadBrownout: boolean,
    brownoutTiming: string | null,
    notes: string
  ) => {
    await checkInBattery(sessionId, performance, hadBrownout, brownoutTiming, notes);
    await refresh();
  };


  const handleDeleteBattery = async (id: string) => {
    await dbDeleteBattery(id);
    await refresh();
  };

  const handleDeleteSession = async (id: string) => {
    await dbDeleteSession(id);
    await refresh();
  };

  const availableBatteries = useMemo(() => fleet.filter((b) => !b.isInUse), [fleet]);
  const existingNames = useMemo(() => fleet.map((b) => b.name), [fleet]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <JuiceNav active="tracker" />

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="dashboard">
          <div className="mb-6 flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
              <TabsTrigger value="log">Log</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <CheckOutDialog availableBatteries={availableBatteries} onCheckOut={handleCheckOut} />
              <AddBatteryDialog onAdd={handleAddBattery} existingNames={existingNames} />
            </div>
          </div>

          <TabsContent value="dashboard">
            <DashboardView
              stats={stats}
              activeSessions={activeSessions}
              onCheckIn={handleCheckIn}
            />
          </TabsContent>

          <TabsContent value="fleet">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fleet.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <p className="mb-2 text-3xl opacity-30">🔋</p>
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    No batteries registered yet
                  </p>
                </div>
              ) : (
                fleet.map((b) => (
                  <BatteryCard
                    key={b.id}
                    battery={b}
                    onCheckOut={handleCheckOut}
                    onCheckIn={handleCheckIn}
                    onDelete={handleDeleteBattery}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="log">
            <LogView sessions={completedSessions} onDelete={handleDeleteSession} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
