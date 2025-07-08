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
  const guessVector = playerToVector(guessPlayer);
  const targetVector = playerToVector(targetPlayer);

  // 디버깅을 위해 콘솔에 벡터 정보 출력
  console.log('=== 유사도 디버깅 ===');
  console.log('추측 선수:', guessPlayer.name);
  console.log('추측 벡터:', guessVector);
  console.log('정답 선수:', targetPlayer.name);
  console.log('정답 벡터:', targetVector);
  
  const rawSimilarity = cosineSimilarity(guessVector, targetVector);
  console.log('원본 코사인 유사도:', rawSimilarity);
  
  // 비선형 변환으로 차이 극대화
  let adjustedSimilarity;
  if (rawSimilarity > 85) {
    // 85% 이상은 매우 유사 (85-100 구간을 60-100으로 확장)
    adjustedSimilarity = 60 + (rawSimilarity - 85) * (40 / 15);
  } else if (rawSimilarity > 70) {
    // 70-85%는 유사 (70-85 구간을 30-60으로 확장) 
    adjustedSimilarity = 30 + (rawSimilarity - 70) * (30 / 15);
  } else if (rawSimilarity > 50) {
    // 50-70%는 보통 (50-70 구간을 10-30으로 확장)
    adjustedSimilarity = 10 + (rawSimilarity - 50) * (20 / 20);
  } else {
    // 50% 이하는 매우 다름 (0-50 구간을 0-10으로 압축)
    adjustedSimilarity = rawSimilarity * (10 / 50);
  }
  
  console.log('조정된 유사도:', adjustedSimilarity);
  
  return Math.max(0, Math.min(100, adjustedSimilarity));
}

const vectorCache = new Map<string, number[]>();

export function getCachedVector(player: Player): number[] {
  const key = `${player.id}`;
  if (!vectorCache.has(key)) {
    vectorCache.set(key, playerToVector(player));
  }
  return vectorCache.get(key)!;
}