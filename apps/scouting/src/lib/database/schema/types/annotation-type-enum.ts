import { pgEnum } from "drizzle-orm/pg-core";

export const annotationTypeEnum = pgEnum("annotation_type", [
  "pen",
  "line",
  "arrow",
  "rect",
  "ellipse",
]);
