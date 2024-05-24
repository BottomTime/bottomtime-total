<template>
  <li ref="listItemElement" :class="classes">
    <div>
      <FormButton ref="selectButton" size="sm" @click="$emit('select', site)">
        Select
      </FormButton>
    </div>
    <div>
      <div class="flex align-baseline justify-between">
        <button @click="() => $emit('highlight', site)">
          <p class="text-xl font-title capitalize hover:text-link-hover">
            {{ site.name }}
          </p>
        </button>

        <p v-if="site.averageRating" class="flex gap-2">
          <StarRating :rating="site.averageRating" />
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

        <div class="text-center">
          <p class="font-bold">Max depth</p>
          <p v-if="site.depth">
            <DepthText :depth="site.depth.depth" :unit="site.depth.unit" />
          </p>
          <p v-else>(unspecified)</p>
        </div>

        <div class="text-center">
          <p class="font-bold">Free to dive</p>
          <p v-if="typeof site.freeToDive === 'boolean'">
            {{ site.freeToDive ? 'Yes' : 'No' }}
          </p>
          <p v-else>(unspecified)</p>
        </div>

        <div class="text-center">
          <p class="font-bold">Shore access</p>
          <p v-if="typeof site.shoreAccess === 'boolean'">
            {{ site.shoreAccess ? 'Yes' : 'No' }}
          </p>
          <p v-else>(unspecified)</p>
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { computed, ref, watch } from 'vue';

import DepthText from '../../common/depth-text.vue';
import FormButton from '../../common/form-button.vue';
import StarRating from '../../common/star-rating.vue';

interface SelectDiveSiteListItemProps {
  selected?: boolean;
  site: DiveSiteDTO;
}

const props = withDefaults(defineProps<SelectDiveSiteListItemProps>(), {
  selected: false,
});
defineEmits<{
  (e: 'select', site: DiveSiteDTO): void;
  (e: 'highlight', site: DiveSiteDTO): void;
}>();

const listItemElement = ref<HTMLLIElement | null>(null);
const classes = computed(() => ({
  border: props.selected,
  'odd:bg-blue-500/40': true,
  'odd:dark:bg-blue-600/40': true,
  'border-success': props.selected,
  'rounded-md': true,
  'p-2': true,
  'space-y-2': true,
  flex: true,
  'gap-2': true,
  'items-center': true,
}));

watch(
  () => props.selected,
  (val) => {
    if (val)
      listItemElement.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
  },
);
</script>
