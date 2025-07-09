<script lang="ts">
  import { onMount } from 'svelte';
  import { targetPlayer, gameWon, gameStarted, addGuess, initializeDailyGame } from '../lib/stores/game.js';
  import { allPlayers } from '../lib/stores/players.js';
  import { calculateVectorSimilarity } from '../lib/utils/similarity.js';
  import { getTodayDateKST } from '../lib/utils/daily.js';
  import PlayerInput from '../lib/components/PlayerInput.svelte';
  import GuessHistory from '../lib/components/GuessHistory.svelte';
  import GameComplete from '../lib/components/GameComplete.svelte';
  import type { Player } from '../lib/utils/vector.js';

  let isLoading = $state(false);
  let error = $state('');
  let gameInitialized = $state(false);

  onMount(() => {
    initializeGame();
  });

  function initializeGame() {
    // 데일리 게임 초기화
    const isCompleted = initializeDailyGame($allPlayers);
    gameInitialized = true;
    
    if (isCompleted) {
      // 이미 완료된 게임인 경우 완료 상태로 설정
      gameWon.set(true);
    }
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
</script>

<div class="py-4 min-h-screen bg-gray-50">
  <div class="px-4 mx-auto max-w-2xl">
    <header class="mb-6 text-center">
      <h1 class="mb-1 text-3xl font-bold text-gray-900">KBOmantle</h1>
      <p class="text-sm text-gray-600">벡터 기반 KBO 선수 유사도 게임</p>
      
      {#if gameInitialized}
        <div class="mt-3 text-xs text-gray-500">
          오늘의 정답: <strong>KBO 타자</strong> • {getTodayDateKST()}
        </div>
      {/if}
    </header>

    {#if !gameInitialized}
      <div class="flex justify-center items-center h-32">
        <div class="inline-block w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        <p class="ml-3 text-gray-600">게임 로딩 중...</p>
      </div>
    {:else if $gameWon}
      <GameComplete />
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

    {#if gameInitialized && !$gameWon}
      <GuessHistory />
    {/if}
  </div>
</div>
