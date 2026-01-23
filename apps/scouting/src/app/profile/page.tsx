"use client";
import { authClient } from "@/lib/auth-client";



export default function ProfilePage() {

  function handleLogOut() {
   authClient.signOut()
  }


  const { data: session, isPending } = authClient.useSession();


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
              <div className="text-black font-bold">{(user.name || "?").charAt(0)}
              <h1> {user.name} </h1>
              </div>
            )}
          </div>
          <button type="button" className="mt-4 bg-sky-700 hover:bg-sky-600 text-white py-2 px-4 rounded-md" onClick={handleLogOut}>
            Log Out
          </button>

        
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
          
          
        </div>

        <button type="button" className="mt-4 bg-sky-700 hover:bg-sky-600 text-white py-2 px-4 rounded-md">
          Save Settings
        </button>
      </section>
    </main>
  );
}