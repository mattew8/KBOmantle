<script lang="ts">
  import { sortedGuesses } from '../stores/game.js';
  import SimilarityBar from './SimilarityBar.svelte';
  import type { BatterStats, PitcherStats } from '../utils/vector.js';

  function formatStats(stats: BatterStats | PitcherStats, type: 'batter' | 'pitcher'): string {
    if (type === 'batter') {
      const batterStats = stats as BatterStats;
      return `타율 ${batterStats.avg.toFixed(3)} • HR ${batterStats.hr} • 타점 ${batterStats.rbi}`;
    } else {
      const pitcherStats = stats as PitcherStats;
      return `평자책 ${pitcherStats.era.toFixed(2)} • 승 ${pitcherStats.wins} • 탈삼진 ${pitcherStats.strikeouts}`;
    }
  }

  function getRankDisplay(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}위`;
  }
</script>

<div class="w-full max-w-2xl mx-auto">
  <h2 class="text-xl font-bold mb-4 text-center">추측 기록 ({$sortedGuesses.length})</h2>
  
  {#if $sortedGuesses.length === 0}
    <div class="text-center text-gray-500 py-8">
      <p>아직 추측하지 않았습니다.</p>
      <p class="text-sm mt-2">선수 이름을 입력해서 게임을 시작하세요!</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each $sortedGuesses as guess, index}
        <div class="bg-white rounded-lg shadow-md p-4 border-2 {guess.similarity >= 99.9 ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold text-gray-600 min-w-8">
                {getRankDisplay(index)}
              </span>
              <div>
                <h3 class="font-bold text-lg text-gray-900">{guess.player.name}</h3>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {guess.player.team}
                  </span>
                  <span>{guess.player.position}</span>
                  <span>{guess.player.age}세</span>
                </div>
              </div>
            </div>
            {#if guess.similarity >= 99.9}
              <div class="text-2xl">🎉</div>
            {/if}
          </div>
          
          <div class="mb-2">
            <SimilarityBar similarity={guess.similarity} />
          </div>
          
          <div class="text-xs text-gray-500">
            {formatStats(guess.player.stats, guess.player.type)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>