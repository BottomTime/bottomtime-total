import { mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import ProfilePanel from '../../../../src/components/users/profile-panel.vue';
import { UserWithFullProfile } from '../../../fixtures/users';

dayjs.extend(relativeTime);

describe('Profile panel component', () => {
  it('will remain hidden if visible is false', () => {
    const wrapper = mount(ProfilePanel, {
      props: { visible: false },
    });

    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
  });

  it('will render a loading spinner if isLoading is true', () => {
    const wrapper = mount(ProfilePanel, {
      props: { isLoading: true, visible: true },
    });

    expect(wrapper.find('[data-testid="profile-name"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="loading-profile"]').isVisible()).toBe(
      true,
    );
  });

  it('will render a not found message if the profile is undefined', () => {
    const wrapper = mount(ProfilePanel, {
      props: { visible: true },
    });

    expect(wrapper.find('[data-testid="profile-name"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="profile-not-found"]').isVisible()).toBe(
      true,
    );
  });

  it('will render the profile if it is available', () => {
    const wrapper = mount(ProfilePanel, {
      props: { profile: UserWithFullProfile.profile, visible: true },
    });

    expect(wrapper.find('[data-testid="profile-name"]').text()).toBe(
      UserWithFullProfile.profile.name,
    );
  });
});
