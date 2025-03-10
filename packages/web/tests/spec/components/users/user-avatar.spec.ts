import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, shallowMount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import { BasicUser } from 'tests/fixtures/users';

import UserAvatar from '../../../../src/components/users/user-avatar.vue';

describe('User Avatar component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof UserAvatar>;

  beforeAll(() => {
    client = new ApiClient();
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render correctly for user with absolute avatar URL', () => {
    const wrapper = shallowMount(UserAvatar, {
      ...opts,
      props: {
        profile: {
          ...BasicUser.profile,
          avatar: 'https://example.com/users/dave/avatar',
        },
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for user with relative avatar URL', () => {
    const wrapper = shallowMount(UserAvatar, {
      ...opts,
      props: {
        profile: {
          ...BasicUser.profile,
          avatar: '/api/users/Dave_Tests/avatar',
        },
        size: 'large',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render initials for user without avatar URL but with username', () => {
    const wrapper = shallowMount(UserAvatar, {
      ...opts,
      props: {
        profile: {
          ...BasicUser.profile,
          avatar: undefined,
        },
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will hide name if "showName" prop is false', () => {
    const wrapper = shallowMount(UserAvatar, {
      ...opts,
      props: {
        profile: {
          ...BasicUser.profile,
          avatar: 'https://example.com/users/dave/avatar',
        },
        showName: false,
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
