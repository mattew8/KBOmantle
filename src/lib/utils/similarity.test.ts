import { describe, it, expect } from 'vitest';
import { cosineSimilarity, calculateVectorSimilarity } from './similarity';
import type { Player, Batter } from './vector';

describe('코사인 유사도 계산', () => {
  it('동일한 벡터는 100% 유사도를 반환한다', () => {
    const vec1 = [1, 0.5, 0.3, 0.8];
    const vec2 = [1, 0.5, 0.3, 0.8];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(100, 1);
  });

  it('완전히 반대인 벡터는 0% 유사도를 반환한다', () => {
    const vec1 = [1, 1, 1, 1];
    const vec2 = [-1, -1, -1, -1];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0, 1);
  });

  it('NaN 값이 있어도 0으로 처리하여 계산한다', () => {
    const vec1 = [1, NaN, 0.3, 0.8];
    const vec2 = [1, 0.5, 0.3, 0.8];
    const result = cosineSimilarity(vec1, vec2);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('길이가 다른 벡터는 0% 유사도를 반환한다', () => {
    const vec1 = [1, 0.5, 0.3];
    const vec2 = [1, 0.5, 0.3, 0.8];
    expect(cosineSimilarity(vec1, vec2)).toBe(0);
  });
});

describe('선수 유사도 계산 시나리오', () => {
  // 테스트용 타자 데이터 생성
  const createTestBatter = (overrides: Partial<Batter> = {}): Batter => ({
    id: 'test-1',
    name: '테스트선수',
    team: '한화 이글스',
    birth_date: '1990년 01월 01일',
    image_url: 'test.jpg',
    type: 'batter',
    타율: 0.300,
    경기: 80,
    타석: 400,
    타수: 350,
    득점: 60,
    안타: 105,
    '2루타': 20,
    '3루타': 2,
    홈런: 15,
    루타: 174,
    타점: 65,
    도루: 10,
    도루실패: 3,
    볼넷: 40,
    사구: 2,
    삼진: 80,
    병살타: 12,
    장타율: 0.497,
    출루율: 0.380,
    실책: 5,
    ...overrides
  });

  describe('팀 일치 효과', () => {
    it('같은 팀, 비슷한 스탯 → 높은 유사도', () => {
      const player1 = createTestBatter({ team: '한화 이글스' });
      const player2 = createTestBatter({ team: '한화 이글스', 타율: 0.305 });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeGreaterThan(70);
    });

    it('다른 팀, 비슷한 스탯 → 중간 유사도', () => {
      const player1 = createTestBatter({ team: '한화 이글스' });
      const player2 = createTestBatter({ team: 'KIA 타이거즈' });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeGreaterThan(30);
      expect(similarity).toBeLessThan(70);
    });
  });

  describe('스탯 차이 효과', () => {
    it('같은 팀, 매우 다른 스탯 → 유사도 감소', () => {
      const player1 = createTestBatter({ 
        team: '한화 이글스', 
        타율: 0.300,
        홈런: 15,
        장타율: 0.497
      });
      const player2 = createTestBatter({ 
        team: '한화 이글스', 
        타율: 0.220,
        홈런: 2,
        장타율: 0.320
      });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeLessThan(80);
    });

    it('다른 팀, 매우 다른 스탯 → 낮은 유사도', () => {
      const player1 = createTestBatter({ 
        team: '한화 이글스', 
        타율: 0.300,
        홈런: 15,
        장타율: 0.497
      });
      const player2 = createTestBatter({ 
        team: 'KIA 타이거즈', 
        타율: 0.220,
        홈런: 2,
        장타율: 0.320
      });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeLessThan(50);
    });
  });

  describe('동일 선수 테스트', () => {
    it('완전히 동일한 선수 → 100% 유사도', () => {
      const player1 = createTestBatter();
      const player2 = createTestBatter();
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeCloseTo(100, 0);
    });
  });
});