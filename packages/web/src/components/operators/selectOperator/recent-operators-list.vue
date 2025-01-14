<template>
  <div class="space-y-4">
    <p class="text-sm text-center">
      Here are your most recently used dive shops. These are the shops you've
      used on your most recently created log entries.
    </p>

    <div v-if="currentOperator">
      <TextHeading level="h3">Current Dive Shop</TextHeading>
      <SelectOperatorListItem
        class="rounded-md p-2"
        :operator="currentOperator"
        :selected="state.selectedOperator === currentOperator.id"
        @highlight="onOperatorHighlighted"
        @select="(operator) => $emit('operator-selected', operator)"
      />
    </div>

    <div>
      <TextHeading v-if="currentOperator" level="h3">Recent Sites</TextHeading>

      <div v-if="state.isLoading" class="py-3 text-center">
        <LoadingSpinner message="Fetching most recently logged dive shops..." />
      </div>

      <TransitionList v-else>
        <SelectOperatorListItem
          v-for="operator in state.recentOperators"
          :key="operator.slug"
          :operator="operator"
          :selected="operator.id === state.selectedOperator"
          @highlight="onOperatorHighlighted"
          @select="(operator) => $emit('operator-selected', operator)"
        />
        <li
          v-if="state.recentOperators.length === 0"
          class="text-center text-lg space-x-2 my-4"
        >
          <span>
            <i class="fa-solid fa-magnifying-glass"></i>
          </span>
          <span class="italic">
            You don't have any recently used dive shops to dispaly. Try
            searching for one!
          </span>
        </li>
      </TransitionList>
    </div>

    <span v-if="state.isLoading"> Loading... </span>
  </div>
</template>

<script lang="ts" setup>
import { OperatorDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TextHeading from '../../common/text-heading.vue';
import TransitionList from '../../common/transition-list.vue';
import SelectOperatorListItem from './select-operator-list-item.vue';

interface RecentOperatorsListProps {
  currentOperator?: OperatorDTO;
}

interface RecentOperatorsListState {
  isLoading: boolean;
  selectedOperator?: string;
  recentOperators: OperatorDTO[];
}

const client = useClient();
const oops = useOops();
const route = useRoute();

const props = defineProps<RecentOperatorsListProps>();
defineEmits<{
  (e: 'operator-selected', operator: OperatorDTO): void;
}>();
const state = reactive<RecentOperatorsListState>({
  isLoading: true,
  selectedOperator: props.currentOperator?.id,
  recentOperators: [],
});

onMounted(async () => {
  state.isLoading = true;

  await oops(async () => {
    if (typeof route.params.username !== 'string') return;
    state.recentOperators = await client.logEntries.getMostRecentDiveOperators(
      route.params.username,
    );
  });

  state.isLoading = false;
});

function onOperatorHighlighted(operator: OperatorDTO) {
  state.selectedOperator = operator.id;
}
</script>
