import { TypographyH2, TypographyP } from "@repo/ui/components/typography";
import { headers } from "next/headers";
import Image from "next/image";
import { ProfileLogoutButton } from "@/components/profile/ProfileLogoutButton";
import { UserFormSubmissions } from "@/features/analysis/components/UserFormSubmissions";
import PasskeyManager from "@/features/auth/components/PasskeyManager";
import { auth } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-xl w-full text-center">
          <TypographyH2 className="mb-2">You're not signed in</TypographyH2>
          <TypographyP> Sign in to view your profile and progress</TypographyP>
        </div>
      </div>
    );
  }

  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    activeMember = null;
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-background-black px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "avatar"}
                className="w-full h-full object-cover"
                width={300}
                height={300}
              />
            ) : (
              <div className="text-black font-mono">
                {(user.name || "?").charAt(0)}
                <h1> {user.name} </h1>
              </div>
            )}
          </div>
          <ProfileLogoutButton />
        </header>

        <section className="bg-muted-black rounded-lg p-6 ring-ring size-full">
          <TypographyH2 className="text-foreground-white mb-3">Account</TypographyH2>
          <PasskeyManager />
          <div className="mt-10">
            {activeMember ? (
              <UserFormSubmissions
                memberId={activeMember.id}
                title="Your Submitted Forms"
                emptyLabel="No form submissions yet."
              />
            ) : (
              <section className="rounded-xl border bg-muted/20 px-6 py-5">
                <TypographyH2 className="text-foreground-white mb-2">
                  Your Submitted Forms
                </TypographyH2>
                <p className="text-sm text-neutral-400">
                  Join an organization to track your scouting submissions.
                </p>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
