<template>
  <Transition name="slide-fade">
    <div id="password-help" class="notification is-info is-light">
      <article class="media">
        <figure class="media-left">
          <span class="icon is-large">
            <i class="fas fa-key fa-3x"></i>
          </span>
        </figure>
        <div class="media-content">
          <p class="help content">
            For your security, passwords must meet the following requirements to
            ensure adequate strength against ne'er-do-wells and scalawags. Your
            password must...
          </p>
          <div class="help content">
            <ul>
              <li>Contain at least one upper-case letter.</li>
              <li>Contain at least one lower-case letter.</li>
              <li>Contain at least one number.</li>
              <li>
                Contain at least one special character. (One of
                <span class="is-family-code">{{
                  '~`!@#$%^&*()-_+=}{}[]<>,./?|\\/'
                }}</span
                >)
              </li>
              <li>Be at least 12 characters long.</li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  </Transition>
</template>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-25px);
  opacity: 0;
}
</style>
