<script lang="ts">
  import { guesses } from '../stores/game.js';
  import type { Guess } from '../stores/game.js';
  import { getTeamColor } from '../utils/teamColors.js';
  import { onMount } from 'svelte';

  type SortKey = 'input' | 'name' | 'similarity';
  type SortDirection = 'asc' | 'desc';

  let sortKey: SortKey = $state('input');
  let sortDirection: SortDirection = $state('desc');
  let expandedPlayerId: string | null = $state(null);
  let showDetailedStats: { [key: string]: boolean } = $state({});

  // 로컬스토리지에서 정렬 설정 복원
  onMount(() => {
    try {
      const savedSortKey = localStorage.getItem('kbomantle-sort-key');
      const savedSortDirection = localStorage.getItem('kbomantle-sort-direction');
      
      if (savedSortKey && ['input', 'name', 'similarity'].includes(savedSortKey)) {
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

  // 세부 스탯 토글
  function toggleDetailedStats(playerId: string) {
    showDetailedStats[playerId] = !showDetailedStats[playerId];
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
        <div class="grid grid-cols-9 gap-2 px-2 py-3 text-xs font-medium tracking-wider text-gray-700 uppercase sm:gap-4 sm:px-4">
          <div class="col-span-1">
            <button 
              onclick={() => handleSort('input')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              #
              <span class="hidden text-xs sm:inline">{getSortIcon('input')}</span>
            </button>
          </div>
          <div class="col-span-5 sm:col-span-5">
            <button 
              onclick={() => handleSort('name')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              이름
              <span class="hidden text-xs sm:inline">{getSortIcon('name')}</span>
            </button>
          </div>
          <div class="col-span-3">
            <button 
              onclick={() => handleSort('similarity')}
              class="flex gap-1 items-center transition-colors hover:text-gray-900"
            >
              유사도
              <span class="hidden text-xs sm:inline">{getSortIcon('similarity')}</span>
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
            <div class="grid grid-cols-9 gap-2 px-2 py-3 sm:gap-4 sm:px-4">
              <!-- 입력 순서 -->
              <div class="flex col-span-1 items-center">
                <span class="text-xs text-gray-500 sm:text-sm">{$guesses.findIndex(g => g.timestamp === guess.timestamp) + 1}</span>
              </div>
              
              <!-- 선수 (이미지 + 이름) -->
              <div class="flex col-span-5 gap-2 items-center sm:gap-3">
                <img 
                  src={guess.player.image_url} 
                  alt={guess.player.name}
                  class="object-cover flex-shrink-0 w-8 h-10 rounded border border-gray-200 sm:w-10 sm:h-12"
                  loading="lazy"
                  onerror={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0MCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNEMyNS41MjI4IDI0IDMwIDE5LjUyMjggMzAgMTRDMzAgOC40NzcyIDI1LjUyMjggNCAyMCA0QzE0LjQ3NzIgNCA5IDguNDc3MiA5IDE0QzkgMTkuNTIyOCAxNC40NzcyIDI0IDIwIDI0WiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTIgMzRIMjhMMjYgNDVINEwxMiAzNFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';
                  }}
                />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-gray-900 truncate sm:text-sm">
                    {guess.player.name}
                  </div>
                  <div class="text-xs text-gray-500">
                    <span class="sm:hidden">{guess.player.team}</span>
                    <span class="hidden sm:inline">{guess.player.team} • {guess.player.type === 'pitcher' ? '투수' : '타자'}</span>
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
                  <div class="w-full h-1.5 bg-gray-200 rounded-full sm:h-2">
                    <div 
                      class="h-1.5 sm:h-2 {getSimilarityBarColor(guess.similarity)} rounded-full transition-all duration-500"
                      style="width: {guess.similarity}%"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </button>

          <!-- 선수 세부 정보 드롭다운 -->
          {#if expandedPlayerId === guess.player.id}
            <div class="px-3 py-3 bg-white border-t border-gray-200 sm:px-4 sm:py-4 animate-slideDown">
              <div class="max-w-2xl">
                <!-- 선수 헤더 -->
                <div class="flex gap-3 items-center mb-3">
                  <img 
                    src={guess.player.image_url} 
                    alt={guess.player.name}
                    class="object-cover w-10 h-12 rounded border border-gray-200 sm:w-12 sm:h-14"
                    onerror={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA0OCA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyOEMzMC42MjMyIDI4IDM2IDE5LjczMiAzNiAxNEMzNiA4LjI2OCAzMC42MjMyIDQgMjQgNEMxNy4zNzY4IDQgMTIgOC4yNjggMTIgMTRDMTIgMTkuNzMyIDE3LjM3NjggMjggMjQgMjhaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xMiAzNkgzNkwzNCA0OEg2TDEyIDM2WiIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K';
                    }}
                  />
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-gray-900 sm:text-base">{guess.player.name}</h3>
                    <div class="flex flex-wrap gap-1 items-center mt-1">
                      <span class="px-2 py-0.5 text-xs font-medium text-white rounded-md" style="background-color: {getTeamColor(guess.player.team)}">
                        {guess.player.team}
                      </span>
                      <span class="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md">
                        {guess.player.type === 'pitcher' ? '투수' : '타자'}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 기본 정보 -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div class="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    <div class="text-xs text-gray-500">생년월일</div>
                    <div class="text-sm font-medium text-gray-900">{guess.player.birth_date}</div>
                  </div>
                  <div class="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    <div class="text-xs text-gray-500">타입</div>
                    <div class="text-sm font-medium text-gray-900">{guess.player.type === 'pitcher' ? '투수' : '타자'}</div>
                  </div>
                </div>

                <!-- 스탯 정보 -->
                <div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {#if guess.player.type === 'batter'}
                    {#if guess.player.타율 !== undefined}
                      <div class="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                        <div class="text-xs text-gray-500">타율</div>
                        <div class="text-sm font-semibold text-gray-900">{guess.player.타율.toFixed(3)}</div>
                      </div>
                    {/if}
                    
                    {#if guess.player.홈런 !== undefined}
                      <div class="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                        <div class="text-xs text-gray-500">홈런</div>
                        <div class="text-sm font-semibold text-gray-900">{guess.player.홈런}</div>
                      </div>
                    {/if}
                    
                    {#if guess.player.타점 !== undefined}
                      <div class="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                        <div class="text-xs text-gray-500">타점</div>
                        <div class="text-sm font-semibold text-gray-900">{guess.player.타점}</div>
                      </div>
                    {/if}
                  {/if}
                  
                  {#if guess.player.type === 'batter' && guess.player.출루율 !== undefined && guess.player.장타율 !== undefined}
                    <div class="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                      <div class="text-xs text-gray-500">OPS</div>
                      <div class="text-sm font-semibold text-gray-900">{(guess.player.출루율 + guess.player.장타율).toFixed(3)}</div>
                    </div>
                  {/if}
                </div>

                <!-- 세부 기록 토글 버튼 -->
                <div class="pt-3 mt-4 border-t border-gray-200">
                  <button 
                    class="flex gap-2 items-center text-sm text-blue-600 transition-colors hover:text-blue-800"
                    onclick={() => toggleDetailedStats(guess.player.id)}
                  >
                    <span>세부 기록</span>
                    <svg 
                      class="w-4 h-4 transition-transform duration-200 {showDetailedStats[guess.player.id] ? 'rotate-180' : ''}"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  <!-- 세부 기록 표시 -->
                  {#if showDetailedStats[guess.player.id]}
                    <div class="p-3 mt-3 bg-gray-50 rounded-md border border-gray-200">
                      <h4 class="mb-2 text-sm font-medium text-gray-900">전체 기록</h4>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        {#each Object.entries(guess.player) as [key, value]}
                          {#if key !== 'id' && key !== 'image_url' && value !== undefined && value !== null && value !== ''}
                            <div class="flex justify-between py-1">
                              <span class="text-gray-600">{key}:</span>
                              <span class="font-medium text-gray-900">{value}</span>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/if}
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
