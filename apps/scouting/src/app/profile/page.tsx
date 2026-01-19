"use client";

import { useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";

function levelFromPoints(points: number) {
  if (points >= 2000) return { level: 10, next: 3000 };
  if (points >= 1500) return { level: 9, next: 2000 };
  if (points >= 1200) return { level: 8, next: 1500 };
  if (points >= 900) return { level: 7, next: 1200 };
  if (points >= 700) return { level: 6, next: 900 };
  if (points >= 500) return { level: 5, next: 700 };
  if (points >= 300) return { level: 4, next: 500 };
  if (points >= 150) return { level: 3, next: 300 };
  if (points >= 50) return { level: 2, next: 150 };
  return { level: 1, next: 50 };
}

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  // placeholder metrics — replace with real API calls as needed
  const [points] = useState<number>(850);
  const [formsFilled] = useState<number>(42);
  const [xpBonus, setXpBonus] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  const { level, next } = useMemo(() => levelFromPoints(points), [points]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-sky-200">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white-200 p-8">
        <div className="max-w-xl w-full text-center">
          <h2 className="text-2xl font-semibold mb-2">You're not signed in</h2>
          <p className="text-sm text-slate-400">Sign in to view your profile and progress.</p>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-black px-6 py-10">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-black-900 flex items-center justify-center overflow-hidden ">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "avatar"}
                className="w-full h-full object-cover border-transparent"
              />
            ) : (
              <div className="text-black font-bold">{(user.name || "?").charAt(0)}</div>
            )}
          </div>
           <button className="mt-4 bg-sky-700 hover:bg-sky-600 text-white py-2 px-4 rounded-md">
          Log Out
        </button>

          <div>
            <h1 className="text-2xl font-bold">{user.name ?? "Unnamed"}</h1>
            <p className="text-sm text-white-900">{user.email}</p>
          </div>
        </header>

        <section className="bg-slate-900 rounded-lg p-6 ring-1 ring-slate-900 mb-8 size-full w-220 h-100 mt-10">
          <h3 className="text-lg font-semibold text-white-900 mb-3">Recent activity</h3>
          <ul className="divide-y divide-slate-800">
            <li className="py-3 flex items-start justify-between">
              <div>
                <div className="text-sm text-sky-100 font-medium"> Mock Data | Real Time Soon </div>
              </div>
            </li>
          </ul>
        </section>
      </div>


      <section className="bg-black-900 rounded-lg p-6 ring-1 ring-slate-900 size-full w-220 h-100 mt-10">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={xpBonus}
              onChange={(e) => setXpBonus(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-sky-100">Enable XP Bonus Notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-sky-100">Enable Email Notifications</span>
          </label>
        </div>


        <button className="mt-4 bg-sky-700 hover:bg-sky-600 text-white py-2 px-4 rounded-md">
          Save Settings
        </button>

      </section>
          



    </main>
  );
}
