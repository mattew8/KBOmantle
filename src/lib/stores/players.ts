import { writable } from 'svelte/store';
import type { Player } from '../utils/vector.js';
import playersData from '../data/players.json';

export const allPlayers = writable<Player[]>(playersData as Player[]);


export function getPlayerById(id: string): Player | undefined {
  const players = playersData as Player[];
  return players.find(p => p.id === id);
}

export function searchPlayers(query: string): Player[] {
  const players = playersData as Player[];
  
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  return players.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.team.toLowerCase().includes(searchTerm)
  );
}