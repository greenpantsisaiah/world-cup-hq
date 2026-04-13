/**
 * Pure functions for snake draft logic.
 * No side effects, no DB calls — just math.
 */

/**
 * Get the drafter index for a given pick number in a snake draft.
 * Round 1: 0,1,2,...,N-1
 * Round 2: N-1,...,2,1,0
 * Round 3: 0,1,2,...,N-1 (repeats)
 */
export function getSnakeDrafterIndex(pickNumber: number, totalParticipants: number): number {
  if (totalParticipants <= 0) return 0;
  const round = Math.floor(pickNumber / totalParticipants);
  const positionInRound = pickNumber % totalParticipants;

  // Even rounds (0, 2, 4...): forward
  // Odd rounds (1, 3, 5...): reverse
  if (round % 2 === 0) {
    return positionInRound;
  }
  return totalParticipants - 1 - positionInRound;
}

/**
 * Get the user ID of the current drafter.
 */
export function getCurrentDrafter(
  draftOrder: string[],
  currentPickNumber: number
): string | null {
  if (draftOrder.length === 0) return null;
  const index = getSnakeDrafterIndex(currentPickNumber, draftOrder.length);
  return draftOrder[index] || null;
}

/**
 * Check if it's a specific user's turn to pick.
 */
export function isMyTurn(
  userId: string,
  draftOrder: string[],
  currentPickNumber: number
): boolean {
  return getCurrentDrafter(draftOrder, currentPickNumber) === userId;
}

/**
 * Get the current round number (1-indexed).
 */
export function getCurrentRound(currentPickNumber: number, totalParticipants: number): number {
  if (totalParticipants <= 0) return 1;
  return Math.floor(currentPickNumber / totalParticipants) + 1;
}

/**
 * Get the pick number within the current round (1-indexed).
 */
export function getPickInRound(currentPickNumber: number, totalParticipants: number): number {
  if (totalParticipants <= 0) return 1;
  return (currentPickNumber % totalParticipants) + 1;
}

/**
 * Check if all picks for a given phase are complete.
 */
export function isDraftPhaseComplete(
  currentPickNumber: number,
  totalParticipants: number,
  roundsInPhase: number
): boolean {
  return currentPickNumber >= totalParticipants * roundsInPhase;
}

/**
 * Generate a random draft order from member IDs.
 */
export function generateRandomDraftOrder(memberIds: string[]): string[] {
  const shuffled = [...memberIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
