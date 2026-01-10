import { cookies } from "next/headers";
import { Suspense } from "react";
import { validateToken } from "@/lib/auth";
import { FlipperWrapper } from "./flipper-wrapper";

export default async function AuthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("toofaToken")?.value;

  if (!token || !(await validateToken(token))) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-yeti-500 text-7xl font-bold">YETI PASS</h1>
      <p className="mt-2 text-3xl">Use the code below to sign in and out.</p>
      <Suspense fallback={<div>Loading...</div>}>
        <FlipperWrapper />
      </Suspense>
    </div>
  );
}
