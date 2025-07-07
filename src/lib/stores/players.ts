import { writable, derived } from 'svelte/store';
import { targetPlayer } from './game.js';
import type { Player } from '../utils/vector.js';
import playersData from '../data/players.json';

export const allPlayers = writable<Player[]>(playersData as Player[]);

export const availablePlayers = derived(
  [allPlayers, targetPlayer],
  ([$allPlayers, $targetPlayer]) => {
    if (!$targetPlayer) return [];
    return $allPlayers.filter((p) => p.type === $targetPlayer.type);
  }
);

export const batters = derived(allPlayers, ($allPlayers) =>
  $allPlayers.filter(p => p.type === 'batter')
);

export const pitchers = derived(allPlayers, ($allPlayers) =>
  $allPlayers.filter(p => p.type === 'pitcher')
);

export function getRandomPlayer(type?: 'batter' | 'pitcher'): Player {
  const players = playersData as Player[];
  const filtered = type ? players.filter(p => p.type === type) : players;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getPlayerById(id: number): Player | undefined {
  const players = playersData as Player[];
  return players.find(p => p.id === id);
}

export function searchPlayers(query: string, type?: 'batter' | 'pitcher'): Player[] {
  const players = playersData as Player[];
  const filtered = type ? players.filter(p => p.type === type) : players;
  
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  return filtered.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.team.toLowerCase().includes(searchTerm) ||
    p.position.toLowerCase().includes(searchTerm)
  );
}