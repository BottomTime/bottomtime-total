<template>
  <article :class="`message ${style}`">
    <div class="message-header">
      <p>{{ title }}</p>
      <button
        v-if="closeable"
        class="delete"
        aria-label="close"
        @click="() => emit('close')"
      ></button>
    </div>
    <div class="message-body">
      <article class="media">
        <figure class="media-left">
          <slot name="icon"></slot>
        </figure>
        <div class="media-content">
          <slot></slot>
        </div>
      </article>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, withDefaults } from 'vue';

interface MessageBoxProps {
  closeable?: boolean;
  style?: string;
  title: string;
}

withDefaults(defineProps<MessageBoxProps>(), {
  closeable: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>
