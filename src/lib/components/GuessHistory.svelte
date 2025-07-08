<script lang="ts">
  import { sortedGuesses } from '../stores/game.js';
  import type { Player } from '../utils/vector.js';

  function formatStats(player: Player): string {
    return `타율 ${player.avg.toFixed(3)} • ${player.home_runs}HR • ${player.rbis}타점 • ${player.runs}득점`;
  }

  function getRankDisplay(index: number): string {
    if (index === 0) return '1';
    if (index === 1) return '2';
    if (index === 2) return '3';
    return `${index + 1}`;
  }

  function getSimilarityTextColor(similarity: number): string {
    if (similarity >= 99.9) return 'text-yellow-600';
    if (similarity >= 90) return 'text-green-600';
    if (similarity >= 80) return 'text-lime-600';
    if (similarity >= 70) return 'text-yellow-600';
    if (similarity >= 60) return 'text-orange-600';
    if (similarity >= 50) return 'text-red-600';
    return 'text-gray-600';
  }

  function getSimilarityBarColor(similarity: number): string {
    if (similarity >= 99.9) return 'bg-yellow-400';
    if (similarity >= 90) return 'bg-green-400';
    if (similarity >= 80) return 'bg-lime-400';
    if (similarity >= 70) return 'bg-yellow-400';
    if (similarity >= 60) return 'bg-orange-400';
    if (similarity >= 50) return 'bg-red-400';
    return 'bg-gray-400';
  }
</script>

<div class="w-full max-w-2xl mx-auto">
  {#if $sortedGuesses.length === 0}
    <div class="text-center py-8">
      <div class="text-gray-500 text-sm mb-2">추측한 선수가 없습니다</div>
      <div class="text-gray-400 text-xs">선수 이름을 입력해서 게임을 시작하세요!</div>
    </div>
  {:else}
    <div class="space-y-1">
      {#each $sortedGuesses as guess, index}
        <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="text-sm font-medium text-gray-900">
                {guess.player.name}
              </div>
              <div class="text-xs text-gray-500">
                {guess.player.team} • 타율 {guess.player.avg.toFixed(3)} • {guess.player.home_runs}HR
              </div>
            </div>
            <div class="text-sm font-bold {getSimilarityTextColor(guess.similarity)}">
              {guess.similarity.toFixed(1)}%
            </div>
          </div>
          
          <!-- Similarity Bar -->
          <div class="mb-2">
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                class="h-full {getSimilarityBarColor(guess.similarity)} transition-all duration-700 ease-out rounded-full"
                style="width: {guess.similarity}%"
              ></div>
            </div>
          </div>
          
          <!-- Stats -->
          <div class="text-xs text-gray-600">
            {formatStats(guess.player)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>