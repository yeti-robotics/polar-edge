import { useEffect, useRef, useState } from "react";

export function useLoadingTime(timeToWaitMs: number) {
	const [loading, setLoading] = useState(false);
	const [timedOut, setTimedOut] = useState(false);

	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	useEffect(() => {
		if (loading && !timeoutRef.current) {
			timeoutRef.current = setTimeout(() => {
				setTimedOut(true);
				setLoading(false);
			}, timeToWaitMs);
		} else if (!loading) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}

		return () => clearTimeout(timeoutRef.current);
	}, [loading, timeToWaitMs]);

	const startLoading = () => {
		setTimedOut(false);
		setLoading(true);
	};

	const stopLoading = () => {
		setTimedOut(false);
		setLoading(false);
	};

	return { timedOut, startLoading, stopLoading };
}
