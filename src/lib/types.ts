// ─── Core Entities ───────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  rating: number; // 1-99 overall rating
  imageUrl?: string;
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string; // emoji flag
  group: string; // A-H
  fifaRanking: number;
  tier: "elite" | "contender" | "dark_horse" | "underdog";
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  joinedAt: string;
}

// ─── League Configuration ────────────────────────────────────

export type ScoringPreset = "casual" | "standard" | "competitive";
export type DraftMode = "snake" | "straight";
export type DraftStatus = "pre_draft" | "allegiance" | "country_draft" | "player_draft" | "complete";

export interface LeagueConfig {
  id: string;
  name: string;
  adminId: string;
  scoringPreset: ScoringPreset;
  draftMode: DraftMode;
  countriesPerPerson: number;
  playersPerPerson: number;
  maxParticipants: number;
  allegianceEnabled: boolean;
  hotTakesEnabled: boolean;
  banBoostEnabled: boolean;
  asyncDraft: boolean;
  asyncDraftClockMinutes: number;
  lateJoinerPolicy: "allegiance_only" | "free_agents" | "no_join";
  draftStatus: DraftStatus;
  createdAt: string;
}

// ─── Draft ───────────────────────────────────────────────────

export interface DraftPick {
  round: number;
  pickNumber: number;
  userId: string;
  type: "country" | "player";
  countryCode?: string;
  playerId?: string;
  timestamp: string;
}

export interface DraftState {
  leagueId: string;
  status: DraftStatus;
  currentRound: number;
  currentPickIndex: number;
  draftOrder: string[]; // user IDs
  picks: DraftPick[];
  timeRemaining?: number;
}

// ─── Allegiance ──────────────────────────────────────────────

export interface AllegiancePick {
  userId: string;
  countryCode: string;
  timestamp: string;
}

// ─── Predictions ─────────────────────────────────────────────

export interface Match {
  id: string;
  homeCountry: string;
  awayCountry: string;
  matchDay: string; // ISO date
  kickoff: string; // ISO datetime
  stage: "group" | "r16" | "qf" | "sf" | "third_place" | "final";
  group?: string;
  homeScore?: number;
  awayScore?: number;
  isComplete: boolean;
  firstScorer?: string; // player ID
  manOfTheMatch?: string; // player ID
}

export type MatchEventType = "goal" | "assist" | "yellow_card" | "red_card" | "penalty_miss" | "clean_sheet" | "motm";

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string;
  countryCode: string;
  eventType: MatchEventType;
  minute?: number;
}

export interface MatchPrediction {
  userId: string;
  matchId: string;
  predictedWinner: "home" | "away" | "draw";
  predictedTotalGoals: "over" | "under"; // over/under 2.5
  predictedFirstScorer?: string; // player ID
  bannedPlayerId?: string;
  boostedPlayerId?: string;
  timestamp: string;
}

// ─── Daily Picks ─────────────────────────────────────────────

export interface DailyPick {
  userId: string;
  date: string; // ISO date
  countryOfTheDay: string; // country code
  playerOfTheDay: string; // player ID
  timestamp: string;
}

// ─── Head-to-Head ────────────────────────────────────────────

export interface HeadToHeadMatchup {
  id: string;
  date: string; // ISO date
  user1Id: string;
  user2Id: string;
  user1Lineup: string[]; // player IDs (max 3)
  user2Lineup: string[]; // player IDs (max 3)
  user1Score?: number;
  user2Score?: number;
  isLocked: boolean;
  isComplete: boolean;
}

// ─── Hot Takes ───────────────────────────────────────────────

export type HotTakeStatus = "open" | "locked" | "resolved_hit" | "resolved_miss";

export interface HotTake {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  locksAt: string;
  status: HotTakeStatus;
  backers: string[]; // user IDs
  faders: string[]; // user IDs
}

// ─── Scoring ─────────────────────────────────────────────────

export interface UserScores {
  userId: string;
  allegiance: number;
  countryDraft: number;
  playerDraft: number;
  predictions: number;
  dailyPicks: number;
  headToHead: number;
  hotTakes: number;
  total: number;
  h2hRecord: { wins: number; losses: number; draws: number };
  predictionStreak: number;
}

// ─── AI Digest ───────────────────────────────────────────────

export interface DailyDigest {
  date: string;
  leaderboardMovement: string[];
  cursedPicks: string[];
  hotTakeWatch: string[];
  roastOfTheDay: string;
  todaysStakes: string[];
}
