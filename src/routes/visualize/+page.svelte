<script lang="ts">
  import { onMount } from 'svelte';
  import type { Player } from '$lib/utils/vector';
  import { playerToVector, isBatter, isPitcher } from '$lib/utils/vector';
  import { calculateVectorSimilarity } from '$lib/utils/similarity';
  import { getTeamColor, getTeamColorEntries } from '$lib/utils/teamColors';
  import hitters2025 from '$lib/data/hitters-2025.json';
  import hittersTotal from '$lib/data/hitters-total.json';
  import pitchers2025 from '$lib/data/pitchers-2025.json';
  import pitchersTotal from '$lib/data/pitchers-total.json';

  // 확장된 타입 정의 (mode 속성 포함)
  type PlayerWithMode = Player & { mode: '2025' | 'total' };

  // 모든 데이터를 PlayerWithMode 타입으로 통합
  const allData: PlayerWithMode[] = [
    ...hitters2025.map(p => ({ ...p, type: 'batter' as const, mode: '2025' as const })),
    ...hittersTotal.map(p => ({ ...p, type: 'batter' as const, mode: 'total' as const })),
    ...pitchers2025.map(p => ({ ...p, type: 'pitcher' as const, mode: '2025' as const })),
    ...pitchersTotal.map(p => ({ ...p, type: 'pitcher' as const, mode: 'total' as const }))
  ];

  // 필터링 상태
  let selectedYear: '2025' | 'total' = '2025';
  let selectedType: 'batter' | 'pitcher' = 'batter';
  
  // 필터링된 선수 목록
  let allPlayers: PlayerWithMode[] = [];
  let currentVectors: number[][] = []; // 현재 표시된 선수들의 벡터
  let currentNormalizedPoints: number[][] = []; // 현재 표시된 선수들의 정규화된 2D 좌표
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let tooltip = { visible: false, x: 0, y: 0, player: null as PlayerWithMode | null };
  let canvasContainer: HTMLDivElement;
  let showGuideModal = false;
  let hoveredPlayerIndex: number | null = null; // hover된 선수의 인덱스
  let selectedPlayerIndex: number | null = null; // 클릭으로 선택된 선수의 인덱스
  let selectedTeam: string | null = null; // 필터링된 팀
  
  // 아코디언 상태
  let showDetailedStats = false;
  let showSimilarPlayers = true;
  
  // Top 5 유사 선수 계산
  $: top5SimilarPlayers = selectedPlayerIndex !== null ? getTop5SimilarPlayers(selectedPlayerIndex) : [];
  
  // Top 5 유사 선수 계산 함수
  function getTop5SimilarPlayers(targetIndex: number) {
    if (!allPlayers[targetIndex] || allPlayers.length === 0) return [];
    
    const targetPlayer = allPlayers[targetIndex];
    const vectorMode = selectedYear === 'total' ? 'career' : '2025';
    
    const similarities = [];
    for (let i = 0; i < allPlayers.length; i++) {
      if (i === targetIndex) continue; // 자기 자신 제외
      
      const similarity = calculateVectorSimilarity(targetPlayer, allPlayers[i], vectorMode);
      similarities.push({
        index: i,
        player: allPlayers[i],
        similarity: similarity,
        explanation: generateSimilarityExplanation(targetPlayer, allPlayers[i])
      });
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }

  // 필터링 함수
  function updatePlayers() {
    allPlayers = allData.filter(player => {
      // 연도 필터
      const yearMatch = player.mode === selectedYear;
      
      // 타입 필터
      const typeMatch = player.type === selectedType;
      
      return yearMatch && typeMatch;
    });
    
    // 필터가 변경되면 선택된 선수 초기화
    selectedPlayerIndex = null;
    hoveredPlayerIndex = null;
    
    // 시각화 업데이트
    if (canvas && ctx) {
      drawVisualization();
    }
  }

  // 필터 변경 시 업데이트
  $: if (selectedYear || selectedType) {
    updatePlayers();
  }

  // 팀 필터링 함수
  function handleTeamFilter(teamName: string) {
    if (selectedTeam === teamName) {
      // 같은 팀 다시 클릭하면 필터 해제
      selectedTeam = null;
    } else {
      // 새로운 팀 선택
      selectedTeam = teamName;
    }
    
    // 선택된 선수 초기화
    selectedPlayerIndex = null;
    hoveredPlayerIndex = null;
    
    // 차트 다시 그리기
    if (canvas && ctx) {
      drawVisualization();
    }
  }


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
    // selectedYear를 playerToVector가 예상하는 형식으로 변환
    const vectorMode = selectedYear === 'total' ? 'career' : '2025';
    currentVectors = allPlayers.map(player => {
      return playerToVector(player, vectorMode);
    });
    const reducedVectors = reduceToPCA(currentVectors);
    
    // 좌표 정규화
    const xs = reducedVectors.map(v => v[0]);
    const ys = reducedVectors.map(v => v[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const padding = 50;
    currentNormalizedPoints = reducedVectors.map(([x, y]) => [
      padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding),
      padding + ((y - minY) / (maxY - minY)) * (height - 2 * padding)
    ]);
    
    // 🎨 공통 팀 색상 사용
    
    // 연결선 그리기 함수
    const drawSimilarityLines = (targetIndex: number, color: string = '34, 197, 94') => {
      const targetPlayer = allPlayers[targetIndex];
      const [targetX, targetY] = currentNormalizedPoints[targetIndex];
      
      // selectedYear를 calculateVectorSimilarity가 예상하는 형식으로 변환
      const vectorMode = selectedYear === 'total' ? 'career' : '2025';
      
      // 모든 다른 선수들과의 유사도 계산하고 정렬
      const similarities = [];
      for (let i = 0; i < allPlayers.length; i++) {
        if (i === targetIndex) continue; // 자기 자신 제외
        
        const similarity = calculateVectorSimilarity(targetPlayer, allPlayers[i], vectorMode);
        similarities.push({
          index: i,
          similarity: similarity,
          player: allPlayers[i]
        });
      }
      
      // 유사도 높은 순으로 정렬하고 상위 5명만 선택
      const top5Similar = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      
      // 상위 5명과만 연결선 그리기
      top5Similar.forEach(({ index, similarity }, rank) => {
        const [x, y] = currentNormalizedPoints[index];
        
        // 순위에 따른 색상과 두께 (1등이 가장 진하고 굵게)
        const alpha = 1 - (rank * 0.15); // 1, 0.85, 0.7, 0.55, 0.4
        const baseAlpha = Math.max(0.4, alpha);
        ctx.strokeStyle = `rgba(${color}, ${baseAlpha})`; // 색상 조정 가능
        ctx.lineWidth = Math.max(1, 4 - rank * 0.6); // 4, 3.4, 2.8, 2.2, 1.6px
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // 유사도 텍스트 표시 (연결선 중간 지점에)
        const midX = (targetX + x) / 2;
        const midY = (targetY + y) / 2;
        
        ctx.fillStyle = `rgba(${color}, ${baseAlpha + 0.3})`;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${similarity.toFixed(0)}%`, midX, midY - 2);
      });
    };

    // hover된 선수와의 연결선 그리기 (hover가 우선)
    if (hoveredPlayerIndex !== null) {
      // 선택한 선수와 hover한 선수가 같으면 선택 색상(파란색) 사용
      const color = hoveredPlayerIndex === selectedPlayerIndex ? '59, 130, 246' : '34, 197, 94';
      drawSimilarityLines(hoveredPlayerIndex, color);
    } 
    // hover가 없고 선택된 선수가 있으면 선택된 선수의 연결선 그리기
    else if (selectedPlayerIndex !== null) {
      drawSimilarityLines(selectedPlayerIndex, '59, 130, 246'); // 파란색
    }

    // 선수 포인트 그리기
    allPlayers.forEach((player, i) => {
      const [x, y] = currentNormalizedPoints[i];
      const color = getTeamColor(player.team);
      const isHovered = i === hoveredPlayerIndex;
      const isSelected = i === selectedPlayerIndex;
      const isSpecial = isHovered || isSelected;
      
      // 팀 필터링 상태 확인
      const isHighlighted = selectedTeam === null || player.team === selectedTeam;
      const opacity = isHighlighted ? 1.0 : 0.3; // 필터링된 팀이 아니면 흐리게
      const radius = isSpecial ? 10 : (isHighlighted ? 6 : 4); // 필터링된 팀이 아니면 작게
      
      // 포인트 그리기 (팀 필터링 적용)
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // hover되거나 선택된 선수는 테두리 추가
      if (isSpecial) {
        ctx.strokeStyle = isSelected ? '#3b82f6' : '#ffffff'; // 선택된 선수는 파란 테두리
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // 선수 이름 항상 표시 (팀 필터링 상태에 따른 투명도 적용)
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#333333';
      ctx.font = isSpecial ? 'bold 12px Arial' : '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, x, y - (isSpecial ? 15 : 10));
      
      // 팀명 표시 (더 작은 글씨로)
      ctx.fillStyle = '#666666';
      ctx.font = '8px Arial';
      ctx.fillText(player.team, x, y + (isSpecial ? 25 : 20));
      
      // 투명도 초기화
      ctx.globalAlpha = 1.0;
    });
  }


  // 생년월일에서 나이 계산 함수
  function calculateAge(birthDate: string): number {
    // "1994년 10월 05일" 형태에서 연도 추출
    const yearMatch = birthDate.match(/(\d{4})년/);
    if (!yearMatch) return 0;
    
    const birthYear = parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  }

  // 선수 특성 라벨 생성 함수
  function getPlayerLabels(player: any): string[] {
    const labels: string[] = [];
    
    if (player.type === 'batter') {
      // 타자 특성 라벨
      if (player.홈런 >= 25) labels.push('홈런 공장장');
      if (player.타율 >= 0.320) labels.push('타격의 달인');
      if (player.도루 >= 15) labels.push('배달의 기수');
      if (player.타점 >= 90) labels.push('RBI 머신');
      if (player.볼넷 >= 80) labels.push('출루마술사');
      if (player.삼진 >= 120) labels.push('삼진머신');
      if ((player.출루율 || 0) + (player.장타율 || 0) >= 0.900) labels.push('OPS 괴물');
      if (player.타율 >= 0.280 && player.홈런 <= 10) labels.push('컨택형 타자');
      if (player.홈런 >= 20 && player.타율 <= 0.260) labels.push('장타형 타자');
      if (player.도루 >= 10 && player.홈런 <= 15) labels.push('스피드형 타자');
      if (player.볼넷 >= 60 && player.삼진 <= 80) labels.push('선구안 마스터');
      if (player.타점 >= 70 && player.홈런 >= 15) labels.push('클러치 히터');
    } else if (player.type === 'pitcher') {
      // 투수 특성 라벨  
      if (player.평균자책점 <= 2.50) labels.push('불펜의 제왕');
      if (player.삼진 >= 150) labels.push('탈삼진 마술사');
      if (player.승 >= 15) labels.push('에이스');
      if (player.세이브 >= 20) labels.push('마무리 킹');
      if (player.홀드 >= 25) labels.push('셋업맨');
      if (player.WHIP <= 1.10) labels.push('제구력 명장');
      if (player.이닝 >= 180) labels.push('이닝이터');
      if (player.완투 >= 3) labels.push('완투머신');
      if (player.평균자책점 <= 3.00 && player.승 >= 12) labels.push('안정감 갑');
      if (player.삼진 >= 120 && player.볼넷 <= 40) labels.push('컨트롤 마스터');
      if (player.피안타율 <= 0.220) labels.push('피안타 방지왕');
    }
    
    return labels;
  }

  // 유사도 설명 생성 함수 (모든 것을 태그 형태로)
  function generateSimilarityExplanation(player1: Player, player2: Player): string {
    const tags: string[] = [];
    
    // 팀 비교 제거 (팀은 유사도에 영향 없음)
    
    // 나이 비교
    const age1 = calculateAge(player1.birth_date);
    const age2 = calculateAge(player2.birth_date);
    const ageDiff = Math.abs(age1 - age2);
    if (ageDiff <= 1) {
      tags.push('#친구사이');
    } else if (ageDiff <= 3) {
      tags.push('#비슷한나이');
    }
    
    // 특성 라벨 비교
    const labels1 = getPlayerLabels(player1);
    const labels2 = getPlayerLabels(player2);
    const commonLabels = labels1.filter(label => labels2.includes(label));
    
    // 공통 특성 태그 추가
    commonLabels.slice(0, 3).forEach(label => {
      tags.push(`#${label}`);
    });
    
    // 특성이 없을 때 기본 스탯 기반 태그
    if (commonLabels.length === 0 && player1.type === 'batter' && player2.type === 'batter') {
      if (player1.타율 && player2.타율) {
        const avgDiff = Math.abs(player1.타율 - player2.타율);
        if (avgDiff <= 0.020) {
          tags.push('#타율비슷');
        }
      }
      
      if (player1.홈런 && player2.홈런) {
        const hrDiff = Math.abs(player1.홈런 - player2.홈런);
        if (hrDiff <= 5) {
          tags.push('#홈런비슷');
        }
      }
      
      if (player1.출루율 !== undefined && player1.장타율 !== undefined && 
          player2.출루율 !== undefined && player2.장타율 !== undefined) {
        const ops1 = player1.출루율 + player1.장타율;
        const ops2 = player2.출루율 + player2.장타율;
        const opsDiff = Math.abs(ops1 - ops2);
        if (opsDiff <= 0.080) {
          tags.push('#OPS비슷');
        }
      }
    }
    
    if (commonLabels.length === 0 && player1.type === 'pitcher' && player2.type === 'pitcher') {
      if (player1.평균자책점 && player2.평균자책점) {
        const eraDiff = Math.abs(player1.평균자책점 - player2.평균자책점);
        if (eraDiff <= 0.40) {
          tags.push('#ERA비슷');
        }
      }
      
      if (player1.승 && player2.승) {
        const winDiff = Math.abs(player1.승 - player2.승);
        if (winDiff <= 3) {
          tags.push('#승수비슷');
        }
      }
      
      if (player1.삼진 && player2.삼진) {
        const soDiff = Math.abs(player1.삼진 - player2.삼진);
        if (soDiff <= 20) {
          tags.push('#삼진비슷');
        }
      }
    }
    
    if (tags.length === 0) {
      return '#종합유사';
    }
    
    return tags.join(' ');
  }
  
  // 해시태그 포맷팅 함수
  function formatExplanationWithHashtags(explanation: string): string {
    // #으로 시작해서 다음 #이나 문장 끝까지를 하나의 해시태그로 처리
    return explanation.replace(/#([^#]+?)(?=\s#|$)/g, '<span class="hashtag">#$1</span>');
  }
  
  // 성능 최적화를 위한 debounce 변수
  let isRedrawing = false;
  
  // 마우스 이벤트 핸들러 (성능 최적화)
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
    
    // 이미 계산된 벡터와 좌표를 사용
    if (currentVectors.length === 0 || currentNormalizedPoints.length === 0) return;
    
    // 선수 포인트에 hover 체크
    let closestPlayerIndex = null;
    let minDistance = Infinity;
    
    allPlayers.forEach((player, i) => {
      const [x, y] = currentNormalizedPoints[i];
      const distance = Math.sqrt((canvasX - x) ** 2 + (canvasY - y) ** 2);
      
      if (distance < 20 && distance < minDistance) { // 20px 이내
        minDistance = distance;
        closestPlayerIndex = i;
      }
    });
    
    // hover 상태 업데이트
    const prevHoveredIndex = hoveredPlayerIndex;
    hoveredPlayerIndex = closestPlayerIndex;
    
    // 툴팁 업데이트 (hover 상태 변경과 관계없이)
    if (hoveredPlayerIndex !== null) {
      tooltip = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        player: allPlayers[hoveredPlayerIndex]
      };
    } else {
      tooltip = { visible: false, x: 0, y: 0, player: null };
    }
    
    // hover 상태가 변경되었을 때만 다시 그리기 (debounce 적용)
    if (prevHoveredIndex !== hoveredPlayerIndex && !isRedrawing) {
      isRedrawing = true;
      requestAnimationFrame(() => {
        drawVisualization();
        isRedrawing = false;
      });
    }
  }

  // 마우스 클릭 이벤트 핸들러
  function handleMouseClick(event: MouseEvent) {
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // 캔버스 스케일 보정
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;
    
    // 이미 계산된 벡터와 좌표를 사용
    if (currentVectors.length === 0 || currentNormalizedPoints.length === 0) return;
    
    // 선수 포인트에 클릭 체크
    let clickedPlayerIndex = null;
    let minDistance = Infinity;
    
    allPlayers.forEach((_, i) => {
      const [x, y] = currentNormalizedPoints[i];
      const distance = Math.sqrt((canvasX - x) ** 2 + (canvasY - y) ** 2);
      
      if (distance < 20 && distance < minDistance) { // 20px 이내
        minDistance = distance;
        clickedPlayerIndex = i;
      }
    });
    
    // 선수 선택 상태 업데이트
    selectedPlayerIndex = clickedPlayerIndex;
    
    // 선택 상태가 변경되었으면 다시 그리기
    drawVisualization();
  }

  function handleMouseLeave() {
    tooltip = { visible: false, x: 0, y: 0, player: null };
    
    // hover 상태 초기화
    if (hoveredPlayerIndex !== null) {
      hoveredPlayerIndex = null;
      drawVisualization();
    }
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
    // 초기 데이터 로드
    updatePlayers();
    
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

<style>
  :global(.hashtag) {
    display: inline-block;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    margin: 0 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
  }
  
  :global(.hashtag:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  }
  
  :global(.explanation-text) {
    line-height: 1.4;
  }
</style>

<div class="flex flex-col h-screen bg-gray-50">
  <!-- 헤더 -->
  <header class="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
    <div class="flex items-center">
      <h1 class="text-2xl font-bold text-gray-900">KBO 선수 벡터 분포</h1>
      <span class="px-3 py-1 ml-3 text-sm text-blue-800 bg-blue-100 rounded-full">
        시각화 도구
      </span>
    </div>
    <div class="flex gap-3 items-center">
      <a 
        href="/"
        class="flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        게임하기
      </a>
      <button 
        on:click={() => showGuideModal = true}
        class="flex justify-center items-center w-8 h-8 text-sm text-white bg-blue-500 rounded-full transition-colors hover:bg-blue-600"
        title="시각화 해석 가이드"
      >
        ?
      </button>
    </div>
  </header>

  <!-- 컨텐츠 영역 -->
  <div class="flex overflow-hidden flex-1">
    <!-- 좌측 사이드바 -->
    <aside class="overflow-y-auto w-80 bg-white border-r border-gray-200 shadow-sm">
      <div class="p-6">
        <h2 class="mb-6 text-lg font-semibold text-gray-900">필터 설정</h2>
        
        <!-- 데이터 년도 토글 -->
        <div class="mb-8">
          <label class="block mb-3 text-sm font-medium text-gray-700">데이터 기간</label>
          <div class="flex p-1 bg-gray-100 rounded-lg">
            <button
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedYear === '2025' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              on:click={() => selectedYear = '2025'}
            >
              2025년
            </button>
            <button
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedYear === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              on:click={() => selectedYear = 'total'}
            >
              통산
            </button>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            {selectedYear === '2025' ? '2025시즌 기록' : '선수 통산 기록'}을 기준으로 벡터를 생성합니다.
          </p>
        </div>

        <!-- 포지션 타입 토글 -->
        <div class="mb-8">
          <label class="block mb-3 text-sm font-medium text-gray-700">포지션</label>
          <div class="flex p-1 bg-gray-100 rounded-lg">
            <button
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedType === 'batter' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              on:click={() => selectedType = 'batter'}
            >
              타자
              <span class="ml-1 text-xs opacity-75">
                {allData.filter(p => p.mode === selectedYear && p.type === 'batter').length}
              </span>
            </button>
            <button
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedType === 'pitcher' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              on:click={() => selectedType = 'pitcher'}
            >
              투수
              <span class="ml-1 text-xs opacity-75">
                {allData.filter(p => p.mode === selectedYear && p.type === 'pitcher').length}
              </span>
            </button>
          </div>
        </div>

        <!-- 선택된 선수 정보 -->
        {#if selectedPlayerIndex !== null}
          <div class="space-y-4">
            <!-- 기본 선수 정보 -->
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 class="flex items-center mb-3 text-sm font-medium text-blue-900">
                <svg class="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                선택된 선수
              </h3>
              
              <!-- 선수 이미지와 기본 정보 -->
              <div class="flex items-center mb-4 space-x-3">
                <div class="flex-shrink-0">
                  {#if allPlayers[selectedPlayerIndex].image_url}
                    <img 
                      src={allPlayers[selectedPlayerIndex].image_url} 
                      alt={allPlayers[selectedPlayerIndex].name}
                      class="object-cover w-16 h-16 rounded-full border-2 border-blue-200"
                      on:error={(e) => {
                        const img = e.target as HTMLImageElement;
                        const placeholder = img.nextElementSibling as HTMLElement;
                        img.style.display = 'none';
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                    <div class="flex hidden justify-center items-center w-16 h-16 text-xs text-gray-500 bg-gray-200 rounded-full border-2 border-blue-200">
                      NO IMG
                    </div>
                  {:else}
                    <div class="flex justify-center items-center w-16 h-16 text-xs text-gray-500 bg-gray-200 rounded-full border-2 border-blue-200">
                      NO IMG
                    </div>
                  {/if}
                </div>
                <div class="flex-1">
                  <div class="text-lg font-semibold text-gray-900">{allPlayers[selectedPlayerIndex].name}</div>
                  <div class="flex items-center mt-1 space-x-2">
                    <span class="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded">{allPlayers[selectedPlayerIndex].team}</span>
                    <span class="px-2 py-1 text-sm text-gray-700 bg-gray-100 rounded">
                      {allPlayers[selectedPlayerIndex].type === 'batter' ? '타자' : '투수'}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 주요 스탯만 표시 -->
              {#if isBatter(allPlayers[selectedPlayerIndex])}
                {@const player = allPlayers[selectedPlayerIndex] as any}
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">타율</div>
                    <div class="font-medium">{player.타율?.toFixed(3) || 'N/A'}</div>
                  </div>
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">홈런</div>
                    <div class="font-medium">{player.홈런 || 0}</div>
                  </div>
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">타점</div>
                    <div class="font-medium">{player.타점 || 0}</div>
                  </div>
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">OPS</div>
                    <div class="font-medium">{((player.출루율 || 0) + (player.장타율 || 0)).toFixed(3)}</div>
                  </div>
                </div>
              {:else if isPitcher(allPlayers[selectedPlayerIndex])}
                {@const player = allPlayers[selectedPlayerIndex] as any}
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">평균자책점</div>
                    <div class="font-medium">{player.평균자책점?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">승</div>
                    <div class="font-medium">{player.승 || 0}</div>
                  </div>
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">삼진</div>
                    <div class="font-medium">{player.삼진 || 0}</div>
                  </div>
                  <div class="p-2 bg-white rounded">
                    <div class="text-gray-500">WHIP</div>
                    <div class="font-medium">{player.WHIP?.toFixed(2) || 'N/A'}</div>
                  </div>
                </div>
              {/if}
              
              <button 
                on:click={() => { selectedPlayerIndex = null; drawVisualization(); }}
                class="px-3 py-2 mt-3 w-full text-sm text-blue-600 bg-white rounded border border-blue-200 transition-colors hover:bg-blue-50"
              >
                선택 해제
              </button>
            </div>
            
            <!-- 유사한 선수 TOP 5 -->
            <div class="bg-white rounded-lg border border-gray-200">
              <button 
                on:click={() => showSimilarPlayers = !showSimilarPlayers}
                class="flex justify-between items-center p-4 w-full text-left transition-colors hover:bg-gray-50"
              >
                <h4 class="flex items-center text-sm font-semibold text-gray-900">
                  <svg class="mr-2 w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  유사한 선수 TOP 5
                </h4>
                <svg class="w-4 h-4 text-gray-400 transition-transform {showSimilarPlayers ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {#if showSimilarPlayers}
                <div class="px-4 pb-4 space-y-3">
                  {#each top5SimilarPlayers as { player, similarity, explanation }, index}
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center space-x-2">
                          <span class="flex justify-center items-center w-6 h-6 text-xs font-bold text-white bg-green-500 rounded-full">{index + 1}</span>
                          <div>
                            <div class="text-sm font-semibold text-gray-900">{player.name}</div>
                            <div class="text-xs text-gray-600">{player.team}</div>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-sm font-bold text-green-600">{similarity.toFixed(1)}%</div>
                          <div class="text-xs text-gray-500">유사도</div>
                        </div>
                      </div>
                      <div class="p-2 text-xs text-gray-700 bg-white rounded border">
                        <span class="explanation-text">{@html formatExplanationWithHashtags(explanation)}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
            
            <!-- 상세 스탯 (아코디언) -->
            <div class="bg-white rounded-lg border border-gray-200">
              <button 
                on:click={() => showDetailedStats = !showDetailedStats}
                class="flex justify-between items-center p-4 w-full text-left transition-colors hover:bg-gray-50"
              >
                <h4 class="flex items-center text-sm font-semibold text-gray-900">
                  <svg class="mr-2 w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  상세 스탯
                </h4>
                <svg class="w-4 h-4 text-gray-400 transition-transform {showDetailedStats ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {#if showDetailedStats}
                <div class="px-4 pb-4 space-y-4">
                  {#if isBatter(allPlayers[selectedPlayerIndex])}
                    {@const player = allPlayers[selectedPlayerIndex] as any}
                    
                    <!-- 주요 타격 스탯 -->
                    <div>
                      <h5 class="mb-2 text-sm font-semibold text-gray-700">주요 타격 스탯</h5>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">타율</div>
                          <div class="font-medium">{player.타율?.toFixed(3) || 'N/A'}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">출루율</div>
                          <div class="font-medium">{player.출루율?.toFixed(3) || 'N/A'}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">장타율</div>
                          <div class="font-medium">{player.장타율?.toFixed(3) || 'N/A'}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">OPS</div>
                          <div class="font-medium">{((player.출루율 || 0) + (player.장타율 || 0)).toFixed(3)}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 기본 기록 -->
                    <div>
                      <h5 class="mb-2 text-sm font-semibold text-gray-700">기본 기록</h5>
                      <div class="grid grid-cols-3 gap-2 text-xs">
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">경기</div>
                          <div class="font-medium">{player.경기 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">타석</div>
                          <div class="font-medium">{player.타석 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">타수</div>
                          <div class="font-medium">{player.타수 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">득점</div>
                          <div class="font-medium">{player.득점 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">안타</div>
                          <div class="font-medium">{player.안타 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">홈런</div>
                          <div class="font-medium">{player.홈런 || 0}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 상세 타격 기록 -->
                    <div>
                      <h5 class="mb-2 text-sm font-semibold text-gray-700">상세 타격 기록</h5>
                      <div class="grid grid-cols-3 gap-2 text-xs">
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">2루타</div>
                          <div class="font-medium">{player['2루타'] || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">3루타</div>
                          <div class="font-medium">{player['3루타'] || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">타점</div>
                          <div class="font-medium">{player.타점 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">도루</div>
                          <div class="font-medium">{player.도루 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">볼넷</div>
                          <div class="font-medium">{player.볼넷 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">삼진</div>
                          <div class="font-medium">{player.삼진 || 0}</div>
                        </div>
                      </div>
                    </div>

                  {:else if isPitcher(allPlayers[selectedPlayerIndex])}
                    {@const player = allPlayers[selectedPlayerIndex] as any}
                    
                    <!-- 주요 투구 스탯 -->
                    <div>
                      <h5 class="mb-2 text-sm font-semibold text-gray-700">주요 투구 스탯</h5>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">평균자책점</div>
                          <div class="font-medium">{player.평균자책점?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">WHIP</div>
                          <div class="font-medium">{player.WHIP?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">피안타율</div>
                          <div class="font-medium">{player.피안타율?.toFixed(3) || 'N/A'}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">승률</div>
                          <div class="font-medium">{player.승률?.toFixed(3) || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 승부 기록 -->
                    <div>
                      <h5 class="mb-2 text-sm font-semibold text-gray-700">승부 기록</h5>
                      <div class="grid grid-cols-3 gap-2 text-xs">
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">경기</div>
                          <div class="font-medium">{player.경기 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">승</div>
                          <div class="font-medium">{player.승 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">패</div>
                          <div class="font-medium">{player.패 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">세이브</div>
                          <div class="font-medium">{player.세이브 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">이닝</div>
                          <div class="font-medium">{player.이닝?.toFixed(1) || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">삼진</div>
                          <div class="font-medium">{player.삼진 || 0}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 피안타 기록 -->
                    <div>
                      <h5 class="mb-2 text-sm font-semibold text-gray-700">피안타 기록</h5>
                      <div class="grid grid-cols-3 gap-2 text-xs">
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">피안타</div>
                          <div class="font-medium">{player.피안타 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">볼넷</div>
                          <div class="font-medium">{player.볼넷 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">홈런</div>
                          <div class="font-medium">{player.홈런 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">실점</div>
                          <div class="font-medium">{player.실점 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">자책점</div>
                          <div class="font-medium">{player.자책점 || 0}</div>
                        </div>
                        <div class="p-2 bg-gray-50 rounded">
                          <div class="text-gray-500">완투</div>
                          <div class="font-medium">{player.완투 || 0}</div>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="p-4 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed">
            <div class="text-center text-gray-500">
              <svg class="mx-auto mb-2 w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122"></path>
              </svg>
              <p class="text-sm">차트에서 선수를 클릭하면<br/>상세 정보가 표시됩니다</p>
            </div>
          </div>
        {/if}
      </div>
    </aside>

    <!-- 우측 차트 영역 -->
    <main class="flex flex-col flex-1 bg-white">
      <!-- 차트 헤더 -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          {selectedYear === '2025' ? '2025년' : '통산'} 
          {selectedType === 'batter' ? '타자' : '투수'} 
          벡터 분포
        </h2>
        <p class="mt-1 text-sm text-gray-600">
          {allPlayers.length}명의 선수가 표시되고 있습니다
        </p>
      </div>

      <!-- 차트 컨테이너 -->
      <div class="flex-1 p-6">
        <div bind:this={canvasContainer} class="relative w-full h-full bg-gray-50 rounded-lg border border-gray-200">
          <canvas
            bind:this={canvas}
            class="w-full h-full cursor-crosshair"
            on:mousemove={handleMouseMove}
            on:mouseleave={handleMouseLeave}
            on:click={handleMouseClick}
          ></canvas>
        </div>
      </div>

      <!-- 범례 및 사용법 -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div class="grid grid-cols-5 gap-3 mb-4 text-sm">
          {#each getTeamColorEntries() as { team, color }}
            <button 
              class="flex items-center p-1 rounded transition-colors hover:bg-gray-100 {selectedTeam === team ? 'bg-blue-100 ring-2 ring-blue-300' : ''}"
              on:click={() => handleTeamFilter(team)}
              title="클릭하여 {team} 선수들만 표시"
            >
              <div class="mr-2 w-3 h-3 rounded-full" style="background-color: {color};"></div>
              <span class="{selectedTeam === team ? 'font-semibold text-blue-800' : ''}">{team}</span>
            </button>
          {/each}
        </div>
        
        <div class="space-y-1 text-xs text-gray-500">
          <p><strong>사용법:</strong> 선수를 클릭하면 선택되어 사이드바에 정보가 표시됩니다. hover하면 상위 5명과 연결선이 나타납니다.</p>
          <p><strong>연결선:</strong> 선택된 선수는 파란색, hover한 선수는 초록색으로 표시됩니다. 굵기와 진함은 유사도 순위를 나타냅니다.</p>
        </div>
      </div>
    </main>
  </div>
</div>

<!-- 간소화된 툴팁 -->
{#if tooltip.visible && tooltip.player}
  <div 
    class="fixed z-50 p-2 text-sm text-white bg-black rounded shadow-lg pointer-events-none"
    style="left: {tooltip.x + 10}px; top: {tooltip.y - 10}px;"
  >
    <div class="font-bold">{tooltip.player.name}</div>
    <div class="text-gray-300">{tooltip.player.team}</div>
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
          <div class="p-3 mb-3 bg-red-50 rounded-lg border border-red-200">
            <p class="mb-1 text-sm font-semibold text-red-800">⚠️ 중요한 차이점</p>
            <p class="text-xs text-red-700">
              <strong>차트상 거리 ≠ 선수간 유사도</strong><br/>
              차트는 8차원을 2차원으로 축소한 개략적 분포입니다. 정확한 유사도는 연결선의 %를 확인하세요!
            </p>
          </div>
          <ul class="ml-4 space-y-1">
            <li><strong>차트 위치:</strong> 전체적인 데이터 분포와 클러스터 파악용</li>
            <li><strong>연결선 %:</strong> 실제 게임에서 경험하는 정확한 유사도</li>
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
          <h3 class="mb-2 text-lg font-semibold text-green-600">🔗 초록 연결선의 의미 (Hover 시 표시)</h3>
          <ul class="ml-4 space-y-1">
            <li><strong>상위 5명만 표시:</strong> 선택한 선수와 가장 유사한 5명의 선수들만 연결</li>
            <li><strong>선 굵기 & 색상:</strong> 1순위가 가장 굵고 진하며, 순위가 낮을수록 얇고 연해짐</li>
            <li><strong>유사도 %:</strong> 연결선 중간에 정확한 유사도 수치 표시</li>
            <li><strong>유사한 선수가 적은 경우:</strong> 독특하고 특화된 스타일의 선수 (게임 최고 난이도!)</li>
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
              <li><strong>같은 클러스터</strong> 내 선수들: 40-70% 유사도 예상</li>
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