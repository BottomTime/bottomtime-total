<template>
  <div v-if="!dismissed" id="cookie-warning" class="cookie-message box">
    <div class="container">
      <article class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <span class="icon is-large">
              <i class="fas fa-cookie-bite fa-3x"></i>
            </span>
          </p>
        </figure>
        <div class="media-content">
          <p class="subtitle">Cookies!!</p>
          <p class="content is-italic is-size-6 block">
            We totally use cookies. Don't worry though, it's not the third-party
            kind! We just use them to keep you logged in and we don't give away
            or sell your personal information to anyone! If you have any
            questions or concerns please read our
            <RouterLink to="/privacy">privacy policy</RouterLink>.
          </p>
          <p class="content is-italic is-size-6 block">
            By continuing to use the site you implicitly accept our use of
            cookies to maintain your session.
          </p>
        </div>
        <div class="media-right">
          <div class="buttons is-right">
            <button
              id="btn-accept-cookies"
              class="button is-primary"
              @click="dismiss"
            >
              Ok! Got it!
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineEmits, ref } from 'vue';
import { useStore } from '@/store';

const AcceptedCookiesKey = 'cookies_accepted';
const store = useStore();

const emit = defineEmits<{
  (e: 'dismissed'): void;
}>();

const dismissClicked = ref(false);
const dismissed = computed(() => {
  if (dismissClicked.value || store.state.currentUser) return true;
  const value = localStorage.getItem(AcceptedCookiesKey);
  return value === 'true';
});

function dismiss() {
  localStorage.setItem(AcceptedCookiesKey, 'true');
  dismissClicked.value = true;
  emit('dismissed');
}
</script>

<style>
.cookie-message {
  bottom: 2rem;
  left: 2.5%;
  min-width: 95%;
  position: fixed;
  vertical-align: middle;
}
</style>
