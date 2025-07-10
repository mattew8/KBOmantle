<script lang="ts">
  import { onMount } from 'svelte';
  import type { Player } from '$lib/utils/vector';
  import { getCachedVector } from '$lib/utils/similarity';
  import playersData from '$lib/data/players.json';

  let allPlayers: Player[] = playersData;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let tooltip = { visible: false, x: 0, y: 0, player: null as Player | null };
  let canvasContainer: HTMLDivElement;
  let showGuideModal = false;

  // PCA 차원 축소 (벡터를 2D로 변환)
  function reduceToPCA(vectors: number[][]): number[][] {
    if (vectors.length === 0) return [];
    
    const numComponents = 2;
    const numFeatures = vectors[0].length;
    
    // 평균 계산
    const means = new Array(numFeatures).fill(0);
    for (const vector of vectors) {
      for (let i = 0; i < numFeatures; i++) {
        means[i] += vector[i];
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      means[i] /= vectors.length;
    }
    
    // 중심화
    const centeredVectors = vectors.map(vector => 
      vector.map((value, i) => value - means[i])
    );
    
    // 간단한 PCA 근사 (첫 두 주성분만 사용)
    const result: number[][] = [];
    for (const vector of centeredVectors) {
      const x = vector.reduce((sum, val, i) => sum + val * Math.cos(i * 0.1), 0);
      const y = vector.reduce((sum, val, i) => sum + val * Math.sin(i * 0.1), 0);
      result.push([x, y]);
    }
    
    return result;
  }

  // 시각화 그리기
  function drawVisualization() {
    if (!canvas || !ctx || allPlayers.length === 0) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);
    
    // 벡터 계산
    const vectors = allPlayers.map(player => getCachedVector(player));
    const reducedVectors = reduceToPCA(vectors);
    
    // 좌표 정규화
    const xs = reducedVectors.map(v => v[0]);
    const ys = reducedVectors.map(v => v[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const padding = 50;
    const normalizedPoints = reducedVectors.map(([x, y]) => [
      padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding),
      padding + ((y - minY) / (maxY - minY)) * (height - 2 * padding)
    ]);
    
    // 팀별 색상 매핑 (더 구분되는 색상으로 변경)
    const teamColors: Record<string, string> = {
      'KIA': '#FF1744',     // 빨강
      '삼성': '#2196F3',    // 파랑
      'LG': '#E91E63',      // 핑크
      '두산': '#9C27B0',    // 보라
      'KT': '#424242',      // 회색
      'SSG': '#FF5722',     // 주황빨강
      '롯데': '#3F51B5',    // 남색
      '한화': '#FF9800',    // 주황
      'NC': '#00BCD4',      // 청록
      '키움': '#4CAF50'     // 초록
    };
    
    // 선수 포인트 그리기
    allPlayers.forEach((player, i) => {
      const [x, y] = normalizedPoints[i];
      const color = teamColors[player.team] || '#666666';
      
      // 포인트 그리기
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // 선수 이름 표시 (작은 글씨로)
      ctx.fillStyle = '#333333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, x, y - 10);
      
      // 팀명 표시 (더 작은 글씨로)
      ctx.fillStyle = '#666666';
      ctx.font = '8px Arial';
      ctx.fillText(player.team, x, y + 20);
    });
    
    // 연결선 그리기 (유사도 기반) - 90% 이상일 때만 연결 (너무 많은 선을 방지)
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const similarity = cosineSimilarity(vectors[i], vectors[j]);
        
        if (similarity > 90) {
          const [x1, y1] = normalizedPoints[i];
          const [x2, y2] = normalizedPoints[j];
          
          ctx.strokeStyle = `rgba(255, 0, 0, ${(similarity - 90) / 10})`;
          ctx.lineWidth = ((similarity - 90) / 10) * 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }
  }

  // 코사인 유사도 계산
  function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    const validVecA = vecA.map((v) => (isNaN(v) ? 0 : v));
    const validVecB = vecB.map((v) => (isNaN(v) ? 0 : v));

    const dotProduct = validVecA.reduce((sum, a, i) => sum + a * validVecB[i], 0);

    const magnitudeA = Math.sqrt(validVecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(validVecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    const similarity = dotProduct / (magnitudeA * magnitudeB);

    return Math.max(0, Math.min(100, ((similarity + 1) / 2) * 100));
  }

  // 마우스 이벤트 핸들러
  function handleMouseMove(event: MouseEvent) {
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // 캔버스 스케일 보정
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;
    
    // 벡터 계산
    const vectors = allPlayers.map(player => getCachedVector(player));
    const reducedVectors = reduceToPCA(vectors);
    
    // 좌표 정규화 (drawVisualization과 동일한 로직)
    const xs = reducedVectors.map(v => v[0]);
    const ys = reducedVectors.map(v => v[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const padding = 50;
    const normalizedPoints = reducedVectors.map(([x, y]) => [
      padding + ((x - minX) / (maxX - minX)) * (canvas.width - 2 * padding),
      padding + ((y - minY) / (maxY - minY)) * (canvas.height - 2 * padding)
    ]);
    
    // 가장 가까운 선수 찾기
    let closestPlayer = null;
    let minDistance = Infinity;
    
    allPlayers.forEach((player, i) => {
      const [x, y] = normalizedPoints[i];
      const distance = Math.sqrt((canvasX - x) ** 2 + (canvasY - y) ** 2);
      
      if (distance < 20 && distance < minDistance) { // 20px 이내
        minDistance = distance;
        closestPlayer = player;
      }
    });
    
    if (closestPlayer) {
      tooltip = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        player: closestPlayer
      };
    } else {
      tooltip = { visible: false, x: 0, y: 0, player: null };
    }
  }

  function handleMouseLeave() {
    tooltip = { visible: false, x: 0, y: 0, player: null };
  }

  function resizeCanvas() {
    if (!canvas || !canvasContainer) return;
    
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = Math.min(600, window.innerHeight * 0.7); // 화면 높이의 70% 또는 최대 600px
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    drawVisualization();
  }

  onMount(() => {
    if (canvas && canvasContainer) {
      ctx = canvas.getContext('2d')!;
      
      // 초기 크기 설정
      resizeCanvas();
      
      // 윈도우 리사이즈 이벤트 리스너
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  });
</script>

<svelte:head>
  <title>벡터 시각화 - KBOmantle</title>
  <meta name="description" content="KBO 선수들의 벡터 분포와 유사도를 시각화합니다." />
</svelte:head>

<div class="container flex flex-col p-4 mx-auto max-w-full h-screen">
  <div class="flex justify-center items-center mb-4">
    <h1 class="text-2xl font-bold">KBO 전체 선수 벡터 분포 시각화</h1>
    <button 
      on:click={() => showGuideModal = true}
      class="flex justify-center items-center ml-3 w-6 h-6 text-sm text-white bg-blue-500 rounded-full transition-colors hover:bg-blue-600"
      title="시각화 해석 가이드"
    >
      ?
    </button>
  </div>
  
  <div class="flex flex-col flex-1 p-4 bg-white rounded-lg shadow-md">
    <h2 class="mb-3 text-lg font-semibold">전체 선수 벡터 분포 ({allPlayers.length}명)</h2>
    
    <div bind:this={canvasContainer} class="overflow-hidden relative flex-1 mb-3 rounded-lg border border-gray-300">
      <canvas
        bind:this={canvas}
        class="w-full h-full cursor-crosshair"
        on:mousemove={handleMouseMove}
        on:mouseleave={handleMouseLeave}
      ></canvas>
    </div>
    
    <div class="grid grid-cols-2 gap-3 mb-3 text-sm md:grid-cols-5">
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #FF1744;"></div>
        <span>KIA</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #2196F3;"></div>
        <span>삼성</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #E91E63;"></div>
        <span>LG</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #9C27B0;"></div>
        <span>두산</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #424242;"></div>
        <span>KT</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #FF5722;"></div>
        <span>SSG</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #3F51B5;"></div>
        <span>롯데</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #FF9800;"></div>
        <span>한화</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #00BCD4;"></div>
        <span>NC</span>
      </div>
      <div class="flex items-center">
        <div class="mr-2 w-3 h-3 rounded-full" style="background-color: #4CAF50;"></div>
        <span>키움</span>
      </div>
    </div>
  </div>
</div>

<!-- 툴팁 -->
{#if tooltip.visible && tooltip.player}
  <div 
    class="fixed z-50 p-3 text-sm text-white bg-black rounded-lg shadow-lg pointer-events-none"
    style="left: {tooltip.x + 10}px; top: {tooltip.y - 10}px;"
  >
    <div class="text-lg font-bold">{tooltip.player.name}</div>
    <div class="mb-2 text-gray-300">{tooltip.player.team} • {tooltip.player.position}</div>
    
    <div class="space-y-1">
      <div>타율: {tooltip.player.avg.toFixed(3)}</div>
      <div>홈런: {tooltip.player.home_runs}개</div>
      <div>타점: {tooltip.player.rbis}점</div>
      <div>안타: {tooltip.player.hits}개</div>
      <div>OPS: {tooltip.player.ops.toFixed(3)}</div>
      <div>장타율: {tooltip.player.slugging_percentage.toFixed(3)}</div>
    </div>
    
    <div class="mt-2 text-xs text-gray-400">
      {tooltip.player.birth_date} • {tooltip.player.height_weight}
    </div>
  </div>
{/if}

<!-- 시각화 해석 가이드 모달 -->
{#if showGuideModal}
  <div class="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
    <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-2xl font-bold text-gray-800">🎯 시각화 해석 가이드</h2>
        <button 
          on:click={() => showGuideModal = false}
          class="text-xl font-bold text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div class="space-y-6 text-gray-700">
        <div>
          <h3 class="mb-2 text-lg font-semibold text-blue-600">📍 공간상 위치의 의미</h3>
          <ul class="ml-4 space-y-1">
            <li><strong>가까이 있는 선수들:</strong> 벡터상 유사한 특성을 가진 선수들</li>
            <li><strong>멀리 있는 선수들:</strong> 완전히 다른 타입의 선수들</li>
            <li><strong>클러스터(군집):</strong> 비슷한 스타일의 선수들이 모여있는 영역</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold text-green-600">🎨 팀 색상 패턴 분석</h3>
          <ul class="ml-4 space-y-1">
            <li><strong>같은 색상이 모여있으면:</strong> 해당 팀의 전략이나 선수 스타일이 유사</li>
            <li><strong>색상이 골고루 퍼져있으면:</strong> 다양한 타입의 선수를 보유한 팀</li>
            <li><strong>특정 영역에 한 팀이 집중:</strong> 그 팀만의 독특한 선수 스타일</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold text-red-600">🔗 빨간 연결선의 의미</h3>
          <ul class="ml-4 space-y-1">
            <li><strong>90% 이상 유사도:</strong> 거의 동일한 스탯과 특성</li>
            <li><strong>연결선이 많은 선수:</strong> 평균적이고 밸런스가 좋은 선수</li>
            <li><strong>연결선이 적은 선수:</strong> 독특하고 특화된 스타일의 선수</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold text-purple-600">📊 클러스터별 해석 예시</h3>
          <ul class="ml-4 space-y-1">
            <li><strong>좌상단 그룹:</strong> 높은 타율, 낮은 파워 (컨택형 타자)</li>
            <li><strong>우상단 그룹:</strong> 높은 파워, 낮은 타율 (장타형 타자)</li>
            <li><strong>중앙 그룹:</strong> 밸런스형 선수들</li>
            <li><strong>외곽 선수:</strong> 극단적 특성을 가진 선수</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold text-orange-600">🎮 KBOmantle 게임 활용법</h3>
          <div class="p-4 bg-orange-50 rounded-lg">
            <p class="mb-2"><strong>게임 관점에서:</strong></p>
            <ul class="ml-4 space-y-1">
              <li>정답 선수가 <strong>중앙</strong>에 있으면: 평균적 스탯의 선수들이 높은 유사도</li>
              <li>정답 선수가 <strong>외곽</strong>에 있으면: 비슷한 특화 스타일 선수들만 높은 유사도</li>
              <li><strong>같은 클러스터</strong> 내 선수들: 60-80% 유사도 예상</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-lg font-semibold text-indigo-600">🎯 전략적 활용</h3>
          <div class="p-4 bg-indigo-50 rounded-lg">
            <ol class="ml-4 space-y-2 list-decimal">
              <li><strong>첫 추측:</strong> 중앙 근처의 밸런스형 선수로 시작</li>
              <li><strong>유사도 확인 후:</strong> 비슷한 영역의 선수들 탐색</li>
              <li><strong>클러스터 이동:</strong> 유사도가 낮으면 다른 영역 시도</li>
            </ol>
          </div>
        </div>

        <div class="p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            💡 <strong>팁:</strong> 이 시각화는 KBOmantle 게임의 <strong>벡터 기반 유사도 계산의 시각적 표현</strong>으로, 
            선수들 간의 숨겨진 패턴과 관계를 한눈에 파악할 수 있게 해줍니다.
          </p>
        </div>
      </div>

      <div class="mt-6 text-center">
        <button 
          on:click={() => showGuideModal = false}
          class="px-6 py-2 text-white bg-blue-500 rounded-lg transition-colors hover:bg-blue-600"
        >
          확인
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }
</style>