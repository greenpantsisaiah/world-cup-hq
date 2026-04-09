// ─── Scoring Constants ───────────────────────────────────────

export const COUNTRY_SCORING = {
  GOAL_SCORED: 3,
  GOAL_CONCEDED: -1,
  WIN: 5,
  DRAW: 2,
  CLEAN_SHEET: 4,
  ADVANCE_ROUND: 10,
  WIN_TOURNAMENT: 30,
  ALLEGIANCE_MULTIPLIER: 0.5,
} as const;

export const PLAYER_SCORING = {
  GOAL: 5,
  ASSIST: 3,
  CLEAN_SHEET_GK_DEF: 4,
  MAN_OF_THE_MATCH: 3,
  YELLOW_CARD: -1,
  RED_CARD: -3,
  PENALTY_MISS: -2,
  HAT_TRICK_BONUS: 5,
} as const;

export const PREDICTION_SCORING = {
  CORRECT_WINNER: 3,
  CORRECT_OVER_UNDER: 2,
  CORRECT_FIRST_SCORER: 5,
  STREAK_THRESHOLD: 5,
  STREAK_MULTIPLIER: 1.5,
} as const;

export const DAILY_PICK_SCORING = {
  COUNTRY_WIN: 5,
  PLAYER_SCORES: 8,
  PLAYER_MOTM: 5,
} as const;

export const H2H_SCORING = {
  WIN: 10,
  DRAW: 3,
  SHUTOUT_BONUS: 5,
} as const;

// ─── Scoring Functions ──────────────────────────────────────

export function calcContrarianMultiplier(
  totalPickers: number,
  yourChoicePickers: number
): number {
  if (yourChoicePickers === 0) return 0;
  return Math.round((totalPickers / yourChoicePickers) * 10) / 10;
}

export function calcHotTakePoints(
  totalParticipants: number,
  backerCount: number,
  didHit: boolean
): number {
  if (!didHit) return 0;
  const BASE = 10;
  const popularityRatio = backerCount / totalParticipants;
  return Math.round(BASE * (1 / Math.max(popularityRatio, 0.05)));
}

export function calcCountryMatchPoints(
  goalsScored: number,
  goalsConceded: number,
  isWin: boolean,
  isDraw: boolean,
  isAllegiance: boolean
): number {
  let points = 0;
  points += goalsScored * COUNTRY_SCORING.GOAL_SCORED;
  points += goalsConceded * COUNTRY_SCORING.GOAL_CONCEDED;
  if (isWin) points += COUNTRY_SCORING.WIN;
  if (isDraw) points += COUNTRY_SCORING.DRAW;
  if (goalsConceded === 0) points += COUNTRY_SCORING.CLEAN_SHEET;

  if (isAllegiance) {
    points = Math.round(points * COUNTRY_SCORING.ALLEGIANCE_MULTIPLIER);
  }

  return points;
}
