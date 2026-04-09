// Tournament-agnostic simulation format
// Works for 2026 predictions AND historical World Cups (1930-2022)

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  countries: string[]; // country codes drafted
  allegiance: string;
  players: string[]; // player IDs drafted
  color: string;
}

export interface SimDay {
  day: number;
  title: string;
  matches: SimMatch[];
  commentary: string[]; // AI quips, one per persona
  hotTakeUpdate?: { text: string; status: "hit" | "miss" | "trending" };
  h2hResult?: { opponent: string; yourScore: number; theirScore: number };
  leaderboard: SimLeaderboardEntry[];
  scoreDeltas: Record<string, number>; // persona ID → points gained this day
  awards?: { icon: string; name: string; winner: string }[];
}

export interface SimMatch {
  home: string; // country code
  away: string;
  homeScore: number;
  awayScore: number;
  stage: string;
  scorers: string[]; // player IDs
  motm?: string; // player ID
}

export interface SimLeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isYou: boolean;
  delta: number; // rank change
}

export interface Timeline {
  id: string;
  name: string;
  description: string;
  icon: string;
  tournament: string; // "2026" or "2022" or "1998" etc.
  tone: "favorites_win" | "chaos" | "dramatic";
  days: SimDay[];
  finalMessage: string;
}
