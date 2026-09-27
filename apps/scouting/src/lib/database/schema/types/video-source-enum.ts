import { pgEnum } from "drizzle-orm/pg-core";

export const videoSourceEnum = pgEnum("video_source", ["youtube", "upload"]);
