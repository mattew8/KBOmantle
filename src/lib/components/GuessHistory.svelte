<script lang="ts">
  import { guesses } from '../stores/game.js';
  import type { Guess } from '../stores/game.js';

  type SortKey = 'input' | 'name' | 'similarity' | 'rank';
  type SortDirection = 'asc' | 'desc';

  let sortKey: SortKey = $state('input');
  let sortDirection: SortDirection = $state('asc');

  function getSortedGuesses(guesses: Guess[]): Guess[] {
    const sorted = [...guesses];
    
    if (sortKey === 'input') {
      // 입력 순서 (시간순)
      sorted.sort((a, b) => sortDirection === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
    } else if (sortKey === 'name') {
      // 이름 순
      sorted.sort((a, b) => {
        const result = a.player.name.localeCompare(b.player.name, 'ko');
        return sortDirection === 'asc' ? result : -result;
      });
    } else if (sortKey === 'similarity') {
      // 유사도 순
      sorted.sort((a, b) => {
        const result = a.similarity - b.similarity;
        return sortDirection === 'asc' ? result : -result;
      });
    } else if (sortKey === 'rank') {
      // 순위 순
      sorted.sort((a, b) => {
        const result = a.player.rank - b.player.rank;
        return sortDirection === 'asc' ? result : -result;
      });
    }
    
    return sorted;
  }

  const sortedGuesses = $derived(getSortedGuesses($guesses));

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      // 같은 컨럼 클릭시 방향 전환
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // 다른 컨럼 클릭시 기본 오름차순
      sortKey = key;
      sortDirection = 'asc';
    }
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

  function getSortIcon(key: SortKey): string {
    if (sortKey !== key) return '↕️'; // 양방향 화살표
    return sortDirection === 'asc' ? '⬆️' : '⬇️'; // 오름차순/내림차순
  }
</script>

<div class="mx-auto w-full max-w-4xl">
  {#if sortedGuesses.length === 0}
    <div class="py-8 text-center">
      <div class="mb-2 text-sm text-gray-500">추측한 선수가 없습니다</div>
      <div class="text-xs text-gray-400">선수 이름을 입력해서 게임을 시작하세요!</div>
    </div>
  {:else}
    <!-- 테이블 헤더 -->
    <div class="overflow-hidden bg-white rounded-lg border border-gray-200">
      <div class="bg-gray-50 border-b border-gray-200">
        <div class="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium tracking-wider text-gray-700 uppercase">
          <div class="col-span-1">
            <button 
              onclick={() => handleSort('input')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              #
              <span class="text-xs">{getSortIcon('input')}</span>
            </button>
          </div>
          <div class="col-span-5">
            <button 
              onclick={() => handleSort('name')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              이름
              <span class="text-xs">{getSortIcon('name')}</span>
            </button>
          </div>
          <div class="col-span-3">
            <button 
              onclick={() => handleSort('similarity')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              유사도
              <span class="text-xs">{getSortIcon('similarity')}</span>
            </button>
          </div>
          <div class="col-span-3">
            <button 
              onclick={() => handleSort('rank')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              순위
              <span class="text-xs">{getSortIcon('rank')}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 테이블 내용 -->
      <div class="divide-y divide-gray-100">
        {#each sortedGuesses as guess, index}
          <div class="grid grid-cols-12 gap-4 px-4 py-3 transition-colors hover:bg-gray-50">
            <!-- 입력 순서 -->
            <div class="flex col-span-1 items-center">
              <span class="text-sm text-gray-500">{$guesses.findIndex(g => g.timestamp === guess.timestamp) + 1}</span>
            </div>
            
            <!-- 선수 (이미지 + 이름) -->
            <div class="flex col-span-5 gap-3 items-center">
              <img 
                src={guess.player.image_url} 
                alt={guess.player.name}
                class="object-cover flex-shrink-0 w-10 h-12 rounded border border-gray-200"
                loading="lazy"
                onerror={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0MCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNEMyNS41MjI4IDI0IDMwIDE5LjUyMjggMzAgMTRDMzAgOC40NzcyIDI1LjUyMjggNCAyMCA0QzE0LjQ3NzIgNCA5IDguNDc3MiA5IDE0QzkgMTkuNTIyOCAxNC40NzcyIDI0IDIwIDI0WiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTIgMzRIMjhMMjYgNDVINEwxMiAzNFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';
                }}
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">
                  {guess.player.name}
                </div>
                <div class="text-xs text-gray-500">
                  {guess.player.team} • {guess.player.position.replace(/\([^)]*\)/g, '').trim()}
                </div>
              </div>
            </div>
            
            <!-- 유사도 -->
            <div class="flex col-span-3 items-center">
              <div class="w-full">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-bold {getSimilarityTextColor(guess.similarity)}">
                    {guess.similarity.toFixed(1)}%
                  </span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    class="h-2 {getSimilarityBarColor(guess.similarity)} rounded-full transition-all duration-500"
                    style="width: {guess.similarity}%"
                  ></div>
                </div>
              </div>
            </div>
            
            <!-- 순위 -->
            <div class="flex col-span-3 items-center">
              <div class="text-sm text-gray-900">
                #{guess.player.rank}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>