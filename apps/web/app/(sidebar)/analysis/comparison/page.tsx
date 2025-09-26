import { ChartComparison } from "./chart-comparison";
import { ChartComparisonTwo } from "./chart-comparison";

export default function AnalysisComparisonPage() {
	return (
		<div className="flex items-center justify-center gap-8 py-10">
			<div className="flex-1 flex justify-end">
				<ChartComparison />
			</div>
			<div className="mx-4 text-3xl font-bold text-gray-500">
				⇄
			</div>
			<div className="flex-1 flex justify-start">
				<ChartComparisonTwo />
			</div>
		</div>
	);
}
