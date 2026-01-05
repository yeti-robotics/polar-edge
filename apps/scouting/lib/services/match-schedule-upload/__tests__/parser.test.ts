import { MalformedCsvError } from "../errors";
import { parseCsv } from "../parser";
import { RawCsvRow } from "../types";

describe("parser", () => {
	it("should parse valid CSV with headers", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n1,1,2,3,4,5,6\n2,7,8,9,10,11,12"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({
			matchNumber: 1,
			blue: [1, 2, 3],
			red: [4, 5, 6],
		});
		expect(results[1]).toEqual({
			matchNumber: 2,
			blue: [7, 8, 9],
			red: [10, 11, 12],
		});
	});

	it("should handle CSV with extra whitespace", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n 1 , 1 , 2 , 3 , 4 , 5 , 6 "
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({
			matchNumber: 1,
			blue: [1, 2, 3],
			red: [4, 5, 6],
		});
	});

	it("should skip empty lines", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n\n1,1,2,3,4,5,6\n\n\n2,7,8,9,10,11,12\n"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({
			matchNumber: 1,
			blue: [1, 2, 3],
			red: [4, 5, 6],
		});
		expect(results[1]).toEqual({
			matchNumber: 2,
			blue: [7, 8, 9],
			red: [10, 11, 12],
		});
	});

	it("should throw MalformedCsvError for missing required fields", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2\n1,1,2,3,4,5"
		);

		await expect(async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for await (const _ of parseCsv(csvBuffer)) {
				// This should not be reached
			}
		}).rejects.toThrow(MalformedCsvError);
	});

	it("should throw MalformedCsvError for non-numeric values", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n1,abc,2,3,4,5,6"
		);

		await expect(async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for await (const _ of parseCsv(csvBuffer)) {
				// This should not be reached
			}
		}).rejects.toThrow(MalformedCsvError);
	});

	it("should handle negative match numbers", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n-1,1,2,3,4,5,6"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({
			matchNumber: -1,
			blue: [1, 2, 3],
			red: [4, 5, 6],
		});
	});

	it("should handle large team numbers", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n1,9999,8888,7777,6666,5555,4444"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({
			matchNumber: 1,
			blue: [9999, 8888, 7777],
			red: [6666, 5555, 4444],
		});
	});

	it("should handle zero team numbers", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n1,0,0,0,0,0,0"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({
			matchNumber: 1,
			blue: [0, 0, 0],
			red: [0, 0, 0],
		});
	});

	it("should handle empty CSV gracefully", async () => {
		const csvBuffer = Buffer.from("");

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(0);
	});

	it("should handle CSV with only headers gracefully", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(0);
	});

	it("should handle multiple matches in sequence", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n1,1,2,3,4,5,6\n2,7,8,9,10,11,12\n3,13,14,15,16,17,18"
		);

		const results: RawCsvRow[] = [];
		for await (const result of parseCsv(csvBuffer)) {
			results.push(result);
		}

		expect(results).toHaveLength(3);
		expect(results[0]!.matchNumber).toBe(1);
		expect(results[1]!.matchNumber).toBe(2);
		expect(results[2]!.matchNumber).toBe(3);
	});

	it("should throw MalformedCsvError for malformed CSV structure", async () => {
		const csvBuffer = Buffer.from(
			"matchNumber,blue1,blue2,blue3,red1,red2,red3\n1,1,2,3,4,5,6,7,8"
		);

		await expect(async () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for await (const _ of parseCsv(csvBuffer)) {
				// This should not be reached
			}
		}).rejects.toThrow();
	});
});
