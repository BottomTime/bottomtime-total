<template>
  <li ref="listItemElement" :class="classes">
    <div>
      <FormCheckbox
        v-if="multiSelect"
        :model-value="site.selected ?? false"
        @update:model-value="$emit('toggle-checked', site)"
      />
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
    <div class="grow space-y-2">
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

      <div class="">
        <p v-if="site.description" class="text-sm text-justify italic">
          {{ site.description }}
        </p>
      </div>

      <div class="flex justify-between text-sm">
        <div class="text-center">
          <label class="font-bold">Location</label>
          <p>{{ site.location }}</p>
        </div>

        <div class="text-center">
          <label class="font-bold">Depth</label>
          <p>
            <DepthText
              v-if="site.depth"
              :depth="site.depth.depth"
              :unit="site.depth.unit"
            />
            <span>Unspecified</span>
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Free to dive</label>
          <p>{{ booleanText(site.freeToDive) }}</p>
        </div>

        <div class="text-center">
          <label class="font-bold">Shore dive</label>
          <p>{{ booleanText(site.shoreAccess) }}</p>
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { computed, ref, watch } from 'vue';

import { Logger } from '../../../logger';
import DepthText from '../../common/depth-text.vue';
import FormButton from '../../common/form-button.vue';
import FormCheckbox from '../../common/form-checkbox.vue';
import StarRating from '../../common/star-rating.vue';

interface SelectDiveSiteListItemProps {
  multiSelect?: boolean;
  selected?: boolean;
  site: DiveSiteDTO & { selected?: boolean };
}

const props = withDefaults(defineProps<SelectDiveSiteListItemProps>(), {
  multiSelect: false,
  selected: false,
});
defineEmits<{
  (e: 'select', site: DiveSiteDTO): void;
  (e: 'highlight', site: DiveSiteDTO): void;
  (e: 'toggle-checked', site: DiveSiteDTO & { selected?: boolean }): void;
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

function booleanText(value?: boolean): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unspecified';
}

watch(
  () => props.selected,
  (val) => {
    // The scrollIntoView method ought to work in most browsers but will blow up in tests.
    // Hence, the try/catch.
    try {
      if (val) {
        listItemElement.value?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
        });
      }
    } catch (error) {
      Logger.warn(error as Error);
    }
  },
);
</script>
