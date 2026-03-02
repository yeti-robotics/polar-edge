import { TypographyH1, TypographyP } from "@repo/ui/components/typography";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-xl w-full text-center">
          <TypographyH1>You're not signed in</TypographyH1>
          <TypographyP>Sign in to view your profile and progress.</TypographyP>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background-black px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <ProfileClient user={session.user} />
      </div>
    </main>
  );
}
