<template>
  <div class="flex flex-wrap gap-2 text-sm">
    <p
      v-for="(tag, index) in tags"
      :key="tag"
      :class="`rounded-full flex gap-1 items-center bg-secondary text-grey-900 px-1.5 py-1 shadow-sm shadow-grey-500 ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      }`"
      @click="() => onTagClick(tag)"
    >
      <span>#{{ tag }}</span>
      <button
        v-if="!readonly"
        class="hover:bg-danger-hover rounded-full px-1"
        :data-testid="`btn-remove-tag-${tag}`"
        @click.stop="() => onRemoveTag(index)"
      >
        <i class="fa-solid fa-xmark"></i>
        <span class="sr-only">Remove tag "{{ tag }}"</span>
      </button>
    </p>

    <p v-if="readonly && tags.length === 0">No tags</p>

    <div v-if="!readonly" class="flex flex-wrap gap-2 items-baseline">
      <template v-if="state.isAddMode">
        <div class="relative">
          <input
            ref="newTagInput"
            v-model.trim="state.newTag"
            :class="`appearance-none p-1 ${
              v$.newTag.$error ? 'border-2 border-danger' : 'border-0'
            } ring-0 outline-0 rounded-md bg-secondary text-grey-900 shadow-sm shadow-grey-500`"
            data-testid="new-tag-input"
            @keyup.escape="onCancelNewTag"
            @keyup.enter="onConfirmNewTag"
            @keyup.down="onKeyDown"
            @keyup.up="onKeyUp"
            @input="onNewTagChanged"
          />
          <div class="absolute right-1 top-2 flex gap-0.5">
            <button
              class="bg-success rounded-full w-[16px] h-[16px]"
              data-testid="btn-confirm-add-tag"
              @click="onConfirmNewTag"
            >
              <i class="fa-solid fa-check fa-xs"></i>
              <span class="sr-only">Add new tag</span>
            </button>
            <button
              class="bg-danger rounded-full w-[16px] h-[16px]"
              data-testid="btn-cancel-add-tag"
              @click="onCancelNewTag"
            >
              <i class="fa-solid fa-xmark fa-xs"></i>
            </button>
          </div>

          <ul
            v-if="
              state.newTag.length >= props.minSearchLength &&
              state.autoCompleteOptions.length > 0
            "
            class="absolute bg-secondary text-grey-900 rounded-b-sm top-[100%] w-[90%] mx-1 text-lg"
          >
            <li
              v-for="(option, index) in state.autoCompleteOptions"
              :key="option"
              :class="getAutoCompleteOptionClasses(index)"
              @click="() => onAutoCompleteSelected(index)"
            >
              {{ option }}
            </li>
            <li
              v-if="state.autoCompleteOptions.length === 0"
              class="cursor-not-allowed px-1 italic"
            >
              (no suggestions)
            </li>
          </ul>
        </div>

        <p v-if="v$.newTag.$error" class="text-danger">
          {{ v$.newTag.$errors[0].$message }}
        </p>
        <!-- Validation -->
      </template>
      <button
        v-else
        ref="addTagButton"
        class="flex items-center gap-1 bg-link hover:bg-link-hover px-1.5 py-1 rounded-full"
        @click.prevent="onNewTag"
      >
        <span>
          <i class="fa-solid fa-plus"></i>
        </span>
        <span>Add</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import useVuelidate from '@vuelidate/core';
import { helpers, requiredIf } from '@vuelidate/validators';

import { nextTick, reactive, ref } from 'vue';
import { z } from 'zod';

interface FormTagsProps {
  autocomplete?: (prefix: string) => string[] | Promise<string[]>;
  clickable?: boolean;
  minSearchLength?: number;
  readonly?: boolean;
}

interface FormTagsState {
  autoCompleteOptions: string[];
  isAddMode: boolean;
  newTag: string;
  selectedAutoCompleteOption: number;
  tagSet: Set<string>;
}

const TagSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+( [a-z0-9]+)*$/i);

const props = withDefaults(defineProps<FormTagsProps>(), {
  clickable: false,
  minSearchLength: 3,
  readonly: false,
});
const emit = defineEmits<{
  (e: 'click', tag: string): void;
}>();

const tags = defineModel<string[]>({ required: false, default: () => [] });
const state = reactive<FormTagsState>({
  autoCompleteOptions: [],
  isAddMode: false,
  newTag: '',
  selectedAutoCompleteOption: -1,
  tagSet: new Set(tags.value.map((tag) => tag.toLowerCase())),
});

const newTagInput = ref<HTMLInputElement | null>(null);
const addTagButton = ref<HTMLButtonElement | null>(null);

const v$ = useVuelidate<Pick<FormTagsState, 'newTag'>>(
  {
    newTag: {
      required: helpers.withMessage(
        'New tag is required',
        requiredIf(() => state.isAddMode),
      ),
      regex: helpers.withMessage(
        'New tag must be at least 3 characters long and contain only letters, numbers, and spaces',
        (tag) => !helpers.req(tag) || TagSchema.safeParse(tag).success,
      ),
      unique: helpers.withMessage(
        'Tag already exists',
        (tag: string) => !state.tagSet.has(tag.toLowerCase()),
      ),
    },
  },
  state,
);

function getAutoCompleteOptionClasses(index: number): object {
  const isSelected = index === state.selectedAutoCompleteOption;
  return {
    'px-1': true,
    'cursor-pointer': true,
    'bg-primary-dark': isSelected,
    'hover:bg-primary': isSelected,
    'text-grey-50': isSelected,
    'hover:bg-secondary-hover': !isSelected,
  };
}

async function onNewTag(): Promise<void> {
  state.newTag = '';
  state.isAddMode = true;
  await nextTick();
  v$.value.$reset();
  newTagInput.value?.focus();
}

async function onCancelNewTag(): Promise<void> {
  state.isAddMode = false;
  await nextTick();
  addTagButton.value?.focus();
}

async function onConfirmNewTag(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  const tag = state.newTag.replace(/^#/, '');
  tags.value.push(tag);
  state.tagSet.add(tag.toLowerCase());
  state.isAddMode = false;
  state.newTag = '';

  await nextTick();
  addTagButton.value?.focus();
}

function onRemoveTag(index: number) {
  const [removed] = tags.value.splice(index, 1);
  if (removed) state.tagSet.delete(removed.toLowerCase());
}

function onTagClick(tag: string) {
  if (props.clickable) emit('click', tag);
}

function onKeyDown() {
  state.selectedAutoCompleteOption =
    ++state.selectedAutoCompleteOption % state.autoCompleteOptions.length;

  if (state.autoCompleteOptions[state.selectedAutoCompleteOption]) {
    state.newTag = state.autoCompleteOptions[state.selectedAutoCompleteOption];
  }
}

function onKeyUp() {
  state.selectedAutoCompleteOption =
    --state.selectedAutoCompleteOption % state.autoCompleteOptions.length;

  if (state.autoCompleteOptions[state.selectedAutoCompleteOption]) {
    state.newTag = state.autoCompleteOptions[state.selectedAutoCompleteOption];
  }
}

async function onAutoCompleteSelected(index: number): Promise<void> {
  state.newTag = state.autoCompleteOptions[index];
  state.selectedAutoCompleteOption = index;
  newTagInput.value?.focus();
  await onConfirmNewTag();
}

async function onNewTagChanged(): Promise<void> {
  if (props.autocomplete && state.newTag.length >= props.minSearchLength) {
    state.autoCompleteOptions = await props.autocomplete(state.newTag);
    state.selectedAutoCompleteOption = -1;
  }
}
</script>
