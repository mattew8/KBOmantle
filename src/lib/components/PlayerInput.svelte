<script lang="ts">
  import { allPlayers } from '../stores/players.js';
  import { currentInput, hasGuessedPlayer, gameMode } from '../stores/game.js';
  import { searchPlayers } from '../stores/players.js';
  import { getTeamColor } from '../utils/teamColors.js';
  import type { Player } from '../utils/vector.js';

  interface Props {
    onguess?: (player: Player) => void;
  }

  let { onguess }: Props = $props();

  let suggestions = $state<Player[]>([]);
  let selectedIndex = $state(-1);
  let inputElement: HTMLInputElement;
  let showDropdown = $state(true);
  let lastInput = $state('');

  $effect(() => {
    if ($currentInput.length > 0 && showDropdown) {
      const newSuggestions = searchPlayers($currentInput, $gameMode)
        .filter(p => !$hasGuessedPlayer(p.id));
      
      // 새로운 검색 결과가 나왔을 때만 selectedIndex 리셋
      if (JSON.stringify(suggestions) !== JSON.stringify(newSuggestions)) {
        suggestions = newSuggestions;
        selectedIndex = -1;
      }
    } else {
      suggestions = [];
      selectedIndex = -1;
    }
  });

  // input 값이 실제로 변경될 때만 드롭다운 보여주기
  $effect(() => {
    if ($currentInput !== lastInput) {
      showDropdown = true;
      lastInput = $currentInput;
    }
  });

  function selectPlayer(player: Player) {
    showDropdown = false;
    currentInput.set(player.name);
    lastInput = player.name;
    suggestions = [];
    selectedIndex = -1;
  }

  function handleGuess() {
    if (!$currentInput.trim()) return;
    
    const exactMatch = $allPlayers.find(p =>
      p.name.toLowerCase() === $currentInput.trim().toLowerCase()
    );
    
    if (exactMatch && !$hasGuessedPlayer(exactMatch.id)) {
      onguess?.(exactMatch);
      currentInput.set('');
      suggestions = [];
      selectedIndex = -1;
      
      // 추측 후 input에 다시 포커스 (모바일에서는 제외)
      setTimeout(() => {
        if (!isMobile()) {
          inputElement?.focus();
        }
      }, 100);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (selectedIndex === -1) {
        selectedIndex = 0;
      } else {
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        selectPlayer(suggestions[selectedIndex]);
      }
      // 드롭다운이 있지만 선택된 항목이 없을 때는 드롭다운 닫기
      else if (suggestions.length > 0) {
        suggestions = [];
        selectedIndex = -1;
      }
      // 엔터로는 추측하기 실행하지 않음 - 오직 버튼 클릭으로만 가능
    } else if (event.key === 'Escape') {
      suggestions = [];
      selectedIndex = -1;
    }
  }

  function handleBlur() {
    setTimeout(() => {
      suggestions = [];
      selectedIndex = -1;
    }, 200);
  }

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           'ontouchstart' in window || 
           navigator.maxTouchPoints > 0;
  }
</script>

<div class="relative mx-auto w-full max-w-lg">
  <div class="flex gap-2">
    <div class="relative flex-1">
      <input
        bind:this={inputElement}
        bind:value={$currentInput}
        onkeydown={handleKeydown}
        onblur={handleBlur}
        placeholder="선수 이름을 입력하세요..."
        class="px-3 py-2 sm:px-4 sm:py-3 w-full text-base sm:text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[44px] touch-manipulation"
      />
      
      {#if suggestions.length > 0}
        <div class="overflow-y-auto absolute left-0 top-full z-10 mt-1 w-full max-h-60 bg-white rounded-lg border border-gray-200 shadow-lg">
          {#each suggestions as player, index}
            <button
              onclick={() => selectPlayer(player)}
              class="w-full px-3 py-2 sm:px-4 sm:py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 {selectedIndex === index ? 'bg-blue-50' : ''} touch-manipulation"
            >
              <div class="text-sm font-medium text-gray-900">{player.name}</div>
              <div class="flex flex-wrap gap-1 items-center mt-1 text-xs text-gray-600 sm:gap-2">
                <span class="px-2 py-1 text-xs text-white rounded font-medium" style="background-color: {getTeamColor(player.team)}">{player.team}</span>
                <span class="hidden sm:inline">{player.type === 'pitcher' ? '투수' : '타자'}</span>
                {#if player.type === 'pitcher'}
                  <span class="text-xs sm:text-xs">ERA {player.평균자책점?.toFixed(2) || 'N/A'}</span>
                  <span class="text-xs sm:text-xs">{player.승 || 0}승</span>
                {:else}
                  <span class="text-xs sm:text-xs">타율 {player.타율?.toFixed(3) || 'N/A'}</span>
                  <span class="text-xs sm:text-xs">{player.홈런 || 0}HR</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
    
    <button
      onclick={handleGuess}
      disabled={!$currentInput.trim()}
      class="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation whitespace-nowrap"
    >
      추측하기
    </button>
  </div>
</div>