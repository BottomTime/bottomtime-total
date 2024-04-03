<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="overflow-x-auto space-y-3" v-html="html"></div>
</template>

<script lang="ts" setup>
import showdown from 'showdown';
import { computed } from 'vue';

const markdown = defineModel<string>({ default: '' });

// Apply Tailwind classes to generated HTML elements.
const classMap: Record<string, string> = {
  a: 'font-bold text-link underline hover:text-link-hover',
  blockquote: 'border-l-4 border-gray-300 pl-4 italic',
  code: 'text-sm',
  h1: 'text-2xl font-bold font-title',
  h2: 'text-xl font-bold font-title',
  h3: 'text-lg font-bold font-title',
  h4: 'font-title',
  h5: 'font-title',
  h6: 'font-title',
  ol: 'list-decimal list-inside pl-2',
  pre: 'whitespace-pre',
  table: 'border-collapse table-fixed rounded-md',
  th: 'font-title font-bold bg-grey-600 p-2',
  tr: 'text-sm bg-grey-500 p-2',
  ul: 'list-disc list-inside pl-2',
};

const bindings = Object.keys(classMap).map((key) => ({
  type: 'output',
  regex: new RegExp(`<${key}(.*)>`, 'g'),
  replace: `<${key} class="${classMap[key]}" $1>`,
}));

const converter = new showdown.Converter({
  emoji: true,
  extensions: [...bindings],
  strikethrough: true,

  // TODO: This needs work. It doesn't render correctly under Tailwind.
  // tables: true,
  // tasklists: true,
});

const html = computed(() => converter.makeHtml(markdown.value));
</script>
