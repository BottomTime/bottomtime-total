import { shallowMount } from '@vue/test-utils';

import UserAvatar from '../../../../src/components/users/user-avatar.vue';

describe('User Avatar component', () => {
  it('will render correctly for user with absolute avatar URL', () => {
    const wrapper = shallowMount(UserAvatar, {
      props: {
        displayName: 'Test User',
        avatar: 'https://example.com/users/dave/avatar',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for user with relative avatar URL', () => {
    const wrapper = shallowMount(UserAvatar, {
      props: {
        displayName: 'Test User',
        avatar: '/api/users/Dave_Tests/avatar',
        size: 'large',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render initials for user without avatar URL but with username', () => {
    const wrapper = shallowMount(UserAvatar, {
      props: {
        displayName: 'Test User',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will url-encode value of display name when necessary', () => {
    const wrapper = shallowMount(UserAvatar, {
      props: {
        displayName: '@TestUser_69??',
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
