import {
  AccountTier,
  ApiClient,
  Fetcher,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  LogBookSharing,
  ProfileDTO,
  Tank,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import EditProfile from '../../../src/components/users/edit-profile.vue';
import ViewProfile from '../../../src/components/users/view-profile.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useProfiles } from '../../../src/store';
import ProfileView from '../../../src/views/profile-view.vue';
import { createRouter } from '../../fixtures/create-router';
import TestTankData from '../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

dayjs.extend(relativeTime);

const EmptyTankResults: { tanks: Tank[]; totalCount: number } = {
  tanks: [],
  totalCount: 0,
};

describe('Profile View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let tankData: ListTanksResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let profiles: ReturnType<typeof useProfiles>;
  let opts: ComponentMountingOptions<typeof ProfileView>;

  beforeAll(() => {
    const component = defineComponent({});
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/profile/:username',
        component,
      },
      {
        path: '/profile',
        component,
      },
    ]);
    tankData = ListTanksResponseSchema.parse(TestTankData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    profiles = useProfiles(pinia);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: new MockLocation(),
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will pre-fetch the indicated profile on the backend', async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    const spy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);

    const html = await renderToString(ProfileView, {
      global: opts.global,
    });

    const div = document.createElement('div');
    div.innerHTML = html;

    expect(spy).toHaveBeenCalledWith(UserWithFullProfile.username);
    expect(div.querySelector('[data-testid="profile-name"]')).not.toBeNull();
  });

  it('will not attempt to prefetch a profile if there is no username in the path', async () => {
    currentUser.user = BasicUser;
    await router.push('/profile');
    const spy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(BasicUser.profile);
    jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(EmptyTankResults);

    const html = await renderToString(ProfileView, {
      global: opts.global,
    });

    const div = document.createElement('div');
    div.innerHTML = html;

    expect(spy).not.toHaveBeenCalled();
    expect(div.querySelector('[data-testid="nameInput"]')).not.toBeNull();
  });

  it('will prefetch tank profiles if the current user is viewing their own profile', async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${BasicUser.username.toUpperCase()}`);
    const spy = jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
      tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
      totalCount: tankData.totalCount,
    });

    const html = await renderToString(ProfileView, {
      global: opts.global,
    });

    const div = document.createElement('div');
    div.innerHTML = html;

    expect(
      div.querySelector('[data-testid="tank-profiles"]')?.innerHTML,
    ).toMatchSnapshot();

    expect(spy).toHaveBeenCalledWith({
      username: BasicUser.username.toUpperCase(),
      includeSystem: false,
    });
  });

  it('will prefetch tank profiles if an admin is viewing the profile', async () => {
    currentUser.user = AdminUser;
    await router.push(`/profile/${BasicUser.username}`);
    jest.spyOn(client.users, 'getProfile').mockResolvedValue(BasicUser.profile);
    const spy = jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
      tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
      totalCount: tankData.totalCount,
    });

    const html = await renderToString(ProfileView, {
      global: opts.global,
    });

    const div = document.createElement('div');
    div.innerHTML = html;

    expect(
      div.querySelector('[data-testid="tank-profiles"]')?.innerHTML,
    ).toMatchSnapshot();

    expect(spy).toHaveBeenCalledWith({
      username: BasicUser.username,
      includeSystem: false,
    });
  });

  it('will not prefetch tanks if the current user does not own the requested profile', async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);
    const spy = jest.spyOn(client.tanks, 'listTanks');

    const html = await renderToString(ProfileView, {
      global: opts.global,
    });

    const div = document.createElement('div');
    div.innerHTML = html;

    expect(spy).not.toHaveBeenCalled();
    expect(div.querySelector('[data-testid="tank-profiles"]')).toBeNull();
  });

  it('will not attempt to prefetch a profile if the current user is not authenticated', async () => {
    currentUser.user = null;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    const spy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);

    const html = await renderToString(ProfileView, {
      global: opts.global,
    });

    const div = document.createElement('div');
    div.innerHTML = html;

    expect(spy).not.toHaveBeenCalled();
    expect(
      div.querySelector('[data-testid="require-auth-anonymous"]'),
    ).not.toBeNull();
  });

  it('will show the login form if user is not authenticated', () => {
    currentUser.user = null;
    const wrapper = mount(ProfileView, opts);
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it("will show the current user's profile if no username is in the path", async () => {
    currentUser.user = BasicUser;
    profiles.currentProfile = BasicUser.profile;
    await router.push('/profile');

    const wrapper = mount(ProfileView, opts);
    const editProfile = wrapper.getComponent(EditProfile);

    expect(editProfile.isVisible()).toBe(true);
    expect(
      editProfile.find<HTMLInputElement>('[data-testid="nameInput"]').element
        .value,
    ).toBe(BasicUser.profile.name);
  });

  it("will show another user's profile in read-only mode", async () => {
    currentUser.user = BasicUser;
    profiles.currentProfile = UserWithFullProfile.profile;
    await router.push(`/profile/${UserWithFullProfile.username}`);

    const wrapper = mount(ProfileView, opts);
    const viewProfile = wrapper.getComponent(ViewProfile);

    expect(viewProfile.isVisible()).toBe(true);
    expect(viewProfile.find('[data-testid="profile-name"]').text()).toBe(
      UserWithFullProfile.profile.name,
    );
  });

  it('will allow the user to modify their profile', async () => {
    currentUser.user = { ...BasicUser };
    profiles.currentProfile = { ...BasicUser.profile };
    const newProfile: ProfileDTO = {
      accountTier: AccountTier.Basic,
      userId: BasicUser.id,
      memberSince: BasicUser.memberSince,
      username: BasicUser.username,
      logBookSharing: LogBookSharing.FriendsOnly,
      name: 'New Name',
      bio: 'New Bio',
      location: 'London, UK',
    };
    const wrapper = mount(ProfileView, opts);

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="nameInput"]').element.value,
    ).toBe(currentUser.user.profile.name);
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').exists(),
    ).toBe(false);

    const editProfile = wrapper.getComponent(EditProfile);
    await editProfile
      .get('[data-testid="nameInput"]')
      .setValue(newProfile.name);
    await editProfile.get('[data-testid="bioInput"]').setValue(newProfile.bio);
    await editProfile
      .get('[data-testid="locationInput"]')
      .setValue(newProfile.location);
    await editProfile.get('[data-testid="save-profile"]').trigger('click');
    await flushPromises();
  });

  it("will allow admins to edit other user's profiles", async () => {
    currentUser.user = { ...AdminUser };
    profiles.currentProfile = { ...UserWithFullProfile.profile };
    const newProfile: ProfileDTO = {
      accountTier: AccountTier.Basic,
      userId: UserWithFullProfile.id,
      memberSince: UserWithFullProfile.memberSince,
      username: UserWithFullProfile.username,
      logBookSharing: LogBookSharing.Public,
      name: 'New Name',
      bio: 'New Bio',
      location: 'London, UK',
    };
    const wrapper = mount(ProfileView, opts);

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="nameInput"]').element.value,
    ).toBe(UserWithFullProfile.profile.name);
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').exists(),
    ).toBe(false);

    const editProfile = wrapper.getComponent(EditProfile);
    await editProfile
      .get('[data-testid="nameInput"]')
      .setValue(newProfile.name);
    await editProfile.get('[data-testid="bioInput"]').setValue(newProfile.bio);
    await editProfile
      .get('[data-testid="locationInput"]')
      .setValue(newProfile.location);
    await editProfile.get('[data-testid="save-profile"]').trigger('click');
    await flushPromises();
  });
});
