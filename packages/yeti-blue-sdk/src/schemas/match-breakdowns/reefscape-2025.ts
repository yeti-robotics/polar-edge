import { z } from "zod";

export enum Cage {
  NONE = "None",
  SHALLOW = "ShallowCage",
  DEEP = "DeepCage",
  PARK = "Parked",
}

const EndGameState2025Schema = z.enum([Cage.NONE, Cage.PARK, Cage.SHALLOW, Cage.DEEP]);

const ReefBreakdown2025RowSchema = z.object({
  nodeA: z.boolean(),
  nodeB: z.boolean(),
  nodeC: z.boolean(),
  nodeD: z.boolean(),
  nodeE: z.boolean(),
  nodeF: z.boolean(),
  nodeG: z.boolean(),
  nodeH: z.boolean(),
  nodeI: z.boolean(),
  nodeJ: z.boolean(),
  nodeK: z.boolean(),
  nodeL: z.boolean(),
});

const ReefBreakdown2025Schema = z.object({
  topRow: ReefBreakdown2025RowSchema,
  midRow: ReefBreakdown2025RowSchema,
  botRow: ReefBreakdown2025RowSchema,
  trough: z.number(),
});

const MatchScoreBreakdown2025AllianceSchema = z.object({
  adjustPoints: z.number(),
  algaePoints: z.number(),
  autoBonusAchieved: z.boolean(),
  autoCoralCount: z.number(),
  autoCoralPoints: z.number(),
  autoLineRobot1: z.enum(["No", "Yes"]),
  autoLineRobot2: z.enum(["No", "Yes"]),
  autoLineRobot3: z.enum(["No", "Yes"]),
  autoMobilityPoints: z.number(),
  autoPoints: z.number(),
  autoReef: ReefBreakdown2025Schema,
  bargeBonusAchieved: z.boolean(),
  coopertitionCriteriaMet: z.boolean(),
  coralBonusAchieved: z.boolean(),
  endGameBargePoints: z.number(),
  endGameRobot1: EndGameState2025Schema,
  endGameRobot2: EndGameState2025Schema,
  endGameRobot3: EndGameState2025Schema,
  foulCount: z.number(),
  foulPoints: z.number(),
  g206Penalty: z.boolean().default(false),
  g408Penalty: z.boolean().default(false),
  g424Penalty: z.boolean().default(false),
  netAlgaeCount: z.number(),
  rp: z.number(),
  techFoulCount: z.number(),
  teleopCoralCount: z.number(),
  teleopCoralPoints: z.number(),
  teleopPoints: z.number(),
  totalPoints: z.number(),
  teleopReef: ReefBreakdown2025Schema,
  wallAlgaeCount: z.number(),
});

const MatchScoreBreakdown2025Schema = z.object({
  blue: MatchScoreBreakdown2025AllianceSchema,
  red: MatchScoreBreakdown2025AllianceSchema,
});

export { ReefBreakdown2025Schema, MatchScoreBreakdown2025Schema };
