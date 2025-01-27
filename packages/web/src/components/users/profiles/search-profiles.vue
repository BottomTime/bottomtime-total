<template>
  <form @submit.prevent="">
    <fieldset class="space-y-4" :disabled="state.isSearching || isSaving">
      <FormSearchBox v-model="state.query" autofocus @search="onSearch" />

      <div class="text-center">
        <FormButton
          :type="state.profiles ? 'normal' : 'primary'"
          submit
          @click="onSearch"
        >
          <p class="inline-block space-x-1">
            <i class="fa-solid fa-search"></i>
            <span>Search</span>
          </p>
        </FormButton>
      </div>

      <LoadingSpinner
        v-if="state.isSearching"
        class="text-center my-2"
        message="Searching..."
      />

      <div v-else-if="state.profiles">
        <FormBox class="flex items-baseline sticky top-0 z-[70]">
          <p class="grow">
            <span>Showing </span>
            <span class="font-bold">{{ state.profiles.data.length }}</span>
            <span> of </span>
            <span class="font-bold">{{ state.profiles.totalCount }}</span>
            <span> profiles.</span>
          </p>

          <FormButton
            v-if="multiSelect"
            type="primary"
            :disabled="!hasSelected"
            @click="onSelectProfiles"
          >
            Select Users
          </FormButton>
        </FormBox>

        <TransitionList class="px-2">
          <ProfileListItem
            v-for="profile in state.profiles.data"
            :key="profile.username"
            :profile="profile"
            :multi-select="multiSelect"
            @toggle-selected="onToggleProfileSelected"
            @profile-selected="onProfileSelected"
          />

          <li
            v-if="state.profiles.data.length < state.profiles.totalCount"
            class="text-center my-8 text-lg"
          >
            <LoadingSpinner
              v-if="state.isLoadingMore"
              message="Fetching more results..."
            />

            <FormButton v-else type="link" size="lg" @click="onLoadMore">
              <p class="space-x-1">
                <i class="fa-solid fa-arrow-down"></i>
                <span>Load More</span>
              </p>
            </FormButton>
          </li>
        </TransitionList>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { ApiList, ProfileDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { Selectable } from '../../../common';
import { useOops } from '../../../oops';
import FormBox from '../../common/form-box.vue';
import FormButton from '../../common/form-button.vue';
import FormSearchBox from '../../common/form-search-box.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TransitionList from '../../common/transition-list.vue';
import ProfileListItem from './profile-list-item.vue';

interface SearchProfilesProps {
  isSaving?: boolean;
  multiSelect?: boolean;
}

interface SearchProfilesState {
  isLoadingMore: boolean;
  isSearching: boolean;
  query: string;
  profiles?: ApiList<Selectable<ProfileDTO>>;
}

const client = useClient();
const oops = useOops();

withDefaults(defineProps<SearchProfilesProps>(), {
  isSaving: false,
  multiSelect: false,
});
const emit = defineEmits<{
  (e: 'select-profiles', profiles: ProfileDTO | ProfileDTO[]): void;
}>();
const state = reactive<SearchProfilesState>({
  isLoadingMore: false,
  isSearching: false,
  query: '',
});

const hasSelected = computed(
  () => state.profiles?.data.some((p) => p.selected) ?? false,
);

async function onSearch(): Promise<void> {
  state.isSearching = true;

  await oops(async () => {
    state.profiles = await client.userProfiles.searchProfiles({
      query: state.query,
      limit: 50,
    });
  });

  state.isSearching = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    if (!state.profiles) return;
    const results = await client.userProfiles.searchProfiles({
      query: state.query,
      limit: 50,
      skip: state.profiles.data.length,
    });

    state.profiles.data.push(...results.data);
    state.profiles.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

function onToggleProfileSelected(
  profile: Selectable<ProfileDTO>,
  selected: boolean,
) {
  profile.selected = selected;
}

function onProfileSelected(profile: ProfileDTO) {
  emit('select-profiles', profile);
}

function onSelectProfiles() {
  if (state.profiles) {
    emit(
      'select-profiles',
      state.profiles.data.filter((p) => p.selected),
    );
  }
}
</script>
