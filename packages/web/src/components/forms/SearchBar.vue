<template>
  <fieldset :disabled="isLoading">
    <div class="field has-addons">
      <div class="control is-expanded">
        <input
          ref="queryInput"
          id="search"
          class="input is-rounded"
          :placeholder="placeholder"
          v-model="data.query"
        />
      </div>
      <div class="control">
        <button class="button" @click="onClear">
          <span class="icon">
            <i class="fas fa-times"></i>
          </span>
        </button>
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
import { computed, onMounted, reactive, ref } from 'vue';

interface SearchBarProps {
  autofocus?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  query?: string;
}

interface SearchBarData {
  query: string;
}

const queryInput = ref<HTMLInputElement | null>();

const emit = defineEmits<{
  (e: 'search', query: string): void;
}>();

const props = withDefaults(defineProps<SearchBarProps>(), {
  autofocus: false,
  isLoading: false,
  placeholder: 'Search...',
});

const data = reactive<SearchBarData>({
  query: props.query ?? '',
});

const buttonClass = computed(() => ({
  button: true,
  'is-rounded': true,
  'is-primary': true,
  'is-loading': props.isLoading,
}));

onMounted(() => {
  if (props.autofocus) {
    queryInput.value?.focus();
  }
});

function onSearch() {
  emit('search', data.query);
}

function onClear() {
  data.query = '';
}
</script>
