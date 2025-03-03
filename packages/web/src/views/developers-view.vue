<template>
  <PageTitle title="For Developers..." />
  <BreadCrumbs :items="Breadcrumbs" />
  <section class="flex flex-col gap-4">
    <p>Howdy fellow developers,</p>

    <p>Wanna contribute to this project? Awesome! I could use the help! ❤</p>

    <p>
      <span>
        For those who want to contribute directly, you can checkout the source
        code
      </span>
      <a
        class="space-x-1"
        href="https://github.com/BottomTime/bottomtime-total"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>from GitHub</span>
        <span><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
      </a>
      <span>
        . There is plenty of documentation in the README files to get started.
      </span>
    </p>

    <p>
      I'm also <span class="italic">very</span> open to developers writing third
      party software to integrate this platform with the larger diver community!
      This platform is built on an API-first architecture, so you can build your
      own front-end, mobile app, or even a CLI tool to interact with the Bottom
      Time platform. I'm especially interested in importing dive logs from our
      user's dive computers as well as cataloguing dive sites and dive shops
      from around the world! Check out our
      <a :href="apiDocumentation" target="_blank" rel="noopener noreferrer">
        API documentation
      </a>
      for more information.
    </p>

    <p>
      Thank you so much for taking an interest in my humble project! I look
      forward to working with each and every one of you!
    </p>

    <p>Happy coding and cheers! 🍻</p>

    <p class="flex flex-col">
      <span>Sincerely,</span>
      <span>Chris Carleton,</span>
      <span>Founder and Lead Engineer</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';

const Breadcrumbs: Breadcrumb[] = [{ label: 'Developers', active: true }];

const apiDocumentation = computed(() => Config.apiDocsUrl);
</script>
