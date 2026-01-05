"use client";

import { useSidebar } from "@repo/ui/components/sidebar";
import Link from "next/link";

export function NavbarLink({
	children,
	href,
}: Readonly<{ children: React.ReactNode; href: string }>) {
	const { toggleSidebar } = useSidebar();

	return (
		<Link
			onClick={toggleSidebar}
			href={href}
			className="flex w-full items-center -space-x-6"
		>
			{children}
		</Link>
	);
}
