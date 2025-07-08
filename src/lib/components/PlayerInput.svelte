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

  $effect(() => {
    if ($currentInput.length > 0) {
      suggestions = searchPlayers($currentInput)
        .filter(p => !$hasGuessedPlayer(p.id))
        .slice(0, 5);
      selectedIndex = -1;
    } else {
      suggestions = [];
      selectedIndex = -1;
    }
  });

  function selectPlayer(player: Player) {
    onguess?.(player);
    currentInput.set('');
    suggestions = [];
    selectedIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        selectPlayer(suggestions[selectedIndex]);
      } else if ($currentInput.trim()) {
        const exactMatch = $availablePlayers.find(p =>
          p.name.toLowerCase() === $currentInput.trim().toLowerCase()
        );
        if (exactMatch && !$hasGuessedPlayer(exactMatch.id)) {
          selectPlayer(exactMatch);
        }
      }
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
  <input
    bind:this={inputElement}
    bind:value={$currentInput}
    onkeydown={handleKeydown}
    onblur={handleBlur}
    placeholder="선수 이름을 입력하세요..."
    class="px-4 py-3 w-full text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
  />

  {#if suggestions.length > 0}
    <div class="absolute right-0 left-0 top-full z-10 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg">
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