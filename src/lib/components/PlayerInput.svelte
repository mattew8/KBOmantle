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
      suggestions = searchPlayers($currentInput, $availablePlayers[0]?.type)
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

<div class="relative w-full max-w-md mx-auto">
  <input
    bind:this={inputElement}
    bind:value={$currentInput}
    on:keydown={handleKeydown}
    on:blur={handleBlur}
    placeholder="선수 이름을 입력하세요..."
    class="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
  />

  {#if suggestions.length > 0}
    <div class="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 mt-1">
      {#each suggestions as player, index}
        <button
          on:click={() => selectPlayer(player)}
          class="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 {selectedIndex === index ? 'bg-blue-50' : ''}"
        >
          <div class="font-semibold text-gray-900">{player.name}</div>
          <div class="text-sm text-gray-600 flex items-center gap-2">
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{player.team}</span>
            <span>{player.position}</span>
            <span>{player.age}세</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>