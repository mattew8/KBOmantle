<script lang="ts">
  import { onMount } from 'svelte';
  import { targetPlayer, gameWon, gameStarted, addGuess } from '../lib/stores/game.js';
  import { getRandomPlayer } from '../lib/stores/players.js';
  import { calculateVectorSimilarity } from '../lib/utils/similarity.js';
  import PlayerInput from '../lib/components/PlayerInput.svelte';
  import GuessHistory from '../lib/components/GuessHistory.svelte';
  import type { Player } from '../lib/utils/vector.js';

  let isLoading = $state(false);
  let error = $state('');

  onMount(() => {
    startNewGame();
  });

  function startNewGame() {
    const randomPlayer = getRandomPlayer();
    targetPlayer.set(randomPlayer);
    gameStarted.set(true);
  }

  async function handleGuess(guessedPlayer: Player) {
    
    if (!$targetPlayer) return;
    
    isLoading = true;
    error = '';
    
    try {
      const similarity = calculateVectorSimilarity(guessedPlayer, $targetPlayer);
      addGuess(guessedPlayer, similarity, $targetPlayer);
    } catch (err) {
      error = err instanceof Error ? err.message : '오류가 발생했습니다.';
    } finally {
      isLoading = false;
    }
  }

  function handleNewGame() {
    startNewGame();
  }
</script>

<div class="py-4 min-h-screen bg-gray-50">
  <div class="px-4 mx-auto max-w-2xl">
    <header class="mb-6 text-center">
      <h1 class="mb-1 text-3xl font-bold text-gray-900">KBOmantle</h1>
      <p class="text-sm text-gray-600">벡터 기반 KBO 선수 유사도 게임</p>
      
      {#if $targetPlayer}
        <div class="mt-3 text-xs text-gray-500">
          오늘의 정답: <strong>KBO 타자</strong>
        </div>
      {/if}
    </header>

    {#if $gameWon}
      <div class="p-4 mb-6 text-center bg-green-50 rounded-lg border border-green-200">
        <h2 class="mb-1 text-xl font-bold text-green-800">🎉 축하합니다!</h2>
        <p class="mb-3 text-sm text-green-700">정답은 <strong>{$targetPlayer?.name}</strong>입니다!</p>
        <button
          onclick={handleNewGame}
          class="px-4 py-2 text-sm text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
        >
          새 게임 시작
        </button>
      </div>
    {:else if $gameStarted}
      <div class="mb-6">
        <PlayerInput onguess={handleGuess} />
        
        {#if isLoading}
          <div class="mt-3 text-center">
            <div class="inline-block w-6 h-6 rounded-full border-b-2 border-blue-600 animate-spin"></div>
            <p class="mt-1 text-sm text-gray-600">계산 중...</p>
          </div>
        {/if}
        
        {#if error}
          <div class="p-3 mt-3 text-center bg-red-50 rounded-lg border border-red-200">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}
      </div>
    {/if}

    <GuessHistory />
  </div>
</div>
