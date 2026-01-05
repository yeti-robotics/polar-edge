import { Toaster } from "@repo/ui/components/toaster";

export default async function ScoutLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main>
			<div>{children}</div>
			<Toaster />
		</main>
	);
}
