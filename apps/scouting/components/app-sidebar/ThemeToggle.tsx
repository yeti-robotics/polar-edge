"use client";

import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	const Icon = theme === "dark" ? MoonIcon : SunIcon;

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="cursor-pointer rounded-full"
					aria-label="Toggle theme"
				>
					{mounted ? <Icon /> : ""}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="mr-1">
				<DropdownMenuLabel className="text-xs">Theme</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer text-xs"
					onClick={() => setTheme("light")}
				>
					<SunIcon />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem
					className="cursor-pointer text-xs"
					onClick={() => setTheme("dark")}
				>
					<MoonIcon />
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem
					className="cursor-pointer text-xs"
					onClick={() => setTheme("system")}
				>
					<MonitorIcon />
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
