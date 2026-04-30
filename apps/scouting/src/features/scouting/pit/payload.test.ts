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
    it("other drivetrain is stored as a discrete option without custom text", () => {
      const result = FormSchema.safeParse(
        makePitFormInput({
          drivetrainType: "other",
          drivetrainOther: "   ",
        })
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      const payload = buildPitFormInsertData(result.data, "member-1");

      expect(payload.drivetrainType).toBe("other");
      expect(payload.drivetrainOther).toBe("");
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
          archetype: "cycler",
          comments: "  starts near source and runs a curved auto path  ",
        })
      );

      const payload = buildPitFormInsertData(validated, "member-1");

      expect(payload.archetype).toBe("cycler");
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
