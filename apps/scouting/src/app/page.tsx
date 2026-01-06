import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function signIn() {
	"use server";
	const response = await auth.api.signInSocial({
		body: {
			provider: "discord",
		},
		headers: await headers()
	});

	if (response.url) {
		redirect(response.url);
	}
}

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers()
	});

	if (session) {
		return <div>ur signed in! hi there {session.user.name}</div>
	}

	return (
		<form action={signIn}>
			<button type="submit">Sign in</button>
		</form>
	);
}
