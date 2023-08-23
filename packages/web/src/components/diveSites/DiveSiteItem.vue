<template>
  <div class="tile is-child card">
    <header class="card-header">
      <p class="card-header-title">
        <RouterLink :to="`/diveSites/${site.id}`">
          <span class="is-capitalized">{{ site.name }}</span>
        </RouterLink>
      </p>

      <span
        class="card-header-icon icon-text has-text-info"
        aria-label="Rating"
      >
        <span class="icon">
          <i class="fas fa-star"></i>
        </span>
        <span>
          {{ site.averageRating.toFixed(2) }}
        </span>
      </span>
      <span
        class="card-header-icon icon-text has-text-info"
        aria-label="Difficulty"
      >
        <span class="icon">
          <i class="fas fa-trophy"></i>
        </span>
        <span>
          {{ site.averageDifficulty.toFixed(2) }}
        </span>
      </span>
    </header>

    <div class="card-image"></div>

    <div class="card-content">
      <div class="media">
        <figure class="media-left"></figure>
        <div class="media-content">
          <p v-if="site.description" class="content">
            {{ site.description }}
          </p>

          <div class="level is-size-7">
            <div class="level-left"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="level">
      <DiveSiteStat heading="Location" icon="fa-globe">
        {{ site.location }}
      </DiveSiteStat>

      <DiveSiteStat v-if="site.depth" heading="Depth" icon="fa-weight">
        {{ `${site.depth?.depth.toFixed(2)} ${site.depth?.unit}` }}
      </DiveSiteStat>

      <DiveSiteStat
        v-if="site.freeToDive"
        heading="Free to dive"
        icon="fa-piggy-bank"
      >
        {{ site.freeToDive ? 'Yes' : 'No' }}
      </DiveSiteStat>

      <DiveSiteStat
        v-if="site.shoreAccess"
        heading="Shore access"
        icon="fa-umbrella-beach"
      >
        {{ site.shoreAccess ? 'Yes' : 'No' }}
      </DiveSiteStat>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DiveSiteStat from '@/components/diveSites/DiveSiteStat.vue';
import { DiveSite } from '@/client/diveSites';

interface DiveSiteItemProps {
  site: DiveSite;
}

defineProps<DiveSiteItemProps>();
</script>
