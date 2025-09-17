import { z } from "zod";

export const TeamSimpleSchema = z.object({
	key: z.string().regex(/^frc\d+$/),
	team_number: z.number().positive(),
	nickname: z.string().nonempty(),
	name: z.string().nonempty(),
	city: z.string().nonempty(),
	state_prov: z.string().nonempty(),
	country: z.string().nonempty(),
});

export type TeamSimple = z.infer<typeof TeamSimpleSchema>;

export const TeamSchema = TeamSimpleSchema.extend({
	address: z.string().nullable(),
	postal_code: z.string().nullable(),
	gmaps_place_id: z.string().nullable(),
	gmaps_url: z.string().nullable(),
	lat: z.number().nullable(),
	lng: z.number().nullable(),
	location_name: z.string().nullable(),
	motto: z.string().nullable().optional(),
	rookie_year: z.number(),
	school_name: z.string().nullable(),
	website: z.string().nullable(),
});

export type Team = z.infer<typeof TeamSchema>;
