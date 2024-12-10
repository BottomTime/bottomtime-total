<template>
  <PageTitle title="Cookie Policy" />
  <BreadCrumbs :items="[{ label: 'Cookie Policy', active: true }]" />
  <div class="flex flex-col gap-4">
    <p class="font-bold">Effective Date: February 14, 2024</p>

    <p>
      Thank you for visiting {{ appTitle }} (the "Website"). This Cookie Policy
      explains how we use cookies and similar tracking technologies on our
      Website. By using our Website, you consent to the use of cookies in
      accordance with this policy.
    </p>

    <TextHeading>What are cookies?</TextHeading>
    <p>
      Cookies are small text files that are stored on your device (computer,
      tablet, smartphone) when you visit a website. They are widely used to make
      websites work more efficiently and to provide information to website
      owners.
    </p>

    <TextHeading>Types of Cookies We Use</TextHeading>
    <ul class="list-outside list-disc ml-10">
      <li>
        <span class="font-bold">Essential Cookies:</span> These cookies are
        necessary for the functioning of our Website and cannot be disabled in
        our systems. They are usually set in response to actions made by you,
        such as setting your privacy preferences, logging in, or filling out
        forms. You can set your browser to block or alert you about these
        cookies, but some parts of the Website may not function properly.
      </li>
      <li>
        <span class="font-bold">Analytics Cookies:</span> These cookies allow us
        to track and analyze how users interact with our Website, including
        which pages are visited most often and how users move around the site.
        This information helps us improve the performance and design of our
        Website. These cookies may be set by us or by third-party providers of
        analytics services.
      </li>
      <li>
        <span class="font-bold">Marketing Cookies:</span> These cookies are used
        to track your browsing habits and activity in order to deliver targeted
        advertisements that are relevant to your interests. They may be used by
        advertising networks to build a profile of your interests and show you
        relevant ads on other sites. These cookies may be set through our
        Website by our advertising partners.
      </li>
    </ul>

    <TextHeading>Your Cookie Choices</TextHeading>
    <p>
      You can choose to accept or decline cookies through your web browser
      settings. Most web browsers automatically accept cookies, but you can
      usually modify your browser settings to decline cookies if you prefer.
      Please note that blocking or deleting cookies may affect the functionality
      of our Website and your ability to access certain features.
    </p>

    <TextHeading>Third-Party Cookies</TextHeading>
    <p>
      Some third-party services that we use on our Website, such as social media
      plugins and embedded content from external websites, may also use cookies
      to track your interaction with their content. We have no control over
      these cookies and recommend that you review the privacy policies of these
      third-party providers for more information about their cookie practices.
    </p>

    <TextHeading>Changes to this Cookie Policy</TextHeading>
    <p>
      We reserve the right to update or change this Cookie Policy at any time.
      Any changes will be effective immediately upon posting the revised Cookie
      Policy on this page. We encourage you to review this Cookie Policy
      periodically for any changes.
    </p>

    <TextHeading>Contact Us</TextHeading>
    <p>
      If you have any questions or concerns about this Cookie Policy or our use
      of cookies, please contact us at
      <a :href="`mailto:${adminEmail}`">{{ adminEmail }}</a
      >.
    </p>

    <p>
      By continuing to use our Website, you consent to the use of cookies as
      described in this Cookie Policy.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import TextHeading from '../components/common/text-heading.vue';
import { Config } from '../config';

const adminEmail = computed(() => `mailto:${Config.adminEmail}`);
const appTitle = computed(() => Config.appTitle);
</script>
