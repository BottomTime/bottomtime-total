<template>
  <PageTitle title="Privacy Policy" />
  <BreadCrumbs :items="[{ label: 'Privacy Policy', active: true }]" />

  <div class="flex flex-col gap-4">
    <p class="font-bold">Effective Date: February 14, 2024</p>

    <p>
      Thank you for visiting
      <span class="font-bold">{{ appTitle }}</span> (the "Website"). We are
      committed to protecting your privacy and ensuring that your personal
      information is handled in a safe and responsible manner. This Privacy
      Policy outlines the types of personal information we collect, how it is
      used, and the choices you have regarding your information.
    </p>

    <TextHeading>Information We Collect</TextHeading>
    <p>
      We collect personal information that you voluntarily provide to us when
      you interact with our Website, such as when you register for an account,
      subscribe to our newsletter, make a purchase, or contact us through our
      contact form. The types of personal information we may collect include:
    </p>

    <ul class="list-outside list-disc ml-10">
      <li>Name</li>
      <li>Email address</li>
      <li>Birthdate</li>
      <li>Location</li>
      <li>Diving history</li>
      <!-- <li>Mailing address</li> -->
      <!-- <li>Phone number</li> -->
      <!-- <li>Payment information (such as credit card details)</li> -->
      <li>
        User-generated content (such as comments, reviews, dive logs, etc.)
      </li>
      <li>Any other information you choose to provide</li>
    </ul>

    <TextHeading>How We Use Your Information</TextHeading>
    <p>
      We use the personal information we collect for the following purposes:
    </p>

    <ul class="list-outside list-disc ml-10">
      <!-- <li>To process and fulfill your orders and requests</li> -->
      <li>To communicate with you about your account</li>
      <li>
        To send you promotional emails, newsletters, and marketing
        communications (you may opt-out at any time)
      </li>
      <li>To improve our Website and services</li>
      <!-- <li>To prevent fraud and enhance the security of our Website</li> -->
      <!-- <li>To comply with legal obligations</li> -->
    </ul>

    <TextHeading>Information Sharing</TextHeading>
    <p>
      We do not sell, trade, or otherwise transfer your personal information to
      third parties without your consent, except as described below:
    </p>

    <ul class="list-outside list-disc ml-10">
      <!-- <li>
        Service Providers: We may share your information with trusted
        third-party service providers who assist us in operating our Website,
        conducting our business, or servicing you. These service providers are
        contractually obligated to use your information only for the purposes of
        providing services to us and are prohibited from disclosing or using
        your information for any other purpose.
      </li> -->
      <li>
        Legal Compliance: We may disclose your information if required by law or
        in response to a lawful request from governmental authorities or law
        enforcement agencies.
      </li>
    </ul>

    <TextHeading>Your Choices</TextHeading>
    <p>You have the following choices regarding your personal information:</p>

    <ul class="list-outside list-disc ml-10">
      <li>
        You may opt-out of receiving promotional emails and marketing
        communications by following the unsubscribe instructions included in
        these emails.
      </li>
      <li>
        You may update, correct, or delete your account information by logging
        into your account settings or by contacting us directly.
      </li>
    </ul>

    <TextHeading>Security</TextHeading>
    <p>
      We implement reasonable security measures to protect your personal
      information from unauthorized access, alteration, disclosure, or
      destruction. However, no method of transmission over the internet or
      electronic storage is 100% secure, and we cannot guarantee absolute
      security.
    </p>

    <TextHeading>Children's Privacy</TextHeading>
    <p>
      Our Website is not directed to children under the age of 13, and we do not
      knowingly collect personal information from children under the age of 13.
      If we become aware that we have collected personal information from a
      child under the age of 13, we will take steps to delete such information
      from our records.
    </p>

    <TextHeading>Changes to this Privacy Policy</TextHeading>
    <p>
      We reserve the right to update or change this Privacy Policy at any time.
      Any changes will be effective immediately upon posting the revised Privacy
      Policy on this page. We encourage you to review this Privacy Policy
      periodically for any changes.
    </p>

    <TextHeading>Contact Us</TextHeading>
    <p>
      If you have any questions or concerns about this Privacy Policy or our
      privacy practices, please contact us at
      <a :href="`mailto:${adminEmail}`"> {{ adminEmail }} </a>.
    </p>

    <p>
      By using our Website, you consent to the terms of this Privacy Policy.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import TextHeading from '../components/common/text-heading.vue';
import { Config } from '../config';

const adminEmail = computed(() => Config.adminEmail);
const appTitle = computed(() => Config.appTitle);
</script>
