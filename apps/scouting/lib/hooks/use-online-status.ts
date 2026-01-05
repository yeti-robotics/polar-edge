import { useSyncExternalStore } from "react";

function onlineChange(callback: () => void) {
	window.addEventListener("online", callback);
	window.addEventListener("offline", callback);

	return () => {
		window.removeEventListener("online", callback);
		window.removeEventListener("offline", callback);
	};
}

export function useIsOnline() {
	return useSyncExternalStore(
		onlineChange,
		() => navigator.onLine,
		() => true
	);
}
