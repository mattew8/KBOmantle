<script lang="ts">
  import { guesses } from '../stores/game.js';
  import type { Guess } from '../stores/game.js';
  import { onMount } from 'svelte';

  type SortKey = 'input' | 'name' | 'similarity' | 'rank';
  type SortDirection = 'asc' | 'desc';

  let sortKey: SortKey = $state('input');
  let sortDirection: SortDirection = $state('asc');
  let expandedPlayerId: string | null = $state(null);

  // 로컬스토리지에서 정렬 설정 복원
  onMount(() => {
    try {
      const savedSortKey = localStorage.getItem('kbomantle-sort-key');
      const savedSortDirection = localStorage.getItem('kbomantle-sort-direction');
      
      if (savedSortKey && ['input', 'name', 'similarity', 'rank'].includes(savedSortKey)) {
        sortKey = savedSortKey as SortKey;
      }
      
      if (savedSortDirection && ['asc', 'desc'].includes(savedSortDirection)) {
        sortDirection = savedSortDirection as SortDirection;
      }
    } catch (error) {
      console.warn('로컬스토리지에서 정렬 설정을 불러올 수 없습니다:', error);
    }
  });

  // 정렬 설정이 변경될 때마다 로컬스토리지에 저장
  function saveSortSettings() {
    try {
      localStorage.setItem('kbomantle-sort-key', sortKey);
      localStorage.setItem('kbomantle-sort-direction', sortDirection);
    } catch (error) {
      console.warn('로컬스토리지에 정렬 설정을 저장할 수 없습니다:', error);
    }
  }

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
    
    // 로컬스토리지에 저장
    saveSortSettings();
  }

  // 행 클릭 핸들러 (드롭다운 토글)
  function handleRowClick(playerId: string) {
    if (expandedPlayerId === playerId) {
      expandedPlayerId = null; // 이미 열려있으면 닫기
    } else {
      expandedPlayerId = playerId; // 다른 행 열기
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
        <div class="grid grid-cols-12 gap-2 sm:gap-4 px-2 sm:px-4 py-3 text-xs font-medium tracking-wider text-gray-700 uppercase">
          <div class="col-span-1">
            <button 
              onclick={() => handleSort('input')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              #
              <span class="text-xs hidden sm:inline">{getSortIcon('input')}</span>
            </button>
          </div>
          <div class="col-span-5 sm:col-span-5">
            <button 
              onclick={() => handleSort('name')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              이름
              <span class="text-xs hidden sm:inline">{getSortIcon('name')}</span>
            </button>
          </div>
          <div class="col-span-3">
            <button 
              onclick={() => handleSort('similarity')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              유사도
              <span class="text-xs hidden sm:inline">{getSortIcon('similarity')}</span>
            </button>
          </div>
          <div class="col-span-3">
            <button 
              onclick={() => handleSort('rank')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              순위
              <span class="text-xs hidden sm:inline">{getSortIcon('rank')}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 테이블 내용 -->
      <div class="divide-y divide-gray-100">
        {#each sortedGuesses as guess}
          <!-- 클릭 가능한 행 -->
          <button 
            class="w-full text-left transition-colors hover:bg-gray-50 {expandedPlayerId === guess.player.id ? 'bg-blue-50' : ''}"
            onclick={() => handleRowClick(guess.player.id)}
          >
            <div class="grid grid-cols-12 gap-2 sm:gap-4 px-2 sm:px-4 py-3">
              <!-- 입력 순서 -->
              <div class="flex col-span-1 items-center">
                <span class="text-xs sm:text-sm text-gray-500">{$guesses.findIndex(g => g.timestamp === guess.timestamp) + 1}</span>
              </div>
              
              <!-- 선수 (이미지 + 이름) -->
              <div class="flex col-span-5 gap-2 sm:gap-3 items-center">
                <img 
                  src={guess.player.image_url} 
                  alt={guess.player.name}
                  class="object-cover flex-shrink-0 w-8 h-10 sm:w-10 sm:h-12 rounded border border-gray-200"
                  loading="lazy"
                  onerror={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0MCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNEMyNS41MjI4IDI0IDMwIDE5LjUyMjggMzAgMTRDMzAgOC40NzcyIDI1LjUyMjggNCAyMCA0QzE0LjQ3NzIgNCA5IDguNDc3MiA5IDE0QzkgMTkuNTIyOCAxNC40NzcyIDI0IDIwIDI0WiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTIgMzRIMjhMMjYgNDVINEwxMiAzNFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';
                  }}
                />
                <div class="flex-1 min-w-0">
                  <div class="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {guess.player.name}
                  </div>
                  <div class="text-xs text-gray-500">
                    <span class="sm:hidden">{guess.player.team}</span>
                    <span class="hidden sm:inline">{guess.player.team} • {guess.player.position.replace(/\([^)]*\)/g, '').trim()}</span>
                  </div>
                </div>
                <svg 
                  class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 {expandedPlayerId === guess.player.id ? 'rotate-90' : ''}" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
              
              <!-- 유사도 -->
              <div class="flex col-span-3 items-center">
                <div class="w-full">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs sm:text-sm font-bold {getSimilarityTextColor(guess.similarity)}">
                      {guess.similarity.toFixed(1)}%
                    </span>
                  </div>
                  <div class="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full">
                    <div 
                      class="h-1.5 sm:h-2 {getSimilarityBarColor(guess.similarity)} rounded-full transition-all duration-500"
                      style="width: {guess.similarity}%"
                    ></div>
                  </div>
                </div>
              </div>
              
              <!-- 순위 -->
              <div class="flex col-span-3 items-center">
                <div class="text-xs sm:text-sm text-gray-900">
                  #{guess.player.rank}
                </div>
              </div>
            </div>
          </button>

          <!-- 선수 세부 정보 드롭다운 -->
          {#if expandedPlayerId === guess.player.id}
            <div class="px-2 sm:px-4 py-4 sm:py-6 bg-gray-50 border-t border-gray-200 animate-slideDown">
              <div class="max-w-2xl">
                <!-- 선수 헤더 -->
                <div class="flex gap-3 sm:gap-4 items-center mb-4 sm:mb-6">
                  <img 
                    src={guess.player.image_url} 
                    alt={guess.player.name}
                    class="object-cover w-12 h-16 sm:w-16 sm:h-20 rounded-lg border-2 border-white shadow-lg"
                    onerror={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2NCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0MEMzOS43MzIgNDAgNDggMzEuNzMyIDQ4IDI0QzQ4IDEzLjI2OCAzOS43MzIgOCAzMiA4QzI0LjI2OCA4IDE2IDEzLjI2OCAxNiAyNEMxNiAzMS43MzIgMjQuMjY4IDQwIDMyIDQwWiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTYgNTZINDhMNDQgNzJIOEwxNiA1NloiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';
                    }}
                  />
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-gray-900 text-base sm:text-lg">{guess.player.name}</h3>
                    <div class="flex flex-wrap gap-2 items-center mt-1 sm:mt-2">
                      <span class="px-2 py-1 text-xs sm:text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                        {guess.player.team}
                      </span>
                      <span class="px-2 py-1 text-xs sm:text-sm font-medium text-green-800 bg-green-100 rounded-full">
                        {guess.player.position.replace(/\([^)]*\)/g, '').trim()}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 기본 정보 -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div class="p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                    <div class="mb-1 text-xs sm:text-sm text-gray-600">생년월일</div>
                    <div class="font-semibold text-gray-900 text-xs sm:text-sm">{guess.player.birth_date}</div>
                  </div>
                  <div class="p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                    <div class="mb-1 text-xs sm:text-sm text-gray-600">순위</div>
                    <div class="font-semibold text-gray-900 text-xs sm:text-sm">#{guess.player.rank}</div>
                  </div>
                </div>

                <!-- 스탯 정보 -->
                <div>
                  <h4 class="flex gap-2 items-center mb-3 sm:mb-4 text-sm font-semibold text-gray-900">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    주요 스탯
                  </h4>
                  
                  <div class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    {#if guess.player.avg !== undefined}
                      <div class="p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <div class="text-xs sm:text-sm font-medium text-blue-700">타율</div>
                        <div class="font-bold text-blue-900 text-sm sm:text-base">{guess.player.avg.toFixed(3)}</div>
                      </div>
                    {/if}
                    
                    {#if guess.player.home_runs !== undefined}
                      <div class="p-2 sm:p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                        <div class="text-xs sm:text-sm font-medium text-orange-700">홈런</div>
                        <div class="font-bold text-orange-900 text-sm sm:text-base">{guess.player.home_runs}</div>
                      </div>
                    {/if}
                    
                    {#if guess.player.rbis !== undefined}
                      <div class="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                        <div class="text-xs sm:text-sm font-medium text-green-700">타점</div>
                        <div class="font-bold text-green-900 text-sm sm:text-base">{guess.player.rbis}</div>
                      </div>
                    {/if}
                    
                    {#if guess.player.ops !== undefined}
                      <div class="p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                        <div class="text-xs sm:text-sm font-medium text-purple-700">OPS</div>
                        <div class="font-bold text-purple-900 text-sm sm:text-base">{guess.player.ops.toFixed(3)}</div>
                      </div>
                    {/if}
                    
                    <!-- 도루는 KBO에서 제공X -->
                    <!-- {#if guess.player.sb !== undefined && guess.player.sb > 0}
                      <div class="p-2 sm:p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                        <div class="text-xs sm:text-sm font-medium text-yellow-700">도루</div>
                        <div class="font-bold text-yellow-900 text-sm sm:text-base">{guess.player.sb}</div>
                      </div>
                    {/if} -->
                  </div>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 500px;
      transform: translateY(0);
    }
  }

  .animate-slideDown {
    animation: slideDown 200ms ease-out;
  }

  /* 버튼 내 그리드가 올바르게 표시되도록 */
  button[class*="w-full"] {
    display: block;
  }
</style>
