import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ProfileDTO } from '../../../../api/src';
import { ApiClient, ApiClientKey } from '../../../src/client';
import EditProfile from '../../../src/components/users/edit-profile.vue';
import { useCurrentUser } from '../../../src/store';
import ProfileView from '../../../src/views/profile-view.vue';
import { createRouter } from '../../fixtures/create-router';
import { BasicUser } from '../../fixtures/users';

describe('Profile View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ProfileView>;

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

  it('will show the login form if user is not authenticated', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    const wrapper = mount(ProfileView, opts);

    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it('will allow the user to modify their profile', () => {
    const newProfile: ProfileDTO = {
      userId: BasicUser.id,
      memberSince: BasicUser.memberSince,
      username: BasicUser.username,
      name: 'New Name',
      bio: 'New Bio',
      location: 'London, UK',
    };
    const currentUser = useCurrentUser(pinia);
    currentUser.user = { ...BasicUser };
    const wrapper = mount(ProfileView, opts);

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="nameInput"]').element.value,
    ).toBe(currentUser.user.profile.name);
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').exists(),
    ).toBe(false);

    const editProfile = wrapper.getComponent(EditProfile);
    editProfile.vm.$emit('save-profile', newProfile);

    expect(currentUser.user.profile).toEqual(newProfile);
  });
});
