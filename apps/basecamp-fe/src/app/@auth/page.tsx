import { cookies } from "next/headers";
import { Suspense } from "react";
import { validateToken } from "@/lib/auth";
import { FlipperWrapper } from "./flipper-wrapper";
import { TeamDisplay } from "./team-display";
import teamsData from "./teams.json";
import { TOTPProvider } from "./totp-context";
import { TOTPProgressBar } from "./totp-progress-bar";
import { TOTPTimer } from "./totp-timer";

export default async function AuthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (!token || !(await validateToken(token))) {
    return null;
  }

  const secret = cookieStore.get("toofaSecret")?.value;
  if (!secret) {
    console.error("TOTP secret not found in cookies");
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white p-10 relative overflow-hidden">
      <TOTPProvider secret={secret}>
        <TOTPProgressBar />
        <div className="w-full max-w-6xl flex flex-col items-center relative z-10">
          <div className="text-center space-y-4">
            <h1 className="text-7xl font-black text-yeti-500">YETI Pass</h1>
            <p className="text-slate-400 text-lg">Use this code to sign in or out</p>
          </div>

          <Suspense
            fallback={
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-4xl animate-pulse text-slate-200 font-black">YETI...</div>
              </div>
            }
          >
            <FlipperWrapper />
          </Suspense>

          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <TeamDisplay teams={teamsData} />

            <div className="flex flex-col items-center gap-4 text-center">
              <TOTPTimer />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 h-2/5 min-h-[400px] text-yeti-300 opacity-10 z-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="w-full h-full preserve-3d"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              fillOpacity="1"
              d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>
      </TOTPProvider>
    </main>
  );
}
