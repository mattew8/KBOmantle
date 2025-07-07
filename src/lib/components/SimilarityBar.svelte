<script lang="ts">
  interface Props {
    similarity: number;
  }

  let { similarity }: Props = $props();
  
  function getColor(similarity: number): string {
    if (similarity >= 90) return 'bg-green-500';
    if (similarity >= 80) return 'bg-lime-500';
    if (similarity >= 70) return 'bg-yellow-500';
    if (similarity >= 60) return 'bg-orange-500';
    if (similarity >= 50) return 'bg-red-400';
    return 'bg-red-500';
  }
  
  function getTextColor(similarity: number): string {
    if (similarity >= 90) return 'text-green-700';
    if (similarity >= 80) return 'text-lime-700';
    if (similarity >= 70) return 'text-yellow-700';
    if (similarity >= 60) return 'text-orange-700';
    if (similarity >= 50) return 'text-red-600';
    return 'text-red-700';
  }
</script>

<div class="flex items-center gap-3">
  <div class="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
    <div
      class="h-full {getColor(similarity)} transition-all duration-500 ease-out flex items-center justify-end pr-2"
      style="width: {similarity}%"
    >
      {#if similarity > 20}
        <span class="text-white text-sm font-semibold">
          {similarity.toFixed(1)}%
        </span>
      {/if}
    </div>
  </div>
  {#if similarity <= 20}
    <span class="text-sm font-semibold {getTextColor(similarity)} min-w-12">
      {similarity.toFixed(1)}%
    </span>
  {/if}
</div>