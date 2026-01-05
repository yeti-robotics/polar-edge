import { SnowfallComponent } from "@/components/snowfall/snowfall";
import { auth, signIn } from "@/lib/auth";
import { UserRole } from "@/lib/database/schema";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { redirect } from "next/navigation";

async function enterScoutingSite() {
	"use server";
	const authInfo = await auth();

	if (authInfo?.user && authInfo.user.role !== UserRole.BANISHED) {
		redirect("/scout");
	}

	await signIn("discord", { redirectTo: "/scout" });
}

export default function Home() {
	return (
		<div className="to-primary relative min-h-screen overflow-hidden bg-gradient-to-br from-[#7FB3D5] via-[#5499C7]">
			{/* Frost overlay */}
			<div className="pointer-events-none absolute inset-0 mix-blend-overlay backdrop-blur-[1px]" />
			<SnowfallComponent />

			{/* Background gradient */}
			{/* Navigation */}
			<nav className="absolute top-0 z-10 w-full p-6">
				<div className="container mx-auto flex items-center justify-end">
					<div className="flex items-center space-x-8">
						<div className="space-x-8 text-white/90">
							{[{ name: "Data", href: "/analysis" }].map(
								(item) => (
									<Link
										key={item.name}
										href={item.href}
										className="group relative transition-colors hover:text-white"
									>
										{item.name}
										<span className="absolute inset-x-0 -bottom-1 h-px scale-x-0 transform bg-white transition-transform group-hover:scale-x-100" />
									</Link>
								)
							)}
						</div>
						<form action={enterScoutingSite}>
							<Button
								type="submit"
								variant="ghost"
								className="border border-white/20 text-white backdrop-blur-sm hover:bg-white/10 hover:text-blue-100"
							>
								Login →
							</Button>
						</form>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="relative flex min-h-screen flex-col items-center justify-center px-4">
				<div className="relative space-y-6 text-center">
					<div className="mb-4 flex justify-center">
						<Badge
							variant="secondary"
							className="shadow-glow border border-white/20 bg-white/10 text-white backdrop-blur-md"
						>
							In Development
						</Badge>
					</div>

					<h1 className="drop-shadow-glow mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
						Polar Edge Analytics
					</h1>

					<p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 drop-shadow md:text-xl">
						Publicly accessible, advanced scouting data for teams in
						North Carolina.
						<span className="mt-2 block font-semibold">
							Brought to you by YETI Robotics.
						</span>
					</p>

					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<form action={enterScoutingSite}>
							<Button
								type="submit"
								variant="ghost"
								className="border border-white/20 p-5 text-lg text-white backdrop-blur-sm hover:bg-white/10 hover:text-blue-100"
							>
								Scout →
							</Button>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
}
