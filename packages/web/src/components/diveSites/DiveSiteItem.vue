<template>
  <article class="media">
    <div class="media-content">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <span class="is-size-4 is-capitalized">{{ site.name }}</span>
          </div>
        </div>

        <div class="level-right">
          <div class="level-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-star"></i>
              </span>
              <span>
                <strong>Rating:</strong>
                {{ site.averageRating.toFixed(2) }}
              </span>
            </span>
          </div>

          <div class="level-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-trophy"></i>
              </span>
              <span>
                <strong>Difficulty:</strong>
                {{ site.averageDifficulty.toFixed(2) }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <p class="content">{{ site.location }}</p>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { DiveSite } from '@/diveSites';

interface DiveSiteItemProps {
  site: DiveSite;
}

defineProps<DiveSiteItemProps>();
</script>
