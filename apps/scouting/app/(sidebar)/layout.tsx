import { AppSidebarTrigger, AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/app-sidebar/ThemeToggle";
import { ThemeProvider } from "@/components/theme";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@repo/ui/components/sidebar";
import { SessionProvider } from "next-auth/react";

export default async function SidebarLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<SessionProvider session={session}>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset className="contain-inline-size">
						<header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b p-1">
							<AppSidebarTrigger />
							<ThemeToggle />
						</header>
						<div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</SessionProvider>
		</ThemeProvider>
	);
}
