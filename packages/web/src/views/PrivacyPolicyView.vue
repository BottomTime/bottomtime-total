<template>
  <PageTitle title="Privacy Policy" />
  <section class="section">
    <div class="container has-text-justified">
      <p class="content">
        This Privacy Policy explains how we collect, use, and protect your
        personal information when you use our website. By accessing or using our
        website, you consent to our Privacy Policy.
      </p>

      <p class="subtitle">Information We Collect</p>

      <p class="content">
        When you visit our website, we may collect certain information about
        you, such as your IP address, browser type, device type, and operating
        system. We may also collect information about your activities on our
        website, such as the pages you visit, the links you click, and the time
        and date of your visit.
      </p>

      <p class="subtitle">Cookies</p>

      <p class="content">
        We use session cookies to enhance your browsing experience and to
        improve our website. Session cookies are temporary and expire when you
        close your browser. We may also use persistent cookies, which remain on
        your device for a limited period of time, typically a few weeks.
        Persistent cookies help us remember your preferences and provide a more
        personalized experience. We do not use persistent cookies to track your
        activities over time or across different websites.
      </p>

      <p class="content">
        You can choose to disable cookies in your browser settings, but please
        note that some features of our website may not function properly without
        cookies.
      </p>

      <p class="content">
        We do not give away or sell your cookie data to third parties.
      </p>

      <p class="subtitle">Use of Information</p>

      <p class="content">
        We use the information we collect to provide and improve our website, to
        communicate with you, and to personalize your experience. We do not give
        away or sell your information to third parties.
      </p>

      <p class="subtitle">Disclosure of Information</p>

      <p class="content">
        We may disclose your information if required by law or in response to a
        subpoena, court order, or other legal process. We may also disclose your
        information to law enforcement or other government officials if we
        believe that the disclosure is necessary to prevent a crime or to
        protect the safety of our users or the public.
      </p>

      <p class="subtitle">Security</p>

      <p class="content">
        We take reasonable measures to protect your personal information from
        unauthorized access, use, or disclosure. However, no security system is
        100% secure, and we cannot guarantee the security of your information.
      </p>

      <p class="subtitle">Third-Party Websites</p>

      <p class="content">
        Our website may contain links to third-party websites that are not under
        our control. We are not responsible for the privacy practices or content
        of those websites.
      </p>

      <p class="subtitle">Changes to Our Privacy Policy</p>

      <p class="content">
        We reserve the right to modify this Privacy Policy at any time. If we
        make material changes to our Privacy Policy, we will notify you by email
        or by posting a notice on our website.
      </p>

      <p class="subtitle">Contact Us</p>

      <p class="content">
        If you have any questions or concerns about our Privacy Policy, please
        contact us at
        <a :href="`mailto:${config.adminEmail}`">{{ config.adminEmail }}</a
        >.
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import config from '@/config';
import PageTitle from '@/components/PageTitle.vue';
</script>
