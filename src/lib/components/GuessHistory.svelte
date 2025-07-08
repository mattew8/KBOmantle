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

<div class="mx-auto w-full max-w-2xl">
  {#if $sortedGuesses.length === 0}
    <div class="py-8 text-center">
      <div class="mb-2 text-sm text-gray-500">추측한 선수가 없습니다</div>
      <div class="text-xs text-gray-400">선수 이름을 입력해서 게임을 시작하세요!</div>
    </div>
  {:else}
    <div class="space-y-1">
      {#each $sortedGuesses as guess}
        <div class="p-4 bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-sm">
          <div class="flex gap-4 items-start mb-3">
            <!-- 선수 이미지 -->
            <div class="flex-shrink-0">
              <img 
                src={guess.player.image_url} 
                alt={guess.player.name}
                class="object-cover w-16 h-20 rounded-lg border border-gray-200"
                loading="lazy"
                on:error={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2NCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0MEM0MS45NDExIDQwIDUwIDMxLjk0MTEgNTAgMjJDNTAgMTIuMDU4OSA0MS45NDExIDQgMzIgNEMyMi4wNTg5IDQgMTQgMTIuMDU4OSAxNCAyMkMxNCAzMS45NDExIDIyLjA1ODkgNDAgMzIgNDBaIiBmaWxsPSIjRDFENUNCIi8+CjxwYXRoIGQ9Ik0yMCA1Nkg0NEw0MCA3Nkg3TDIwIDU2WiIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K';
                }}
              />
            </div>
            
            <!-- 선수 정보 -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-2">
                <div class="text-sm font-medium text-gray-900 truncate">
                  {guess.player.name}
                </div>
                <div class="text-sm font-bold {getSimilarityTextColor(guess.similarity)} ml-2">
                  {guess.similarity.toFixed(1)}%
                </div>
              </div>
              <div class="mb-1 text-xs text-gray-500">
                {guess.player.team} • {guess.player.position.replace(/\([^)]*\)/g, '').trim()}
              </div>
              <div class="text-xs text-gray-500">
                타율 {guess.player.avg.toFixed(3)} • {guess.player.home_runs}HR • {guess.player.rbis}타점
              </div>
            </div>
          </div>
          
          <!-- Similarity Bar -->
          <div class="mb-2">
            <div class="overflow-hidden w-full h-2 bg-gray-100 rounded-full">
              <div 
                class="h-full {getSimilarityBarColor(guess.similarity)} transition-all duration-700 ease-out rounded-full"
                style="width: {guess.similarity}%"
              ></div>
            </div>
          </div>
          
          <!-- 추가 정보 -->
          <div class="p-2 text-xs text-gray-500 bg-gray-50 rounded">
            {guess.player.birth_date} • {guess.player.height_weight}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>