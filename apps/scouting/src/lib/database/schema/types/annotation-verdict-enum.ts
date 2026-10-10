import { pgEnum } from "drizzle-orm/pg-core";

export const annotationVerdictEnum = pgEnum("annotation_verdict", ["good", "bad"]);
