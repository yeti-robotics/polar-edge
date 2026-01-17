import "server-only";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import * as z from "zod";

const gradient = createOpenAICompatible({
  name: "gradient",
  baseURL: process.env.DO_BASE_URL ?? "https://inference.do-ai.run/v1",
  apiKey: process.env.DO_MODEL_ACCESS_KEY,
});

const MODEL_ID = process.env.DO_MODEL_ID;
if (!MODEL_ID) throw new Error("DO_MODEL_ID is not set");

const CategoryScore = z.object({
  label: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(-1).max(1),
  rationale: z.string().min(1).max(240),
});

const CommentResult = z.object({
  id: z.string(),
  overall: CategoryScore,
  reliability: CategoryScore,
  defense: CategoryScore,
  tags: z.array(z.string()).max(12).default([]),
});

const OutputSchema = z.object({
  results: z.array(CommentResult),
  summary: z.object({
    overall_avg: z.number().min(-1).max(1),
    reliability_avg: z.number().min(-1).max(1),
    defense_avg: z.number().min(-1).max(1),
    key_themes: z.array(z.string()).max(12).default([]),
    top_issues: z.array(z.string()).max(12).default([]),
  }),
});

type InputComment = { id: string; text: string };

function buildPrompt(comments: InputComment[]) {
  return `
You are analyzing scouting comments about a FIRST Robotics Competition robot.
For each comment, produce sentiment in three areas:
- overall: general performance/quality
- reliability: robustness, consistency, breakdowns, mechanical/electrical issues, cycle-to-cycle consistency
- defense: ability to play defense OR handle defense (pushing power, resisting hits, getting around traffic, etc.)

If any comment does not seem on topic, ignore it. It should only be about the robot's performance

Scoring rules:
- label: positive / neutral / negative
- score: real number in [-1, 1] (use -0.8..-1 for strongly negative, +0.8..+1 for strongly positive)
- rationale: short, specific, based only on the comment text
- tags: optional short keywords (e.g. "brownout", "chain", "tippy", "fast cycles", "stalled", "good evasion")

If a comment doesn't mention a category, set that category to neutral with score ~0.

Return JSON matching the provided schema.

Comments:
${comments.map((c) => `- (${c.id}) ${c.text}`).join("\n")}
`.trim();
}

async function analyzeBatch(comments: InputComment[]) {
  const result = await generateText({
    // biome-ignore lint/style/noNonNullAssertion: it's defined lol
    model: gradient(MODEL_ID!),
    output: Output.object({
      schema: OutputSchema,
    }),
    prompt: buildPrompt(comments),
    temperature: 0.2,
  });
  return result.output;
}

function avg(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}
