import "server-only";
import { verifySession } from "./auth";

import { db } from "@/lib/database";
import { standForm, UserRole } from "@/lib/database/schema";
import {
	type StandForm,
	type NewStandForm,
	type StandFormUpdate,
	type DuplicateFormGroup,
} from "@/lib/types/forms";
import { eq, sql } from "drizzle-orm";

export const forms = {
	/**
	 * Get all forms for a specific match
	 */
	getByMatchId: async (matchId: string): Promise<StandForm[]> => {
		return db
			.select()
			.from(standForm)
			.where(eq(standForm.matchId, matchId))
			.orderBy(standForm.id);
	},

	/**
	 * Get all forms for a specific team
	 */
	getByTeamNumber: async (teamNumber: number): Promise<StandForm[]> => {
		return db
			.select()
			.from(standForm)
			.where(eq(standForm.teamNumber, teamNumber))
			.orderBy(standForm.id);
	},

	/**
	 * Get all forms for a specific user
	 */
	getByUserId: async (userId: string): Promise<StandForm[]> => {
		const currentUser = await verifySession();
		if (currentUser.role !== UserRole.ADMIN && currentUser.id !== userId) {
			throw new Error("Unauthorized");
		}
		return db
			.select()
			.from(standForm)
			.where(eq(standForm.userId, userId))
			.orderBy(standForm.id);
	},

	/**
	 * Get duplicate forms (forms submitted for the same team and match)
	 */
	getDuplicates: async (): Promise<DuplicateFormGroup[]> => {
		const currentUser = await verifySession();
		if (currentUser.role !== UserRole.ADMIN) {
			throw new Error("Unauthorized");
		}
		const duplicates = await db
			.select({
				teamNumber: standForm.teamNumber,
				matchId: standForm.matchId,
				count: sql<number>`count(*)`.mapWith(Number),
				forms: sql<StandForm[]>`array_to_json(array_agg(
					jsonb_build_object(
						'id', ${standForm.id},
						'teamNumber', ${standForm.teamNumber},
						'matchId', ${standForm.matchId},
						'userId', ${standForm.userId},
						'leftBlackLine', ${standForm.leftBlackLine},
						'autoCoralLevel1', ${standForm.autoCoralLevel1},
						'autoCoralLevel2', ${standForm.autoCoralLevel2},
						'autoCoralLevel3', ${standForm.autoCoralLevel3},
						'autoCoralLevel4', ${standForm.autoCoralLevel4},
						'autoAlgaeProcessor', ${standForm.autoAlgaeProcessor},
						'autoAlgaeNet', ${standForm.autoAlgaeNet},
						'teleopCoralLevel1', ${standForm.teleopCoralLevel1},
						'teleopCoralLevel2', ${standForm.teleopCoralLevel2},
						'teleopCoralLevel3', ${standForm.teleopCoralLevel3},
						'teleopCoralLevel4', ${standForm.teleopCoralLevel4},
						'teleopAlgaeProcessor', ${standForm.teleopAlgaeProcessor},
						'teleopAlgaeNet', ${standForm.teleopAlgaeNet},
						'cageClimb', ${standForm.cageClimb},
						'defenseRating', ${standForm.defenseRating},
						'comments', ${standForm.comments}
					)
				))`,
			})
			.from(standForm)
			.groupBy(standForm.teamNumber, standForm.matchId, standForm.userId)
			.having(sql`count(*) > 1`)
			.orderBy(sql`count(*) desc`);

		return duplicates;
	},

	/**
	 * Delete a specific form by ID
	 */
	deleteById: async (id: string): Promise<StandForm[]> => {
		const currentUser = await verifySession();
		if (currentUser.role !== UserRole.ADMIN) {
			throw new Error("Unauthorized");
		}
		return db.delete(standForm).where(eq(standForm.id, id)).returning();
	},

	/**
	 * Create a new form
	 */
	create: async (data: NewStandForm): Promise<StandForm[]> => {
		const currentUser = await verifySession();
		return db
			.insert(standForm)
			.values({
				...data,
				userId: currentUser.id,
			})
			.returning();
	},

	/**
	 * Update an existing form
	 */
	update: async (id: string, data: StandFormUpdate): Promise<StandForm[]> => {
		const currentUser = await verifySession();
		if (
			currentUser.role !== UserRole.ADMIN &&
			currentUser.id !== data.userId
		) {
			throw new Error("Unauthorized");
		}
		return db
			.update(standForm)
			.set(data)
			.where(eq(standForm.id, id))
			.returning();
	},
};
