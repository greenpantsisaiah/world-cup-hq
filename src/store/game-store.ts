"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  LeagueConfig,
  DraftState,
  DraftPick,
  AllegiancePick,
  MatchPrediction,
  DailyPick,
  HeadToHeadMatchup,
  HotTake,
  UserScores,
  DraftStatus,
} from "@/lib/types";
import { v4 as uuid } from "uuid";

interface GameState {
  // Auth
  currentUser: User | null;
  users: User[];

  // League
  league: LeagueConfig | null;

  // Draft
  draftState: DraftState | null;
  allegiances: AllegiancePick[];

  // Predictions
  predictions: MatchPrediction[];
  dailyPicks: DailyPick[];

  // H2H
  h2hMatchups: HeadToHeadMatchup[];

  // Hot Takes
  hotTakes: HotTake[];

  // Scores
  scores: UserScores[];

  // Actions
  setCurrentUser: (user: User) => void;
  createLeague: (config: Partial<LeagueConfig>) => void;
  joinLeague: (userName: string) => void;
  setAllegiance: (countryCode: string) => void;
  advanceDraftStatus: (status: DraftStatus) => void;
  makeDraftPick: (pick: Omit<DraftPick, "timestamp">) => void;
  submitPrediction: (prediction: Omit<MatchPrediction, "timestamp">) => void;
  submitDailyPick: (pick: Omit<DailyPick, "timestamp" | "userId">) => void;
  setH2HLineup: (matchupId: string, lineup: string[]) => void;
  submitHotTake: (text: string, locksAt: string) => void;
  backHotTake: (takeId: string) => void;
  fadeHotTake: (takeId: string) => void;
  initDraft: (type: "country" | "player") => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      league: null,
      draftState: null,
      allegiances: [],
      predictions: [],
      dailyPicks: [],
      h2hMatchups: [],
      hotTakes: [],
      scores: [],

      setCurrentUser: (user) => set({ currentUser: user }),

      createLeague: (config) => {
        const league: LeagueConfig = {
          id: uuid(),
          name: config.name || "Office World Cup 2026",
          adminId: get().currentUser?.id || "",
          scoringPreset: config.scoringPreset || "standard",
          draftMode: config.draftMode || "snake",
          countriesPerPerson: config.countriesPerPerson || 2,
          playersPerPerson: config.playersPerPerson || 5,
          maxParticipants: config.maxParticipants || 16,
          allegianceEnabled: config.allegianceEnabled ?? true,
          hotTakesEnabled: config.hotTakesEnabled ?? true,
          banBoostEnabled: config.banBoostEnabled ?? true,
          asyncDraft: config.asyncDraft ?? false,
          asyncDraftClockMinutes: config.asyncDraftClockMinutes || 60,
          lateJoinerPolicy: config.lateJoinerPolicy || "free_agents",
          draftStatus: "pre_draft",
          createdAt: new Date().toISOString(),
        };
        set({ league });
      },

      joinLeague: (userName) => {
        const user: User = {
          id: uuid(),
          name: userName,
          isAdmin: get().users.length === 0,
          joinedAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [...state.users, user],
          currentUser: user,
        }));
      },

      setAllegiance: (countryCode) => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        const existing = get().allegiances.filter((a) => a.userId !== userId);
        set({
          allegiances: [
            ...existing,
            { userId, countryCode, timestamp: new Date().toISOString() },
          ],
        });
      },

      advanceDraftStatus: (status) => {
        set((state) => ({
          league: state.league ? { ...state.league, draftStatus: status } : null,
        }));
      },

      initDraft: (type) => {
        const users = get().users;
        const draftOrder = users.map((u) => u.id);
        set({
          draftState: {
            leagueId: get().league?.id || "",
            status: type === "country" ? "country_draft" : "player_draft",
            currentRound: 1,
            currentPickIndex: 0,
            draftOrder,
            picks: get().draftState?.picks.filter((p) => p.type !== type) || [],
          },
        });
      },

      makeDraftPick: (pick) => {
        const state = get();
        if (!state.draftState) return;

        const newPick: DraftPick = {
          ...pick,
          timestamp: new Date().toISOString(),
        };

        const picks = [...state.draftState.picks, newPick];
        const totalPlayers = state.draftState.draftOrder.length;
        let nextIndex = state.draftState.currentPickIndex + 1;
        let nextRound = state.draftState.currentRound;

        if (nextIndex >= totalPlayers) {
          nextRound++;
          nextIndex = 0;
        }

        // Snake: reverse order on even rounds
        const isSnakeReverse =
          state.league?.draftMode === "snake" && nextRound % 2 === 0;

        set({
          draftState: {
            ...state.draftState,
            picks,
            currentRound: nextRound,
            currentPickIndex: isSnakeReverse
              ? totalPlayers - 1 - nextIndex
              : nextIndex,
          },
        });
      },

      submitPrediction: (prediction) => {
        const existing = get().predictions.filter(
          (p) =>
            !(p.userId === prediction.userId && p.matchId === prediction.matchId)
        );
        set({
          predictions: [
            ...existing,
            { ...prediction, timestamp: new Date().toISOString() },
          ],
        });
      },

      submitDailyPick: (pick) => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        const existing = get().dailyPicks.filter(
          (p) => !(p.userId === userId && p.date === pick.date)
        );
        set({
          dailyPicks: [
            ...existing,
            { ...pick, userId, timestamp: new Date().toISOString() },
          ],
        });
      },

      setH2HLineup: (matchupId, lineup) => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        set((state) => ({
          h2hMatchups: state.h2hMatchups.map((m) => {
            if (m.id !== matchupId) return m;
            if (m.user1Id === userId) return { ...m, user1Lineup: lineup };
            if (m.user2Id === userId) return { ...m, user2Lineup: lineup };
            return m;
          }),
        }));
      },

      submitHotTake: (text, locksAt) => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        const take: HotTake = {
          id: uuid(),
          authorId: userId,
          text,
          createdAt: new Date().toISOString(),
          locksAt,
          status: "open",
          backers: [],
          faders: [],
        };
        set((state) => ({ hotTakes: [...state.hotTakes, take] }));
      },

      backHotTake: (takeId) => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        set((state) => ({
          hotTakes: state.hotTakes.map((t) => {
            if (t.id !== takeId || t.status !== "open") return t;
            const faders = t.faders.filter((id) => id !== userId);
            const backers = t.backers.includes(userId)
              ? t.backers
              : [...t.backers, userId];
            return { ...t, backers, faders };
          }),
        }));
      },

      fadeHotTake: (takeId) => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        set((state) => ({
          hotTakes: state.hotTakes.map((t) => {
            if (t.id !== takeId || t.status !== "open") return t;
            const backers = t.backers.filter((id) => id !== userId);
            const faders = t.faders.includes(userId)
              ? t.faders
              : [...t.faders, userId];
            return { ...t, backers, faders };
          }),
        }));
      },
    }),
    {
      name: "world-cup-hq",
    }
  )
);
