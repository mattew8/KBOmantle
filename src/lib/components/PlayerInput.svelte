<script lang="ts">
  import { availablePlayers } from '../stores/players.js';
  import { currentInput, hasGuessedPlayer } from '../stores/game.js';
  import { searchPlayers } from '../stores/players.js';
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
      const newSuggestions = searchPlayers($currentInput)
        .filter(p => !$hasGuessedPlayer(p.id))
        .slice(0, 5);
      
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
    
    const exactMatch = $availablePlayers.find(p =>
      p.name.toLowerCase() === $currentInput.trim().toLowerCase()
    );
    
    if (exactMatch && !$hasGuessedPlayer(exactMatch.id)) {
      onguess?.(exactMatch);
      currentInput.set('');
      suggestions = [];
      selectedIndex = -1;
      
      // 추측 후 input에 다시 포커스
      setTimeout(() => {
        inputElement?.focus();
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
</script>

<div class="relative mx-auto w-full max-w-lg">
  <div class="flex gap-2">
    <input
      bind:this={inputElement}
      bind:value={$currentInput}
      onkeydown={handleKeydown}
      onblur={handleBlur}
      placeholder="선수 이름을 입력하세요..."
      class="px-4 py-3 flex-1 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
    <button
      onclick={handleGuess}
      disabled={!$currentInput.trim()}
      class="px-6 py-3 text-base font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      추측하기
    </button>
  </div>

  {#if suggestions.length > 0}
    <div class="absolute left-0 top-full z-10 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg" style="right: 100px;">
      {#each suggestions as player, index}
        <button
          onclick={() => selectPlayer(player)}
          class="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 {selectedIndex === index ? 'bg-blue-50' : ''}"
        >
          <div class="text-sm font-medium text-gray-900">{player.name}</div>
          <div class="flex gap-2 items-center mt-1 text-xs text-gray-600">
            <span class="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded">{player.team}</span>
            <span>{player.position.replace(/\([^)]*\)/g, '').trim()}</span>
            <span>타율 {player.avg.toFixed(3)}</span>
            <span>{player.home_runs}HR</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>