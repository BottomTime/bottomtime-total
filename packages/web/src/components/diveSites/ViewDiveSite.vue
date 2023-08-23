<template>
  <div class="tile is-ancestor">
    <div class="tile is-parent is-vertical is-6">
      <div class="tile is-child box">
        <p class="content">{{ site.description }}</p>
      </div>

      <div class="tile is-child level"></div>
      <div class="tile is-child">
        <div>
          <p class="heading">Created by</p>
          <IdBadge
            :id="site.creator.id"
            :username="site.creator.username"
            :display-name="site.creator.displayName"
            :avatar="site.creator.avatar"
            :member-since="site.creator.memberSince"
          />
        </div>
      </div>
    </div>

    <div class="tile is-parent is-4">
      <div class="tile is-child">Map goes here.</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DiveSite } from '@/client/diveSites';
import IdBadge from '@/components/users/IdBadge.vue';

interface ViewDiveSiteProps {
  site: DiveSite;
}

defineProps<ViewDiveSiteProps>();
</script>
