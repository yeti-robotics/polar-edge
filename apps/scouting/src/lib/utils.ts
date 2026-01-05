export function getNodeEnv() {
	return process.env.NODE_ENV;
}

export function toTitleCase(string: string) {
	return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}
