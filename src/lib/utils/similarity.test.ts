import { describe, it, expect } from 'vitest';
import { cosineSimilarity, calculateVectorSimilarity } from './similarity';
import type { Player } from './vector';

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
  // 테스트용 선수 데이터 생성
  const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'test-1',
    player_id: 'test-1',
    rank: 1,
    name: '테스트선수',
    team: '한화',
    avg: 0.300,
    games: 80,
    plate_appearances: 400,
    at_bats: 350,
    runs: 60,
    hits: 105,
    doubles: 20,
    triples: 2,
    home_runs: 15,
    total_bases: 174,
    rbis: 65,
    sacrifice_bunts: 3,
    sacrifice_flies: 4,
    walks: 40,
    intentional_walks: 2,
    hit_by_pitch: 5,
    strikeouts: 80,
    ground_into_double_play: 8,
    slugging_percentage: 0.497,
    on_base_percentage: 0.370,
    ops: 0.867,
    multi_hits: 25,
    risp_avg: 0.320,
    pinch_hit_avg: 0.250,
    extra_base_hits: 37,
    ground_outs: 120,
    air_outs: 100,
    go_ao_ratio: 1.20,
    game_winning_rbi: 8,
    bb_k_ratio: 0.50,
    pitches_per_pa: 4.2,
    isolated_power: 0.197,
    extra_runs: 45,
    gpa: 0.280,
    position: '내야수',
    birth_date: '1995년 3월 15일',
    height_weight: '180cm/75kg',
    image_url: '/test.jpg',
    ...overrides
  });

  describe('팀 일치 효과', () => {
    it('같은 팀, 같은 포지션, 비슷한 스탯 → 70% 이상 유사도', () => {
      const player1 = createTestPlayer({ team: '한화', position: '내야수' });
      const player2 = createTestPlayer({ team: '한화', position: '내야수', avg: 0.305 });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeGreaterThan(70);
    });

    it('같은 팀, 다른 포지션, 비슷한 스탯 → 50-70% 유사도', () => {
      const player1 = createTestPlayer({ team: '한화', position: '내야수' });
      const player2 = createTestPlayer({ team: '한화', position: '외야수' });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeGreaterThan(50);
      expect(similarity).toBeLessThan(70);
    });

    it('다른 팀, 같은 포지션, 비슷한 스탯 → 50-70% 유사도', () => {
      const player1 = createTestPlayer({ team: '한화', position: '내야수' });
      const player2 = createTestPlayer({ team: '기아', position: '내야수' });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeGreaterThan(50);
      expect(similarity).toBeLessThan(70);
    });

    it('다른 팀, 다른 포지션, 비슷한 스탯 → 30-50% 유사도', () => {
      const player1 = createTestPlayer({ team: '한화', position: '내야수' });
      const player2 = createTestPlayer({ team: '기아', position: '외야수' });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeGreaterThan(30);
      expect(similarity).toBeLessThan(50);
    });
  });

  describe('스탯 차이 효과', () => {
    it('같은 팀, 같은 포지션, 매우 다른 스탯 → 유사도 감소', () => {
      const player1 = createTestPlayer({ 
        team: '한화', 
        position: '내야수',
        avg: 0.300,
        home_runs: 15,
        ops: 0.867
      });
      const player2 = createTestPlayer({ 
        team: '한화', 
        position: '내야수',
        avg: 0.220,
        home_runs: 2,
        ops: 0.620
      });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeLessThan(80); // 팀/포지션 일치해도 스탯 차이로 감소
    });

    it('다른 팀, 다른 포지션, 매우 다른 스탯 → 30% 미만 유사도', () => {
      const player1 = createTestPlayer({ 
        team: '한화', 
        position: '내야수',
        avg: 0.300,
        home_runs: 15,
        ops: 0.867
      });
      const player2 = createTestPlayer({ 
        team: '기아', 
        position: '외야수',
        avg: 0.220,
        home_runs: 2,
        ops: 0.620
      });
      
      const similarity = calculateVectorSimilarity(player1, player2);
      expect(similarity).toBeLessThan(30);
    });
  });

  describe('극단적인 경우', () => {
    it('동일한 선수는 100% 유사도', () => {
      const player = createTestPlayer();
      const similarity = calculateVectorSimilarity(player, player);
      expect(similarity).toBe(100);
    });

    it('모든 스탯이 0인 선수와의 유사도는 매우 낮다', () => {
      const normalPlayer = createTestPlayer();
      const zeroPlayer = createTestPlayer({
        avg: 0,
        home_runs: 0,
        rbis: 0,
        ops: 0,
        slugging_percentage: 0,
        on_base_percentage: 0,
        team: '기아',
        position: '외야수'
      });
      
      const similarity = calculateVectorSimilarity(normalPlayer, zeroPlayer);
      expect(similarity).toBeLessThan(20);
    });
  });

  describe('실제 예시 시나리오', () => {
    it('권희동(한화) vs 고승민(한화) → 같은 팀이므로 높은 유사도', () => {
      const 권희동 = createTestPlayer({ 
        name: '권희동', 
        team: '한화', 
        position: '외야수',
        avg: 0.289,
        home_runs: 12,
        ops: 0.823
      });
      const 고승민 = createTestPlayer({ 
        name: '고승민', 
        team: '한화', 
        position: '내야수',
        avg: 0.275,
        home_runs: 8,
        ops: 0.756
      });
      
      const similarity = calculateVectorSimilarity(권희동, 고승민);
      expect(similarity).toBeGreaterThan(50); // 같은 팀이므로 50% 이상
    });

    it('권희동(한화) vs 최형우(기아) → 다른 팀이므로 상대적으로 낮은 유사도', () => {
      const 권희동 = createTestPlayer({ 
        name: '권희동', 
        team: '한화', 
        position: '외야수',
        avg: 0.289,
        home_runs: 12,
        ops: 0.823
      });
      const 최형우 = createTestPlayer({ 
        name: '최형우', 
        team: '기아', 
        position: '외야수',
        avg: 0.295,
        home_runs: 14,
        ops: 0.845
      });
      
      const similarity = calculateVectorSimilarity(권희동, 최형우);
      expect(similarity).toBeLessThan(65); // 다른 팀이므로 상대적으로 낮음 (현실적으로 조정)
    });

    it('고승민(한화) vs 최형우(기아) 비교에서 고승민이 더 높은 유사도', () => {
      const 권희동 = createTestPlayer({ 
        name: '권희동', 
        team: '한화', 
        position: '외야수',
        avg: 0.289,
        home_runs: 12,
        ops: 0.823
      });
      const 고승민 = createTestPlayer({ 
        name: '고승민', 
        team: '한화', 
        position: '내야수',
        avg: 0.275,
        home_runs: 8,
        ops: 0.756
      });
      const 최형우 = createTestPlayer({ 
        name: '최형우', 
        team: '기아', 
        position: '외야수',
        avg: 0.295,
        home_runs: 14,
        ops: 0.845
      });
      
      const 고승민_유사도 = calculateVectorSimilarity(권희동, 고승민);
      const 최형우_유사도 = calculateVectorSimilarity(권희동, 최형우);
      
      expect(고승민_유사도).toBeGreaterThan(최형우_유사도);
    });
  });
});