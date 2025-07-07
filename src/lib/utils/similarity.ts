import { playerToVector, type Player } from './vector.js';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  const validVecA = vecA.map((v) => (isNaN(v) ? 0 : v));
  const validVecB = vecB.map((v) => (isNaN(v) ? 0 : v));

  const dotProduct = validVecA.reduce((sum, a, i) => sum + a * validVecB[i], 0);

  const magnitudeA = Math.sqrt(validVecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(validVecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  const similarity = dotProduct / (magnitudeA * magnitudeB);

  return Math.max(0, Math.min(100, ((similarity + 1) / 2) * 100));
}

export function calculateVectorSimilarity(guessPlayer: Player, targetPlayer: Player): number {
  if (guessPlayer.type !== targetPlayer.type) {
    throw new Error('Different player types');
  }

  const guessVector = playerToVector(guessPlayer);
  const targetVector = playerToVector(targetPlayer);

  return cosineSimilarity(guessVector, targetVector);
}

const vectorCache = new Map<string, number[]>();

export function getCachedVector(player: Player): number[] {
  const key = `${player.id}-${player.type}`;
  if (!vectorCache.has(key)) {
    vectorCache.set(key, playerToVector(player));
  }
  return vectorCache.get(key)!;
}