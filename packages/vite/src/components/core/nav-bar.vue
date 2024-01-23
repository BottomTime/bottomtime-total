<template>
  <section class="h-16">
    <div
      class="absolute top-0 w-full font-content bg-blue-900 text-blue-200 rounded-b-lg opacity-90 shadow-md shadow-blue-500"
    >
      <div
        class="container p-3 mx-auto h-16 flex flex-row items-baseline content-center justify-stretch"
      >
        <!-- Brand Logo -->
        <div
          class="h-12 w-40 flex-none text-2xl font-bold text-red drop-shadow-md"
        >
          <a href="/">Bottom Time</a>
        </div>

        <!-- Collapsable Links (collapse to hamburger menu on small screens) -->
        <div class="grow">
          <ul class="flex flex-row flex-nowrap justify-start items-start gap-6">
            <NavBarLink to="/" title="Home" />
            <NavBarLink to="/about" title="About" />
          </ul>
        </div>

        <!-- Right-Hand Dropdown (always visible) -->
        <div class="p-1 h-12 w-44 flex-non text-right text-lg">Menu</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import NavBarLink from './nav-bar-link.vue';
</script>
