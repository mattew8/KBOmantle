<script lang="ts">
  import { targetPlayer, dailyGameState, attemptCount } from '$lib/stores/game.js';
  import { getTimeUntilTomorrow } from '$lib/utils/daily.js';
  import { CONFIG, generateShareText } from '$lib/config.js';
  import { onMount, onDestroy } from 'svelte';
  
  let timeUntilTomorrow = getTimeUntilTomorrow();
  let interval: number;
  
  onMount(() => {
    // 1초마다 시간 업데이트
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
  
  function shareResult() {
    if (!$targetPlayer || !$dailyGameState) return;
    
    const attempts = $attemptCount;
    const playerName = $targetPlayer.name;
    const shareText = generateShareText(attempts, playerName, true);
    
    if (navigator.share) {
      navigator.share({
        title: `${CONFIG.GAME_NAME} 결과`,
        text: shareText,
        url: CONFIG.SITE_URL
      });
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(shareText).then(() => {
        alert('결과가 클립보드에 복사되었습니다!');
      });
    }
  }
</script>

<div class="game-complete-container">
  <div class="result-card">
    <h2 class="congratulations">🎉 축하합니다!</h2>
    
    {#if $targetPlayer}
      <div class="answer-section">
        <h3>오늘의 정답</h3>
        <div class="player-info">
          <img src={$targetPlayer.image_url} alt={$targetPlayer.name} class="player-image" />
          <div class="player-details">
            <h4>{$targetPlayer.name}</h4>
            <p>{$targetPlayer.team} • {$targetPlayer.position}</p>
            <div class="player-stats">
              <span>타율: {$targetPlayer.avg.toFixed(3)}</span>
              <span>홈런: {$targetPlayer.home_runs}개</span>
              <span>타점: {$targetPlayer.rbis}개</span>
              <span>OPS: {$targetPlayer.ops.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <div class="result-stats">
      <div class="stat">
        <div class="stat-number">{$attemptCount}</div>
        <div class="stat-label">시도 횟수</div>
      </div>
      
      {#if $dailyGameState?.completedAt}
        <div class="stat">
          <div class="stat-number">
            {new Date($dailyGameState.completedAt).toLocaleTimeString('ko-KR')}
          </div>
          <div class="stat-label">완료 시간</div>
        </div>
      {/if}
    </div>
    
    <div class="action-buttons">
      <button class="share-btn" on:click={shareResult}>
        📱 결과 공유하기
      </button>
    </div>
    
    <div class="next-game-info">
      <h3>다음 게임까지</h3>
      <div class="countdown">
        <div class="time-display">
          {formatTime(timeUntilTomorrow)}
        </div>
        <div class="time-label">시간 남음</div>
      </div>
      <p class="next-game-text">
        내일 새로운 선수가 기다리고 있습니다! 🎯
      </p>
    </div>
  </div>
</div>

<style>
  .game-complete-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
    min-height: 60vh;
  }
  
  .result-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    text-align: center;
  }
  
  .congratulations {
    font-size: 2rem;
    color: #059669;
    margin-bottom: 2rem;
  }
  
  .answer-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
  }
  
  .answer-section h3 {
    margin-bottom: 1rem;
    color: #1e3a8a;
  }
  
  .player-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
  }
  
  .player-image {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #e5e7eb;
  }
  
  .player-details h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #1f2937;
  }
  
  .player-details p {
    margin: 0 0 0.5rem 0;
    color: #6b7280;
  }
  
  .player-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .player-stats span {
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .result-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #1e3a8a;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .action-buttons {
    margin-bottom: 2rem;
  }
  
  .share-btn {
    background: #059669;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .share-btn:hover {
    background: #047857;
  }
  
  .next-game-info {
    border-top: 1px solid #e5e7eb;
    padding-top: 2rem;
  }
  
  .next-game-info h3 {
    margin-bottom: 1rem;
    color: #1e3a8a;
  }
  
  .countdown {
    margin-bottom: 1rem;
  }
  
  .time-display {
    font-size: 2rem;
    font-weight: bold;
    color: #ea580c;
    font-family: 'Courier New', monospace;
  }
  
  .time-label {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .next-game-text {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }
  
  @media (max-width: 640px) {
    .game-complete-container {
      padding: 1rem;
    }
    
    .result-card {
      padding: 1.5rem;
    }
    
    .player-info {
      flex-direction: column;
      text-align: center;
    }
    
    .player-details {
      text-align: center;
    }
    
    .result-stats {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>