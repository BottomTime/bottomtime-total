import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ProfilePanel from '../../../../src/components/users/profile-panel.vue';
import { createRouter } from '../../../fixtures/create-router';
import { UserWithFullProfile } from '../../../fixtures/users';

dayjs.extend(relativeTime);

describe('Profile panel component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ProfilePanel>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will remain hidden if visible is false', () => {
    const wrapper = mount(ProfilePanel, {
      ...opts,
      props: { visible: false },
    });

    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
  });

  it('will render a loading spinner if isLoading is true', () => {
    const wrapper = mount(ProfilePanel, {
      ...opts,
      props: { isLoading: true, visible: true },
    });

    expect(wrapper.find('[data-testid="profile-name"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="loading-profile"]').isVisible()).toBe(
      true,
    );
  });

  it('will render a not found message if the profile is undefined', () => {
    const wrapper = mount(ProfilePanel, {
      ...opts,
      props: { visible: true },
    });

    expect(wrapper.find('[data-testid="profile-name"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="profile-not-found"]').isVisible()).toBe(
      true,
    );
  });

  it('will render the profile if it is available', () => {
    const wrapper = mount(ProfilePanel, {
      ...opts,
      props: { profile: UserWithFullProfile.profile, visible: true },
    });

    expect(wrapper.find('[data-testid="profile-name"]').text()).toBe(
      UserWithFullProfile.profile.name,
    );
  });
});
