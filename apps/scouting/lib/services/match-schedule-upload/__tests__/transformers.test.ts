import { csvRowToDbRow, generateMatchId } from "../transformers";
import { RawCsvRow } from "../types";

describe("generateMatchId", () => {
	it("should generate a match ID", () => {
		const matchId = generateMatchId("test", 1);
		expect(matchId).toEqual("test_qm1_1");
	});

	it("should throw an error if the match ID is too long", () => {
		expect(() =>
			generateMatchId(
				"asupersupersupersuperlongeventcodethatisdefinitelylongerthan32characters",
				1,
				"qm",
				1000
			)
		).toThrow("Match ID is too long");
	});
});

describe("csvRowToDbRow", () => {
	it("should transform a CSV row to a database row", () => {
		const csvRow = {
			matchNumber: 1,
			blue: [1, 2, 3],
			red: [4, 5, 6],
		} as RawCsvRow;

		const result = csvRowToDbRow(csvRow, "test");

		expect(result).toEqual({
			matchRecord: {
				id: "test_qm1_1",
				compLevel: "qm",
				setNumber: 1,
				matchNumber: 1,
				eventKey: "test",
				winningAlliance: "",
			},
			teamMatchRecords: [
				{
					matchId: "test_qm1_1",
					teamNumber: 1,
					alliance: "blue",
					alliancePosition: 1,
				},
				{
					matchId: "test_qm1_1",
					teamNumber: 2,
					alliance: "blue",
					alliancePosition: 2,
				},
				{
					matchId: "test_qm1_1",
					teamNumber: 3,
					alliance: "blue",
					alliancePosition: 3,
				},
				{
					matchId: "test_qm1_1",
					teamNumber: 4,
					alliance: "red",
					alliancePosition: 1,
				},
				{
					matchId: "test_qm1_1",
					teamNumber: 5,
					alliance: "red",
					alliancePosition: 2,
				},
				{
					matchId: "test_qm1_1",
					teamNumber: 6,
					alliance: "red",
					alliancePosition: 3,
				},
			],
			teamRecords: [
				{
					teamNumber: 1,
					teamName: "",
				},
				{
					teamNumber: 2,
					teamName: "",
				},
				{
					teamNumber: 3,
					teamName: "",
				},
				{
					teamNumber: 4,
					teamName: "",
				},
				{
					teamNumber: 5,
					teamName: "",
				},
				{
					teamNumber: 6,
					teamName: "",
				},
			],
		});
	});
});
