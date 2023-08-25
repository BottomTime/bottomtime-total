<template>
  <div class="level-item has-text-centered">
    <div>
      <p class="heading">
        <span class="icon-text">
          <span class="icon is-small">
            <i :class="`fas ${icon}`"></i>
          </span>
          <span>{{ heading }}</span>
        </span>
      </p>
      <p class="content is-size-6">
        <em>
          <slot></slot>
        </em>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface DiveSiteStatProps {
  heading: string;
  icon: string;
}

defineProps<DiveSiteStatProps>();
</script>
