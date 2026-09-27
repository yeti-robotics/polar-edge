import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Was the decision on screen efficient or not?
 *
 * This is the film room's primary datum: a mark's colour IS its verdict (green
 * for good, red for bad), so colour is derived from this on read and is never
 * stored. Nullable on the table — a mark may be saved without a judgement.
 */
export const annotationVerdictEnum = pgEnum("annotation_verdict", ["good", "bad"]);
