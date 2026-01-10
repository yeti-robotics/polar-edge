import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

async function signIn() {
  "use server";
  const response = await auth.api.signInSocial({
    body: {
      provider: "discord",
    },
    headers: await headers(),
  });

  if (response.url) {
    redirect(response.url);
  }
}

export default async function Home() {
  return <main>Welcome to Polar Edge Analytics!</main>;
}
