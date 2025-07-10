<script lang="ts">
  import { CONFIG } from '$lib/config.js';
</script>

<div class="mt-12 space-y-4 sm:mt-24">
  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" open tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">{CONFIG.SITE_NAME}이 뭔가요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        {CONFIG.SITE_NAME}은 인기 게임 Pokémantle의 KBO 버전입니다. 
        매일 새로운 KBO 선수가 정답으로 등장하며, 선수 이름을 입력하면 정답과 얼마나 비슷한지 벡터 기반 유사도로 알려줍니다.
        높은 유사도를 단서로 정답을 찾아보세요!
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">어떤 선수들이 포함되어 있나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        2025 KBO 전반기 기준, 타자 기록실에 등재된 45명의 선수가 포함되어 있습니다.
        (<a href="https://www.koreabaseball.com/Record/Player/HitterBasic/Basic1.aspx?sort=HRA_RT" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">기록실 확인</a>)
        각 선수의 타율, 홈런, 타점, OPS 등의 상세한 스탯 정보를 바탕으로 유사도를 계산합니다. 추후 2025 투수, KBO 전체 선수 등이 추가될 예정입니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">선수의 상세 정보를 볼 수 있나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        네. 추측 기록에서 선수 이름을 클릭하면 해당 선수의 팀, 포지션, 주요 타격 스탯 등의 상세 정보를 확인할 수 있습니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">유사도는 어떻게 계산하나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        선수의 타격 스탯(타율, 홈런, 타점, OPS 등), 팀, 포지션, 나이 등의 특징을 다차원 벡터로 변환하여 코사인 유사도를 계산합니다.
        같은 팀이거나 비슷한 스탯을 가진 선수일수록 높은 유사도를 보입니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">하루에 한 번 이상 플레이할 수 있나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        아니오. 하루에 한 번만 플레이할 수 있습니다.
        매일 자정(한국 시간)에 새로운 문제가 업데이트됩니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">어제의 정답은 뭐였나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        게임 완료 후 결과 화면에서 정답 선수의 정보를 확인할 수 있습니다. 
        아직 과거 정답 아카이브 기능은 제공하지 않지만, 향후 업데이트에서 지원할 예정입니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">내 추측을 다른 방식으로 정렬할 수 있나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        추측 목록 상단 헤더를 클릭하여 정렬 방식을 변경할 수 있습니다.
        유사도순, 시간순, 이름순 등 다양한 정렬 옵션을 제공합니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">소스 코드를 확인할 수 있나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        네. {CONFIG.SITE_NAME}은 오픈소스 프로젝트입니다. 
        <a href="https://github.com/mattew8/KBOmantle" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">GitHub</a>
        에서 소스 코드를 확인하고 기여하실 수 있습니다. 
        SvelteKit과 TypeScript로 개발되었습니다.
      </p>
    </div>
  </details>

  <details class="overflow-hidden rounded-lg border border-gray-200 group dark:border-slate-600" tabindex=-1>
    <summary class="flex justify-between items-center p-3 bg-gray-100 transition-colors cursor-pointer sm:p-4 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 touch-manipulation">
      <h5 class="text-sm font-medium text-gray-900 sm:text-base dark:text-slate-200">다른 질문이나 피드백은 어떻게 보내나요?</h5>
      <svg class="flex-shrink-0 ml-1.5 w-4 h-4 transition duration-300 sm:w-5 sm:h-5 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </summary>
    <div class="px-3 py-3 bg-white sm:px-4 sm:py-4 dark:bg-slate-800">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-slate-300">
        <a href="https://github.com/mattew8/KBOmantle/issues" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">GitHub Issuses</a>
        를 통해 버그 리포트나 기능 제안을 보내주세요. 
      </p>
    </div>
  </details>
</div>

<style>
  details[open] summary svg {
    transform: rotate(-180deg);
  }
  
  summary::-webkit-details-marker {
    display: none;
  }
  
  summary {
    list-style: none;
  }
</style>