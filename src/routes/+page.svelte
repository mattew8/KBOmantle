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
      addGuess(guessedPlayer, similarity);
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

<div class="min-h-screen bg-gray-50 py-4">
  <div class="max-w-2xl mx-auto px-4">
    <header class="text-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-1">KBOmantle</h1>
      <p class="text-gray-600 text-sm">벡터 기반 KBO 선수 유사도 게임</p>
      
      {#if $targetPlayer}
        <div class="mt-3 text-xs text-gray-500">
          오늘의 정답: <strong>KBO 타자</strong>
        </div>
      {/if}
    </header>

    {#if $gameWon}
      <div class="text-center mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 class="text-xl font-bold text-green-800 mb-1">🎉 축하합니다!</h2>
        <p class="text-green-700 mb-3 text-sm">정답은 <strong>{$targetPlayer?.name}</strong>입니다!</p>
        <button
          on:click={handleNewGame}
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          새 게임 시작
        </button>
      </div>
    {:else if $gameStarted}
      <div class="mb-6">
        <PlayerInput onguess={handleGuess} />
        
        {#if isLoading}
          <div class="text-center mt-3">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p class="text-gray-600 mt-1 text-sm">계산 중...</p>
          </div>
        {/if}
        
        {#if error}
          <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <p class="text-red-700 text-sm">{error}</p>
          </div>
        {/if}
      </div>
    {/if}

    <GuessHistory />
  </div>
</div>
