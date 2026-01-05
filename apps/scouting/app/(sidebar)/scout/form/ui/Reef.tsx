import { cn } from "@repo/ui/lib/utils";

export function ReefDiagram({ className }: { className?: string }) {
	return (
		<svg
			className={cn(className)}
			width="100%"
			height="auto"
			viewBox="0 0 928 4323"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M795.5 587.5V0H928V587.5C928 587.5 911 709.5 862 774C803.151 851.465 669 931.5 669 931.5L253.5 1213.5C253.5 1213.5 203.612 1254.81 177.5 1291C149.816 1329.37 130 1393.5 130 1393.5V2420.5L819 1938L895 2043L130 2579.5V3688L820.5 3210.5L895 3315.5L130 3849.5V4134H244V4276.5L405.5 4323H0.5V1393.5C0.5 1393.5 18.0021 1301.85 47.5 1251.5C81.4816 1193.5 157.5 1134.5 157.5 1134.5L669 774C669 774 735.678 731.749 761.5 690.5C783.976 654.596 795.5 587.5 795.5 587.5Z" />
		</svg>
	);
}
