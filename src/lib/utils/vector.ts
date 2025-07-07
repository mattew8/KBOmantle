import { normalize, reverseNormalize, TEAM_CODES, POSITION_CODES } from './normalize.js';

export interface BatterStats {
  avg: number;
  hr: number;
  rbi: number;
  sb: number;
  ops: number;
}

export interface PitcherStats {
  era: number;
  wins: number;
  strikeouts: number;
  innings: number;
  whip: number;
}

export interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  age: number;
  type: 'batter' | 'pitcher';
  stats: BatterStats | PitcherStats;
}

export function createBatterVector(player: Player): number[] {
  const stats = player.stats as BatterStats;
  const teamCode = TEAM_CODES[player.team] || 1;
  const positionCode = POSITION_CODES[player.position] || 1;

  return [
    normalize(stats.avg, 0.2, 0.4),
    normalize(stats.hr, 0, 50),
    normalize(stats.rbi, 0, 120),
    normalize(stats.sb, 0, 30),
    normalize(stats.ops, 0.5, 1.2),
    normalize(player.age, 20, 45),
    normalize(teamCode, 1, 11),
    normalize(positionCode, 2, 10),
  ];
}

export function createPitcherVector(player: Player): number[] {
  const stats = player.stats as PitcherStats;
  const teamCode = TEAM_CODES[player.team] || 1;

  return [
    reverseNormalize(stats.era, 1.5, 6.0),
    normalize(stats.wins, 0, 20),
    normalize(stats.strikeouts, 50, 250),
    normalize(stats.innings, 50, 250),
    reverseNormalize(stats.whip, 0.8, 2.0),
    normalize(player.age, 20, 45),
    normalize(teamCode, 1, 11),
    1.0,
  ];
}

export function playerToVector(player: Player): number[] {
  if (player.type === 'batter') {
    return createBatterVector(player);
  } else {
    return createPitcherVector(player);
  }
}