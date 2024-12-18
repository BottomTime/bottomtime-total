import {
  AccountTier,
  ApiClient,
  ApiList,
  Fetcher,
  ListTanksResponseSchema,
  LogBookSharing,
  ProfileDTO,
  TankDTO,
  UpdateProfileParamsDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import EditProfile from '../../../../src/components/users/edit-profile.vue';
import ViewProfile from '../../../../src/components/users/view-profile.vue';
import { useCurrentUser } from '../../../../src/store';
import ProfileView from '../../../../src/views/users/profile-view.vue';
import { createRouter } from '../../../fixtures/create-router';
import TestTankData from '../../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../../fixtures/users';

dayjs.extend(relativeTime);

const EmptyTankResults: ApiList<TankDTO> = {
  data: [],
  totalCount: 0,
};

describe('Profile View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let tankData: ApiList<TankDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
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
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
  });

  it('will load the requested user profile when mounted', async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    const spy = jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(wrapper.getComponent(ViewProfile).props('profile')).toEqual(
      UserWithFullProfile.profile,
    );

    expect(spy).toHaveBeenCalledWith(UserWithFullProfile.username);
  });

  it('will not attempt to fetch a profile if there is no username in the path', async () => {
    currentUser.user = BasicUser;
    await router.push('/profile');
    const spy = jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue(BasicUser.profile);
    jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(EmptyTankResults);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(wrapper.getComponent(EditProfile).props('profile')).toEqual(
      BasicUser.profile,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('will load tank profiles if the current user is viewing their own profile', async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${BasicUser.username.toUpperCase()}`);
    const spy = jest
      .spyOn(client.tanks, 'listTanks')
      .mockResolvedValue(tankData);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(
      wrapper.get('[data-testid="tank-profiles"]').html(),
    ).toMatchSnapshot();

    expect(spy).toHaveBeenCalledWith({
      username: BasicUser.username.toUpperCase(),
      includeSystem: false,
    });
  });

  it('will fetch tank profiles if an admin is viewing the profile', async () => {
    currentUser.user = AdminUser;
    await router.push(`/profile/${BasicUser.username}`);
    jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue(BasicUser.profile);
    const spy = jest
      .spyOn(client.tanks, 'listTanks')
      .mockResolvedValue(tankData);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(
      wrapper.get('[data-testid="tank-profiles"]').html(),
    ).toMatchSnapshot();

    expect(spy).toHaveBeenCalledWith({
      username: BasicUser.username,
      includeSystem: false,
    });
  });

  it('will not fetch tanks if the current user does not own the requested profile', async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);
    const spy = jest.spyOn(client.tanks, 'listTanks');

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="tank-profiles"]').exists()).toBe(false);
  });

  it('will not attempt to fetch a profile if the current user is not authenticated', async () => {
    currentUser.user = null;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    const spy = jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it('will show the login form if user is not authenticated', async () => {
    currentUser.user = null;
    const spy = jest.spyOn(client.userProfiles, 'getProfile');
    const wrapper = mount(ProfileView, opts);
    await flushPromises();
    expect(spy).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it("will show the current user's profile if no username is in the path", async () => {
    currentUser.user = BasicUser;
    await router.push('/profile');
    const spy = jest.spyOn(client.userProfiles, 'getProfile');

    const wrapper = mount(ProfileView, opts);
    await flushPromises();
    const editProfile = wrapper.getComponent(EditProfile);

    expect(spy).not.toHaveBeenCalled();
    expect(editProfile.isVisible()).toBe(true);
    expect(
      editProfile.find<HTMLInputElement>('[data-testid="nameInput"]').element
        .value,
    ).toBe(BasicUser.profile.name);
  });

  it("will show another user's profile in read-only mode", async () => {
    currentUser.user = BasicUser;
    await router.push(`/profile/${UserWithFullProfile.username}`);
    const spy = jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    const viewProfile = wrapper.getComponent(ViewProfile);
    expect(spy).toHaveBeenCalledWith(UserWithFullProfile.username);
    expect(viewProfile.isVisible()).toBe(true);
    expect(viewProfile.find('[data-testid="profile-name"]').text()).toBe(
      UserWithFullProfile.profile.name,
    );
  });

  it('will allow the user to modify their profile', async () => {
    currentUser.user = { ...BasicUser };
    const update: UpdateProfileParamsDTO = {
      bio: 'New Bio',
      location: 'London, UK',
      logBookSharing: LogBookSharing.FriendsOnly,
      name: 'New Name',
    };
    const newProfile: ProfileDTO = {
      ...UserWithFullProfile.profile,
      ...update,
    };
    await router.push('/profile');
    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="nameInput"]').element.value,
    ).toBe(currentUser.user.profile.name);
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').exists(),
    ).toBe(false);

    const saveSpy = jest
      .spyOn(client.userProfiles, 'updateProfile')
      .mockResolvedValue(newProfile);

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

    expect(saveSpy).toHaveBeenCalledWith(BasicUser.profile, update);
  });

  it("will allow admins to edit other user's profiles", async () => {
    currentUser.user = { ...AdminUser };
    jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue({ ...UserWithFullProfile.profile });
    const update: UpdateProfileParamsDTO = {
      bio: 'New Bio',
      experienceLevel: 'Experienced',
      location: 'London, UK',
      logBookSharing: LogBookSharing.FriendsOnly,
      name: 'New Name',
      startedDiving: '2018-11-20',
    };
    const newProfile: ProfileDTO = {
      ...UserWithFullProfile.profile,
      ...update,
    };
    await router.push(`/profile/${UserWithFullProfile.username}`);

    const wrapper = mount(ProfileView, opts);
    await flushPromises();

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="nameInput"]').element.value,
    ).toBe(UserWithFullProfile.profile.name);
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').exists(),
    ).toBe(false);

    const saveSpy = jest
      .spyOn(client.userProfiles, 'updateProfile')
      .mockResolvedValue(newProfile);

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

    expect(saveSpy).toHaveBeenCalledWith(UserWithFullProfile.profile, update);
  });
});
