<template>
  <fieldset :disabled="isLoading">
    <div class="field has-addons">
      <div class="control is-expanded">
        <input
          ref="queryInput"
          id="search"
          class="input is-rounded"
          :placeholder="placeholder"
          v-model="queryString"
          @keydown.enter="onSearch"
          @keydown.esc="onClear"
        />
      </div>
      <div class="control">
        <button :class="buttonClass" @click="onSearch">
          <span class="icon">
            <i class="fas fa-search"></i>
          </span>
        </button>
      </div>
    </div>
  </fieldset>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

interface SearchBarProps {
  autofocus?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  query?: string;
}

const emit = defineEmits<{
  (e: 'search', query: string): void;
  (e: 'clear'): void;
}>();

const props = withDefaults(defineProps<SearchBarProps>(), {
  autofocus: false,
  isLoading: false,
  placeholder: 'Search...',
  query: '',
});

const queryInput = ref<HTMLInputElement | null>();
const queryString = ref(props.query);

const buttonClass = computed(() => ({
  button: true,
  'is-rounded': true,
  'is-primary': true,
  'is-loading': props.isLoading,
}));

function focus() {
  queryInput.value?.focus();
}

onMounted(() => {
  if (props.autofocus) focus();
});

function onSearch() {
  emit('search', queryString.value);
}

function onClear() {
  queryString.value = '';
  emit('clear');
}

defineExpose({
  focus,
});
</script>
