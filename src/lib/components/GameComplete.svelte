<script lang="ts">
  import { targetPlayer, dailyGameState, attemptCount } from '$lib/stores/game.js';
  import { getTimeUntilTomorrow } from '$lib/utils/daily.js';
  import { CONFIG, generateShareText } from '$lib/config.js';
  import { getTeamColor } from '$lib/utils/teamColors.js';
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
      // Web Share API 지원 확인
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `${CONFIG.GAME_NAME} 결과`,
          text: shareText,
          url: CONFIG.SITE_URL
        };
        
        // canShare로 데이터 유효성 확인
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      
      // Web Share API 미지원 시 폴백 - 클립보드 복사
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        shareSuccess = true;
        setTimeout(() => {
          shareSuccess = false;
        }, 2000);
      } else {
        // 클립보드 API 미지원 시 execCommand 사용
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            shareSuccess = true;
            setTimeout(() => {
              shareSuccess = false;
            }, 2000);
          } else {
            throw new Error('execCommand failed');
          }
        } catch (fallbackError) {
          // 최후의 수단: 프롬프트로 텍스트 표시
          prompt('아래 텍스트를 복사해주세요:', shareText);
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err: any) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if (err.name !== 'AbortError') {
        console.error('공유 실패:', err);
        // 에러 발생 시 클립보드 복사로 폴백
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareText);
            shareSuccess = true;
            setTimeout(() => {
              shareSuccess = false;
            }, 2000);
          } else {
            prompt('아래 텍스트를 복사해주세요:', shareText);
          }
        } catch (clipboardErr) {
          prompt('아래 텍스트를 복사해주세요:', shareText);
        }
      }
    } finally {
      isSharing = false;
    }
  }
</script>

<div class="mb-6">
  <!-- Hero Section -->
  <div class="mb-6 text-center">
    <h1 class="mb-2 text-2xl font-bold text-gray-900">정답!</h1>
    <div class="mb-1 text-4xl font-bold text-blue-600">{$attemptCount}</div>
    <p class="text-sm text-gray-500">번만에 맞추셨습니다</p>
  </div>

  <!-- Player Reveal -->
  {#if $targetPlayer}
    <div class="flex justify-center mb-6">
      <div class="text-center">
        <div class="inline-block relative mb-4">
          <img 
            src={$targetPlayer.image_url} 
            alt={$targetPlayer.name} 
            class="w-20 h-20 rounded-full shadow-lg"
          />
          <div class="flex absolute -top-1 -right-1 justify-center items-center w-6 h-6 bg-green-500 rounded-full">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h2 class="mb-1 text-xl font-semibold text-gray-900">{$targetPlayer.name}</h2>
        <div class="mb-3">
          <span class="inline-block px-3 py-1 text-sm font-medium text-white rounded-md" style="background-color: {getTeamColor($targetPlayer.team)}">
            {$targetPlayer.team}
          </span>
        </div>
        
        <!-- <div class="inline-flex space-x-4 text-sm text-gray-600">
          <span class="font-medium">.{$targetPlayer.타율?.toFixed(3).slice(1) || 'N/A'}</span>
          <span>{$targetPlayer.홈런 || 0}HR</span>
          <span>{$targetPlayer.타점 || 0}RBI</span>
        </div> -->
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex justify-center items-center space-x-8">
    <button 
      on:click={shareResult}
      disabled={isSharing}
      class="inline-flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white bg-gray-900 rounded-full transition-all duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      class:bg-green-600={shareSuccess}
      class:hover:bg-green-700={shareSuccess}
    >
      {#if isSharing}
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else if shareSuccess}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
        </svg>
      {/if}
      
      <span>
        {#if shareSuccess}
          복사됨!
        {:else}
          공유
        {/if}
      </span>
    </button>
    
    <div class="text-center">
      <div class="mb-1 text-xs tracking-wide text-gray-400 uppercase">Next Game</div>
      <div class="font-mono text-lg font-bold tracking-wider text-gray-900">
        {formatTime(timeUntilTomorrow)}
      </div>
    </div>
  </div>
</div>