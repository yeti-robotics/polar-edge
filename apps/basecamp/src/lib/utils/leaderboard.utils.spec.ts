import { describe, expect, it } from "vitest";
import { formatLeaderboard } from "./leaderboard.utils";

describe("formatLeaderboard", () => {
  const header = ":trophy: **Test Leaderboard** :trophy:";
  const footer = "*Updated in real-time*";

  it("formats top 3 with medal emojis and remaining with numbers", () => {
    const entries = [
      { userName: "Alice", totalHours: 50 },
      { userName: "Bob", totalHours: 40 },
      { userName: "Carol", totalHours: 30 },
      { userName: "Dave", totalHours: 20 },
      { userName: "Eve", totalHours: 10 },
    ];

    const result = formatLeaderboard(header, entries, footer);

    expect(result).toContain(":first_place_medal: **Alice** - 50 hours");
    expect(result).toContain(":second_place_medal: **Bob** - 40 hours");
    expect(result).toContain(":third_place_medal: **Carol** - 30 hours");
    expect(result).toContain("4. **Dave** - 20 hours");
    expect(result).toContain("5. **Eve** - 10 hours");
  });

  it("includes header and footer", () => {
    const entries = [{ userName: "Alice", totalHours: 50 }];

    const result = formatLeaderboard(header, entries, footer);

    expect(result).toMatch(/^:trophy: \*\*Test Leaderboard\*\* :trophy:\n\n/);
    expect(result).toMatch(/\n\*Updated in real-time\*$/);
  });

  it("formats a single entry with first place medal", () => {
    const entries = [{ userName: "Solo", totalHours: 99 }];

    const result = formatLeaderboard(header, entries, footer);

    expect(result).toContain(":first_place_medal: **Solo** - 99 hours");
  });

  it("handles empty entries", () => {
    const result = formatLeaderboard(header, [], footer);

    expect(result).toBe(`${header}\n\n\n${footer}`);
  });

  it("handles entries beyond rank 5 with numbered prefixes", () => {
    const entries = Array.from({ length: 7 }, (_, i) => ({
      userName: `User${i + 1}`,
      totalHours: 70 - i * 10,
    }));

    const result = formatLeaderboard(header, entries, footer);

    expect(result).toContain("6. **User6** - 20 hours");
    expect(result).toContain("7. **User7** - 10 hours");
  });
});
