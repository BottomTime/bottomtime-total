import { shallowMount } from '@vue/test-utils';
import UserAvatar from '../../../../src/components/users/user-avatar.vue';

describe('User Avatar component', () => {
  it('will render correctly for user with avatar URL', () => {
    const wrapper = shallowMount(UserAvatar, {
      props: {
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.png',
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
