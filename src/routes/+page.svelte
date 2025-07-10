<script lang="ts">
  import { onMount } from 'svelte';
  import { targetPlayer, gameWon, gameStarted, addGuess, initializeDailyGame } from '../lib/stores/game.js';
  import { allPlayers } from '../lib/stores/players.js';
  import { calculateVectorSimilarity } from '../lib/utils/similarity.js';
  import { getTodayDateKST } from '../lib/utils/daily.js';
  import { CONFIG } from '../lib/config.js';
  import PlayerInput from '../lib/components/PlayerInput.svelte';
  import GuessHistory from '../lib/components/GuessHistory.svelte';
  import GameComplete from '../lib/components/GameComplete.svelte';
  import FAQ from '../lib/components/FAQ.svelte';
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

<div class="py-2 min-h-screen bg-gray-50 sm:py-4">
  <div class="px-2 mx-auto max-w-2xl sm:px-4">
    <header class="mb-4 text-center sm:mb-6">
      <h1 class="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">{CONFIG.SITE_NAME}</h1>
      
      {#if gameInitialized}
        <div class="px-2 mt-2 text-xs text-gray-500 sm:mt-3">
          오늘의 정답: <strong>2025 상반기 타자 (45인)</strong> • {getTodayDateKST()}
        </div>
      {/if}
    </header>

    {#if !gameInitialized}
      <div class="flex justify-center items-center h-32">
        <div class="inline-block w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        <p class="ml-3 text-gray-600">게임 로딩 중...</p>
      </div>
    {:else if $gameStarted}
      {#if $gameWon}
        <GameComplete />
      {/if}
      
      <div class="mb-4 sm:mb-6">
        <PlayerInput onguess={handleGuess} />
        
        {#if isLoading}
          <div class="mt-3 text-center">
            <div class="inline-block w-6 h-6 rounded-full border-b-2 border-blue-600 animate-spin"></div>
            <p class="mt-1 text-sm text-gray-600">계산 중...</p>
          </div>
        {/if}
        
        {#if error}
          <div class="p-3 mx-2 mt-3 text-center bg-red-50 rounded-lg border border-red-200 sm:mx-0">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}
      </div>
    {/if}

    {#if gameInitialized && $gameStarted}
      <GuessHistory />
    {/if}
    
    {#if gameInitialized}
      <FAQ />
    {/if}
  </div>
  
  <div class="px-4 py-6 text-xs text-center text-gray-700 sm:px-2 sm:py-10 dark:text-slate-400">
    KBO와 선수 관련 정보는 공개된 데이터를 사용합니다.<br>
    상업적 목적이 아니며, KBO와 관련 구단의 지적재산권을 침해할 의도는 없습니다.
  </div>
</div>
