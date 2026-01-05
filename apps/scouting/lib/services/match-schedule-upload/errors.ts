import "server-only";

/**
 * Thrown when the CSV file is malformed.
 */
export class MalformedCsvError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MalformedCsvError";
	}
}

/**
 * Thrown when the CSV file is invalid.
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}
