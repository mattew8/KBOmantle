<script>
  import '../app.css';
  import { CONFIG } from '$lib/config';
</script>

<svelte:head>
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="{CONFIG.SITE_NAME}(크보맨틀) - KBO 야구 선수 유사도 게임" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{CONFIG.SITE_URL}" />
  <meta property="og:site_name" content="{CONFIG.SITE_NAME}" />
  <meta property="og:description" content="{CONFIG.SITE_DESCRIPTION}" />
  <meta property="og:image" content="{CONFIG.SITE_URL}mascot.png" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:locale" content="ko_KR" />
  
  <!-- Additional SEO Meta Tags -->
  <link rel="canonical" href="{CONFIG.SITE_URL}" />
  <meta name="robots" content="index, follow" />
  <meta name="keywords" content="KBOmantle, 크보맨틀, KBO, 야구, 게임, 선수, 퍼즐, 데일리, 유사도, 맞추기, 포켓몬틀, 워들" />
  <meta name="author" content="{CONFIG.SITE_NAME}" />
  <meta name="theme-color" content="#1e3a8a" />
</svelte:head>

<slot />