"use client";

import { Button } from "@repo/ui/components/button";
import { useSidebar } from "@repo/ui/components/sidebar";
import { PanelLeft } from "lucide-react";

export function AppSidebarTrigger() {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			className="cursor-pointer rounded-full"
			variant="ghost"
			size="icon"
			onClick={toggleSidebar}
		>
			<PanelLeft />
		</Button>
	);
}
