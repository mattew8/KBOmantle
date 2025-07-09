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
  console.log('추측 선수:', guessPlayer.name, guessPlayer.id);
  console.log('정답 선수:', targetPlayer.name, targetPlayer.id);
  console.log('벡터 차원:', guessVector.length);
  
  const rawSimilarity = cosineSimilarity(guessVector, targetVector);
  console.log('원본 코사인 유사도:', rawSimilarity);
  
  // 🎆 순수 벡터 기반 비선형 변환 - 자연스러운 분포
  let adjustedSimilarity;
  
  if (rawSimilarity > 99) {
    // 99%+ = “정답에 근접” 🔥 (99-100 → 90-100)
    adjustedSimilarity = 90 + (rawSimilarity - 99) * (10 / 1);
  } else if (rawSimilarity > 97) {
    // 97-99% = “매우 뜨거운” 🔥 (97-99 → 75-90)
    adjustedSimilarity = 75 + (rawSimilarity - 97) * (15 / 2);
  } else if (rawSimilarity > 94) {
    // 94-97% = “뜨거운” 🔥 (94-97 → 60-75)
    adjustedSimilarity = 60 + (rawSimilarity - 94) * (15 / 3);
  } else if (rawSimilarity > 90) {
    // 90-94% = “따뜻한” 🔥 (90-94 → 45-60)
    adjustedSimilarity = 45 + (rawSimilarity - 90) * (15 / 4);
  } else if (rawSimilarity > 85) {
    // 85-90% = “미지근하지” 🔥 (85-90 → 32-45)
    adjustedSimilarity = 32 + (rawSimilarity - 85) * (13 / 5);
  } else if (rawSimilarity > 80) {
    // 80-85% = “서늘하지” 🔥 (80-85 → 22-32)
    adjustedSimilarity = 22 + (rawSimilarity - 80) * (10 / 5);
  } else if (rawSimilarity > 70) {
    // 70-80% = “살짝 차가운” 🔥 (70-80 → 12-22)
    adjustedSimilarity = 12 + (rawSimilarity - 70) * (10 / 10);
  } else if (rawSimilarity > 60) {
    // 60-70% = “차가운” 🧊 (60-70 → 6-12)
    adjustedSimilarity = 6 + (rawSimilarity - 60) * (6 / 10);
  } else if (rawSimilarity > 50) {
    // 50-60% = “차가운” 🧊 (50-60 → 2-6)
    adjustedSimilarity = 2 + (rawSimilarity - 50) * (4 / 10);
  } else if (rawSimilarity > 40) {
    // 40-50% = “얼음” 🧊 (40-50 → 0.5-2)
    adjustedSimilarity = 0.5 + (rawSimilarity - 40) * (1.5 / 10);
  } else {
    // 0-40% = “얼음” 🧊 (0-40 → 0-0.5)
    adjustedSimilarity = rawSimilarity * (0.5 / 40);
  }
  
  console.log('조정된 유사도:', adjustedSimilarity);
  
  // 소수점 한 자리로 반올림하여 정밀도 차이 최소화
  const roundedSimilarity = Math.round(adjustedSimilarity * 10) / 10;
  console.log('반올림된 최종 유사도:', roundedSimilarity);
  
  return Math.max(0, Math.min(100, roundedSimilarity));
}

const vectorCache = new Map<string, number[]>();

export function getCachedVector(player: Player): number[] {
  const key = `${player.id}`;
  if (!vectorCache.has(key)) {
    vectorCache.set(key, playerToVector(player));
  }
  return vectorCache.get(key)!;
}