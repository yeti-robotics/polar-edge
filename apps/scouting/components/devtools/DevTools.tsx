import { DevToolsContainer } from "./DevToolsContainer";

import { auth } from "@/lib/auth";
import { Button } from "@repo/ui/components/button";
import {
	Drawer,
	DrawerContent,
	DrawerTitle,
	DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { WrenchIcon } from "lucide-react";
import { Session } from "next-auth";

function SessionStatus({ isActive }: { isActive: boolean }) {
	return (
		<span
			className={`font-medium ${isActive ? "text-green-500" : "text-red-500"}`}
		>
			{isActive ? "Active" : "Inactive"}
		</span>
	);
}

function UserInfoCard({ user }: { user: Session["user"] }) {
	return (
		<div className="space-y-2">
			<h3 className="text-sm leading-none font-medium">User</h3>
			<div className="space-y-3 rounded-lg border p-4">
				<div>
					<div className="font-medium">{user.name}</div>
					<div className="text-muted-foreground text-sm break-all">
						ID: {user.id}
					</div>
				</div>
				<div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
					<div>
						<div className="font-medium">Role</div>
						<div className="text-muted-foreground">{user.role}</div>
					</div>
					<div>
						<div className="font-medium">Guild Nickname</div>
						<div className="text-muted-foreground break-all">
							{user.guildNickname}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function RawDataViewer({ data }: { data: unknown }) {
	return (
		<div className="space-y-2">
			<h3 className="text-sm leading-none font-medium">
				Raw Session Data
			</h3>
			<div className="h-[300px] overflow-auto">
				<pre className="bg-muted/50 overflow-x-auto rounded-lg border p-4 font-mono text-sm whitespace-pre">
					{JSON.stringify(data, null, 2)}
				</pre>
			</div>
		</div>
	);
}

async function SessionTool() {
	const session = await auth();

	return (
		<TabsContent value="session" className="mt-0 border-none">
			<div className="min-w-0 space-y-6">
				<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
					<h2 className="text-lg leading-none font-semibold tracking-tight">
						Session Info
					</h2>
					<div className="text-muted-foreground text-sm whitespace-nowrap">
						Status: <SessionStatus isActive={!!session} />
					</div>
				</div>

				{session?.user && (
					<div className="min-w-0 space-y-4">
						<UserInfoCard user={session.user} />
						<RawDataViewer data={session} />
					</div>
				)}

				{!session && (
					<div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
						<div className="text-destructive text-sm">
							No active session found
						</div>
					</div>
				)}
			</div>
		</TabsContent>
	);
}

export function DevTools() {
	return (
		<DevToolsContainer>
			<div className="fixed right-4 bottom-4 z-50">
				<Drawer>
					<DrawerTitle className="sr-only">DevTools</DrawerTitle>
					<DrawerTrigger asChild>
						<Button
							variant="default"
							className="size-16 rounded-full p-0 shadow-lg shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-black/25 [&_svg]:size-8"
						>
							<WrenchIcon className="text-white" />
							<span className="sr-only">Open DevTools</span>
						</Button>
					</DrawerTrigger>
					<DrawerContent className="max-h-[85vh]">
						<div className="flex h-full flex-col">
							<div className="min-h-0 flex-1">
								<Tabs
									defaultValue="session"
									orientation="vertical"
									className="flex h-full divide-x"
								>
									<div className="w-40 shrink-0">
										<div className="p-1">
											<TabsList className="flex h-auto flex-col space-y-2 bg-transparent">
												<TabsTrigger
													value="session"
													className="data-[state=active]:bg-muted/80 w-full justify-start"
												>
													Session
												</TabsTrigger>
											</TabsList>
										</div>
									</div>
									<div className="min-w-0 flex-1 overflow-auto">
										<div className="p-4">
											<SessionTool />
										</div>
									</div>
								</Tabs>
							</div>
						</div>
					</DrawerContent>
				</Drawer>
			</div>
		</DevToolsContainer>
	);
}
