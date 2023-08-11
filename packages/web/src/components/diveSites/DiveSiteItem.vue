<template>
  <article class="media">
    <div class="media-content">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <RouterLink :to="`/diveSites/${site.id}`">
              <span class="is-size-4 is-capitalized">{{ site.name }}</span>
            </RouterLink>
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

      <p v-if="site.description" class="content is-size-6 has-text-info">
        {{ site.description }}
      </p>

      <div class="level is-size-7">
        <div class="level-left">
          <div class="level-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-globe"></i>
              </span>
              <span>
                <strong>Location:</strong>
                <em>{{
                  `${site.depth?.depth.toFixed(2)} ${site.depth?.unit}`
                }}</em>
              </span>
            </span>
          </div>

          <div v-if="site.depth" class="level-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-weight"></i>
              </span>
              <span>
                <strong>Depth:</strong>
                <em>{{
                  `${site.depth?.depth.toFixed(2)} ${site.depth?.unit}`
                }}</em>
              </span>
            </span>
          </div>

          <div v-if="site.freeToDive" class="level-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-piggy-bank"></i>
              </span>
              <span>
                <strong>Free to dive?</strong>
                <em>{{ site.freeToDive ? 'Yes' : 'No' }}</em>
              </span>
            </span>
          </div>

          <div v-if="site.shoreAccess" class="level-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-umbrella-beach"></i>
              </span>
              <span>
                <strong>Shore access?</strong>
                <em>{{ site.shoreAccess ? 'Yes' : 'No' }}</em>
              </span>
            </span>
          </div>
        </div>
      </div>
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
