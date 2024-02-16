<template>
  <PageTitle title="Terms of Service" />
  <BreadCrumbs :items="[{ label: 'Terms of Service', active: true }]" />
  <div class="flex flex-col gap-4">
    <p class="font-bold">Effective Date: February 14, 2024</p>

    <p>
      Thank you for using {{ appTitle }} (the "Website"). These Terms of Service
      ("Terms") govern your access to and use of the Website. By accessing or
      using the Website, you agree to be bound by these Terms. If you do not
      agree to these Terms, please do not use the Website.
    </p>

    <TextHeading>Use of the Website</TextHeading>
    <ul class="list-outside list-disc ml-10">
      <li>
        <span class="font-bold">Content:</span> The content provided on the
        Website, including but not limited to text, images, videos, and
        graphics, is for informational purposes only. It is subject to change
        without notice.
      </li>
      <li>
        <span class="font-bold">User Conduct:</span> You agree not to use the
        Website for any unlawful or prohibited purpose. You may not interfere
        with the operation of the Website, including but not limited to hacking,
        scraping, or transmitting viruses or harmful code.
      </li>
      <li>
        <span class="font-bold">Intellectual Property:</span> All content and
        materials on the Website, including trademarks, logos, and copyrightable
        works, are the property of {{ appTitle }} or its licensors and are
        protected by intellectual property laws. You may not use, copy,
        reproduce, modify, or distribute any content from the Website without
        prior written permission.
      </li>
      <li>
        <span class="font-bold">Links to Third-Party Websites:</span> The
        Website may contain links to third-party websites that are not owned or
        controlled by {{ appTitle }}. We are not responsible for the content or
        privacy practices of these websites. Your use of third-party websites is
        at your own risk.
      </li>
    </ul>

    <TextHeading>Disclaimer of Warranties</TextHeading>
    <ul class="list-outside list-disc ml-10">
      <li>
        <span class="font-bold">No Warranty:</span> The Website is provided on
        an "as is" and "as available" basis, without any warranties of any kind,
        either express or implied. {{ appTitle }} disclaims all warranties,
        including but not limited to warranties of merchantability, fitness for
        a particular purpose, and non-infringement.
      </li>
      <li>
        <span class="font-bold">Limitation of Liability:</span> In no event
        shall {{ appTitle }} or its affiliates, officers, directors, employees,
        or agents be liable for any direct, indirect, incidental, special, or
        consequential damages arising out of or in any way connected with your
        use of the Website.
      </li>
    </ul>

    <TextHeading>Indemnification</TextHeading>
    <p>
      You agree to indemnify, defend, and hold harmless {{ appTitle }} and its
      affiliates, officers, directors, employees, and agents from and against
      any and all claims, liabilities, damages, losses, costs, expenses, or fees
      (including reasonable attorneys' fees) arising out of or in any way
      related to your use of the Website or violation of these Terms.
    </p>

    <TextHeading>Changes to the Terms</TextHeading>
    <p>
      {{ appTitle }} reserves the right to update or change these Terms at any
      time without notice. Your continued use of the Website after any such
      changes constitutes your acceptance of the revised Terms.
    </p>

    <TextHeading>Governing Law</TextHeading>
    <p>
      These Terms shall be governed by and construed in accordance with the laws
      of Ontario, Canada, without regard to its conflict of law principles.
    </p>

    <TextHeading>Contact Us</TextHeading>
    <p>
      If you have any questions or concerns about these Terms, please contact us
      at <NavLink :to="`mailto:${adminEmail}`">{{ adminEmail }}</NavLink
      >.
    </p>

    <p>
      By using the Website, you agree to be bound by these Terms of Service.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NavLink from '../components/common/nav-link.vue';
import PageTitle from '../components/common/page-title.vue';
import TextHeading from '../components/common/text-heading.vue';
import { Config } from '../config';

const adminEmail = computed(() => `mailto:${Config.adminEmail}`);
const appTitle = computed(() => Config.appTitle);
</script>
