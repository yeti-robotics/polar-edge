import { describe, expect, it } from "vitest";
import { buildPitFormInsertData } from "./payload";
import { FormSchema, formatPitDrivetrain, type PitFormValues } from "./types";

function makePitFormInput(overrides: Partial<PitFormValues> = {}) {
  return {
    teamNumber: 422,
    drivetrainType: "tank",
    drivetrainOther: "",
    archetype: "",
    canTrench: false,
    canBump: false,
    canShuttle: false,
    capacity: 4,
    weight: 120,
    climbType: "center",
    shooterType: "",
    canShootWhileMoving: false,
    comments: "",
    ...overrides,
  };
}

describe("Pit form payload", () => {
  describe("attack coverage", () => {
    it("other drivetrain can slip through without a description", () => {
      const result = FormSchema.safeParse(
        makePitFormInput({
          drivetrainType: "other",
          drivetrainOther: "   ",
        })
      );

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path[0] === "drivetrainOther")).toBe(true);
    });

    it("stale custom drivetrain text can be saved against a standard drivetrain", () => {
      const validated = FormSchema.parse(
        makePitFormInput({
          drivetrainType: "tank",
          drivetrainOther: "butterfly drive",
        })
      );

      const payload = buildPitFormInsertData(validated, "member-1");

      expect(payload.drivetrainType).toBe("tank");
      expect(payload.drivetrainOther).toBe("");
    });

    it("custom notes can reach storage padded with whitespace instead of the scout's intended text", () => {
      const validated = FormSchema.parse(
        makePitFormInput({
          archetype: "  source-side support cycler  ",
          comments: "  starts near source and runs a curved auto path  ",
        })
      );

      const payload = buildPitFormInsertData(validated, "member-1");

      expect(payload.archetype).toBe("source-side support cycler");
      expect(payload.comments).toBe("starts near source and runs a curved auto path");
    });
  });

  describe("gap-closing coverage", () => {
    it("no-climb placeholder does not get stored as a real climb type", () => {
      const validated = FormSchema.parse(
        makePitFormInput({
          climbType: "none",
        })
      );

      const payload = buildPitFormInsertData(validated, "member-1");

      expect(payload.climbType).toBeNull();
    });

    it("analysis formatting keeps the scout's custom drivetrain label instead of collapsing to Other", () => {
      expect(formatPitDrivetrain("other", "Butterfly Drive")).toBe("Butterfly Drive");
      expect(formatPitDrivetrain("swerve", "ignored")).toBe("Swerve Drive");
    });
  });
});
