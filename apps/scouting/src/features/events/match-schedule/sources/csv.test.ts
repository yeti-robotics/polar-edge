import { describe, expect, it } from "vitest";

import { csvScheduleToImport, parseMatchScheduleCsv } from "./csv";

describe("parseMatchScheduleCsv", () => {
  it("parses a valid match schedule", () => {
    const csv = [
      "match_number, r1,r2,r3,b1,b2,b3",
      "1,342,10367,10231,8137,3967, 343",
      "2, 9005, 3489, 8575, 9496, 10599, 4451",
    ].join("\n");

    const result = parseMatchScheduleCsv(csv);

    expect(result).toEqual([
      {
        matchNumber: 1,
        r1: 342,
        r2: 10367,
        r3: 10231,
        b1: 8137,
        b2: 3967,
        b3: 343,
      },
      {
        matchNumber: 2,
        r1: 9005,
        r2: 3489,
        r3: 8575,
        b1: 9496,
        b2: 10599,
        b3: 4451,
      },
    ]);
  });
  it("rejects invalid headers", () => {
    const csv = ["matchnmber,r1,r2,r3,b1,b2,b3", "1,342,10367,10231,8137,3967, 343"].join("\n");
    expect(() => parseMatchScheduleCsv(csv)).toThrow(
      "The CSV header must be: match_number, r1, r2, r3, b1, b2, b3. Received: matchnmber, r1, r2, r3, b1, b2, b3."
    );
  });

  it("parses quoted grouped numbers", () => {
    const csv = ["match_number,r1,r2,r3,b1,b2,b3", '1,"1,234",10367,10231,8137,3967,343'].join(
      "\n"
    );

    expect(parseMatchScheduleCsv(csv)[0]?.r1).toBe(1234);
  });

  it("rejects malformed grouped numbers", () => {
    const csv = ["match_number,r1,r2,r3,b1,b2,b3", '1,"1,2,3",10367,10231,8137,3967,343'].join(
      "\n"
    );

    expect(() => parseMatchScheduleCsv(csv)).toThrow("Line 2 is invalid");
  });

  it("rejects integers larger than a PostgreSQL integer", () => {
    const csv = [
      "match_number,r1,r2,r3,b1,b2,b3",
      "1,2147483648,10367,10231,8137,3967,343",
    ].join("\n");

    expect(() => parseMatchScheduleCsv(csv)).toThrow("Line 2 is invalid");
  });

  it("rejects duplicate match numbers", () => {
    const csv = [
      "match_number, r1,r2,r3,b1,b2,b3",
      "1,342,10367,10231,8137,3967, 343",
      "1, 9005, 3489, 8575, 9496, 10599, 4451",
    ].join("\n");
    expect(() => parseMatchScheduleCsv(csv)).toThrow("Duplicate match number: 1");
  });

  it("rejects a duplicate team inside one match", () => {
    const csv = ["match_number,r1,r2,r3,b1,b2,b3", "1,342,10367,342,8137,3967,343"].join("\n");

    expect(() => parseMatchScheduleCsv(csv)).toThrow("Match 1 contains a duplicate team");
  });

  it("converts CSV data into the canonical match schedule", () => {
    const csv = ["match_number,r1,r2,r3,b1,b2,b3", "1,342,10367,10231,8137,3976,343"].join("\n");

    const schedule = csvScheduleToImport(csv);

    expect(schedule.matches).toEqual([
      {
        matchNumber: 1,
        matchType: "qm",
        slots: [
          { teamNumber: 342, alliance: "red", position: 1 },
          { teamNumber: 10367, alliance: "red", position: 2 },
          { teamNumber: 10231, alliance: "red", position: 3 },
          { teamNumber: 8137, alliance: "blue", position: 1 },
          { teamNumber: 3976, alliance: "blue", position: 2 },
          { teamNumber: 343, alliance: "blue", position: 3 },
        ],
      },
    ]);
  });
});
