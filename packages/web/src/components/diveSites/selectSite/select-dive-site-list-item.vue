<template>
  <li ref="listItemElement" :class="classes">
    <div>
      <FormCheckbox v-if="multiSelect" />
      <FormButton
        v-else
        ref="selectButton"
        size="sm"
        :test-id="`select-site-${site.id}`"
        @click="$emit('select', site)"
      >
        Select
      </FormButton>
    </div>
    <div>
      <div class="flex align-baseline justify-between">
        <button
          :data-testid="`site-name-${site.id}`"
          @click="() => $emit('highlight', site)"
        >
          <p class="text-xl font-title capitalize hover:text-link-hover">
            {{ site.name }}
          </p>
        </button>

        <p v-if="site.averageRating" class="flex gap-2">
          <StarRating :model-value="site.averageRating" readonly />
        </p>
      </div>

      <div class="flex ml-2 justify-between">
        <p v-if="site.description" class="text-sm text-justify italic">
          {{ site.description }}
        </p>
      </div>

      <div class="flex justify-evenly text-sm">
        <div class="text-center">
          <p class="font-bold">Location</p>
          <p>{{ site.location }}</p>
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { computed, ref, watch } from 'vue';

import FormButton from '../../common/form-button.vue';
import FormCheckbox from '../../common/form-checkbox.vue';
import StarRating from '../../common/star-rating.vue';

interface SelectDiveSiteListItemProps {
  multiSelect?: boolean;
  selected?: boolean;
  site: DiveSiteDTO;
}

const props = withDefaults(defineProps<SelectDiveSiteListItemProps>(), {
  multiSelect: false,
  selected: false,
});
defineEmits<{
  (e: 'select', site: DiveSiteDTO): void;
  (e: 'highlight', site: DiveSiteDTO): void;
}>();

const listItemElement = ref<HTMLLIElement | null>(null);
const classes = computed(() => ({
  border: props.selected,
  'border-success': props.selected,
  'space-y-2': true,
  flex: true,
  'gap-2': true,
  'items-center': true,
}));

watch(
  () => props.selected,
  (val) => {
    // The scrollIntoView method ought to work in most browsers but will blow up in tests.
    // Hence, the try/catch.
    try {
      if (val && listItemElement.value?.scrollIntoView) {
        listItemElement.value?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(error);
    }
  },
);
</script>
