import { MalformedCsvError, ValidationError } from "../errors";

describe("errors", () => {
	it("should create a MalformedCsvError with the correct message", () => {
		const error = new MalformedCsvError("test");
		expect(error.message).toBe("test");
	});

	it("should create a ValidationError with the correct message", () => {
		const error = new ValidationError("test");
		expect(error.message).toBe("test");
	});
});
