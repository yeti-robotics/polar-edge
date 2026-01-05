"use server";

import { db } from "@/lib/database";
import { standForm } from "@/lib/database/schema";
import { desc } from "drizzle-orm";

export async function getAllForms() {
	return await db
		.select({
			id: standForm.id,
			teamNumber: standForm.teamNumber,
			matchId: standForm.matchId,
			leftBlackLine: standForm.leftBlackLine,
			autoCoralLevel1: standForm.autoCoralLevel1,
			autoCoralLevel2: standForm.autoCoralLevel2,
			autoCoralLevel3: standForm.autoCoralLevel3,
			autoCoralLevel4: standForm.autoCoralLevel4,
			autoAlgaeProcessor: standForm.autoAlgaeProcessor,
			autoAlgaeNet: standForm.autoAlgaeNet,
			teleopCoralLevel1: standForm.teleopCoralLevel1,
			teleopCoralLevel2: standForm.teleopCoralLevel2,
			teleopCoralLevel3: standForm.teleopCoralLevel3,
			teleopCoralLevel4: standForm.teleopCoralLevel4,
			teleopAlgaeProcessor: standForm.teleopAlgaeProcessor,
			teleopAlgaeNet: standForm.teleopAlgaeNet,
			cageClimb: standForm.cageClimb,
			defenseRating: standForm.defenseRating,
			comments: standForm.comments,
		})
		.from(standForm)
		.orderBy(desc(standForm.matchId));
}
