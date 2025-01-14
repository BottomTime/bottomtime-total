<template>
  <li ref="listItemElement" :class="classes">
    <div>
      <FormButton
        size="sm"
        :test-id="`select-operator-${operator.slug}`"
        @click="$emit('select', operator)"
      >
        Select
      </FormButton>
    </div>

    <div class="grow space-y-2">
      <div class="flex align-baseline justify-between">
        <div class="flex gap-2">
          <button
            :data-testid="`site-name-${operator.slug}`"
            @click="$emit('highlight', operator)"
          >
            <p class="text-lg font-title capitalize hover:text-link-hover">
              {{ operator.name }}
            </p>
          </button>

          <PillLabel
            v-if="operator.verificationStatus === VerificationStatus.Verified"
            type="success"
            class="text-xs space-x-1"
          >
            <span>
              <i class="fa-solid fa-check"></i>
            </span>
            <span>Verified</span>
          </PillLabel>
        </div>

        <StarRating
          v-if="operator.averageRating"
          :value="operator.averageRating"
          readonly
        />
      </div>

      <p class="text-sm text-justify italic">{{ operator.description }}</p>

      <div class="flex gap-6 justify-between">
        <div class="text-center">
          <p class="font-bold">Address</p>
          <p>{{ operator.address }}</p>
        </div>

        <div v-if="operator.phone" class="text-center">
          <p class="font-bold">Phone</p>
          <p>
            <a :href="`tel:${operator.phone}`">{{ operator.phone }}</a>
          </p>
        </div>

        <div v-if="operator.email" class="text-center">
          <p class="font-bold">Email</p>
          <p>
            <a :href="`mailto:${operator.email}`">{{ operator.email }}</a>
          </p>
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { OperatorDTO, VerificationStatus } from '@bottomtime/api';

import { computed, ref, watch } from 'vue';

import FormButton from '../../common/form-button.vue';
import PillLabel from '../../common/pill-label.vue';
import StarRating from '../../common/star-rating.vue';

interface SelectOperatorListItemProps {
  operator: OperatorDTO;
  selected?: boolean;
}

const props = withDefaults(defineProps<SelectOperatorListItemProps>(), {
  selected: false,
});
defineEmits<{
  (e: 'select', operator: OperatorDTO): void;
  (e: 'highlight', operator: OperatorDTO): void;
}>();

const listItemElement = ref<HTMLLIElement | null>(null);

const classes = computed(() => ({
  flex: true,
  'gap-2': true,
  'items-center': true,
  'border-2': props.selected,
  'border-success': props.selected,
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
