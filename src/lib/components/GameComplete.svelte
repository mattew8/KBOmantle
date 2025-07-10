<script lang="ts">
  import { targetPlayer, dailyGameState, attemptCount } from '$lib/stores/game.js';
  import { getTimeUntilTomorrow } from '$lib/utils/daily.js';
  import { CONFIG, generateShareText } from '$lib/config.js';
  import { onMount, onDestroy } from 'svelte';
  
  let timeUntilTomorrow = getTimeUntilTomorrow();
  let interval: number;
  
  onMount(() => {
    interval = setInterval(() => {
      timeUntilTomorrow = getTimeUntilTomorrow();
    }, 1000);
  });
  
  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
  
  function formatTime(time: { hours: number; minutes: number; seconds: number }): string {
    const { hours, minutes, seconds } = time;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  let isSharing = false;
  let shareSuccess = false;

  async function shareResult() {
    if (!$targetPlayer || !$dailyGameState || isSharing) return;
    
    isSharing = true;
    const attempts = $attemptCount;
    const playerName = $targetPlayer.name;
    const shareText = generateShareText(attempts, playerName, true);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${CONFIG.GAME_NAME} 결과`,
          text: shareText,
          url: CONFIG.SITE_URL
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        shareSuccess = true;
        setTimeout(() => {
          shareSuccess = false;
        }, 2000);
      }
    } catch (err) {
      console.error('공유 실패:', err);
    } finally {
      isSharing = false;
    }
  }
</script>

<div class="mb-6">
  <!-- Hero Section -->
  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">정답!</h1>
    <div class="text-4xl font-bold text-blue-600 mb-1">{$attemptCount}</div>
    <p class="text-sm text-gray-500">번만에 맞추셨습니다</p>
  </div>

  <!-- Player Reveal -->
  {#if $targetPlayer}
    <div class="flex justify-center mb-6">
      <div class="text-center">
        <div class="relative inline-block mb-4">
          <img 
            src={$targetPlayer.image_url} 
            alt={$targetPlayer.name} 
            class="w-20 h-20 rounded-full shadow-lg"
          />
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-1">{$targetPlayer.name}</h2>
        <p class="text-gray-600 mb-3">{$targetPlayer.team} • {$targetPlayer.position}</p>
        
        <div class="inline-flex space-x-4 text-sm text-gray-600">
          <span class="font-medium">.{$targetPlayer.avg.toFixed(3).slice(1)}</span>
          <span>{$targetPlayer.home_runs}HR</span>
          <span>{$targetPlayer.rbis}RBI</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex items-center justify-center space-x-8">
    <button 
      on:click={shareResult}
      class="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
      </svg>
      <span>공유</span>
    </button>
    
    <div class="text-center">
      <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Next Game</div>
      <div class="text-lg font-mono font-bold text-gray-900 tracking-wider">
        {formatTime(timeUntilTomorrow)}
      </div>
    </div>
  </div>
</div>