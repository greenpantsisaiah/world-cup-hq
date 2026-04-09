import { z } from "zod";

export const createLeagueSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  scoring_preset: z.enum(["casual", "standard", "competitive"]),
  draft_mode: z.enum(["snake", "straight"]),
  countries_per_person: z.number().int().min(1).max(8),
  players_per_person: z.number().int().min(3).max(8),
  max_participants: z.number().int().min(2).max(50),
  allegiance_enabled: z.boolean(),
  hot_takes_enabled: z.boolean(),
  ban_boost_enabled: z.boolean(),
  async_draft: z.boolean(),
});

export const inviteCodeSchema = z
  .string()
  .min(12)
  .max(16)
  .regex(/^[a-zA-Z0-9]+$/, "Invite code must be alphanumeric");

export const hotTakeSchema = z.object({
  text: z.string().min(5).max(500).trim(),
  locks_at: z.string().datetime(),
});

export const draftPickSchema = z.object({
  pick_type: z.enum(["country", "player"]),
  country_code: z.string().max(10).optional(),
  player_id: z.string().max(50).optional(),
  round: z.number().int().min(1).max(20),
  pick_number: z.number().int().min(1).max(500),
});

export const predictionSchema = z.object({
  match_id: z.string().max(50),
  predicted_winner: z.enum(["home", "away", "draw"]),
  predicted_total_goals: z.enum(["over", "under"]),
  predicted_first_scorer: z.string().max(50).optional(),
  banned_player_id: z.string().max(50).optional(),
  boosted_player_id: z.string().max(50).optional(),
});

export const dailyPickSchema = z.object({
  pick_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country_of_the_day: z.string().max(10),
  player_of_the_day: z.string().max(50),
});

export const allegianceSchema = z.object({
  country_code: z.string().max(10),
});

// UUID format without strict RFC 4122 version/variant enforcement
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidSchema = z.string().regex(uuidPattern, "Invalid UUID format");

export const h2hLineupSchema = z.object({
  matchup_id: uuidSchema,
  lineup: z.array(z.string().max(50)).max(3),
});

export const hotTakeVoteSchema = z.object({
  hot_take_id: uuidSchema,
  vote: z.enum(["back", "fade"]),
});

export const leagueIdSchema = uuidSchema;

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format");
