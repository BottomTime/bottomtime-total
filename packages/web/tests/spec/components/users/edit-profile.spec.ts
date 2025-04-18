import {
  ApiClient,
  ApiList,
  Fetcher,
  ListTanksResponseSchema,
  LogBookSharing,
  TankDTO,
  UpdateProfileParamsDTO,
  UserDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import EditProfile from '../../../../src/components/users/edit-profile.vue';
import { createRouter } from '../../../fixtures/create-router';
import TestTankData from '../../../fixtures/tanks.json';
import {
  BasicUser,
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

function getUser(
  baseUser: UserDTO = BasicUser,
  profile?: UpdateProfileParamsDTO,
): UserDTO {
  return {
    ...baseUser,
    profile: {
      ...baseUser.profile,
      ...profile,
    },
  };
}

describe('Edit Profile form', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let pinia: Pinia;
  let router: Router;
  let tankData: ApiList<TankDTO>;

  let opts: ComponentMountingOptions<typeof EditProfile>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
    tankData = ListTanksResponseSchema.parse(TestTankData);
  });

  beforeEach(() => {
    pinia = createPinia();
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
  });

  it('will load form with empty profile', () => {
    const user = getUser(UserWithEmptyProfile);
    opts.props = { profile: user.profile };
    const wrapper = mount(EditProfile, opts);

    expect(
      wrapper.get<HTMLImageElement>('[data-testid="profile-avatar"]').element
        .src,
    ).toMatch(/^https:\/\/ui-avatars.com\/.+/);
    expect(wrapper.get<HTMLInputElement>('input#name').element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>('input#location').element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLTextAreaElement>('textarea#bio').element.value).toBe(
      '',
    );
    expect(
      wrapper.get<HTMLSelectElement>('select#experience-level').element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-year').element
        .value,
    ).toBe('');
  });

  it('will load form with all profile fields set', async () => {
    const user = getUser(UserWithFullProfile);
    opts.props = { profile: user.profile };
    const wrapper = mount(EditProfile, opts);

    const startedDiving =
      UserWithFullProfile.profile.startedDiving?.split('-') ?? [];

    expect(
      wrapper.get<HTMLImageElement>('[data-testid="profile-avatar"]').element
        .src,
    ).toBe(UserWithFullProfile.profile.avatar);
    expect(wrapper.get<HTMLInputElement>('input#name').element.value).toBe(
      UserWithFullProfile.profile.name,
    );
    expect(wrapper.get<HTMLInputElement>('input#location').element.value).toBe(
      UserWithFullProfile.profile.location,
    );

    expect(wrapper.get<HTMLTextAreaElement>('textarea#bio').element.value).toBe(
      UserWithFullProfile.profile.bio,
    );
    expect(
      wrapper.get<HTMLSelectElement>('select#experience-level').element.value,
    ).toBe(UserWithFullProfile.profile.experienceLevel);

    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-year').element
        .value,
    ).toBe(startedDiving[0]);
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-month').element
        .value,
    ).toBe(startedDiving[1]);
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-day').element.value,
    ).toBe(startedDiving[2]);

    expect(wrapper.find('[data-testid="tank-profiles"]').exists()).toBe(false);
  });

  it('will allow users to update their profile', async () => {
    const userData = getUser(UserWithFullProfile);
    opts.props = { profile: userData.profile };
    const wrapper = mount(EditProfile, opts);

    const updatedProfile: UpdateProfileParamsDTO = {
      name: 'Updated Name',
      location: 'Updated Location',
      bio: 'Updated Bio',
      experienceLevel: 'Expert',
      startedDiving: '2000-01-01',
      logBookSharing: LogBookSharing.Public,
    };
    const expected = {
      ...userData.profile,
      ...updatedProfile,
    };
    const spy = jest
      .spyOn(client.userProfiles, 'updateProfile')
      .mockResolvedValue(expected);

    await wrapper.get('input#name').setValue(updatedProfile.name);
    await wrapper.get('input#location').setValue(updatedProfile.location);
    await wrapper.get('textarea#bio').setValue(updatedProfile.bio);
    await wrapper
      .get('select#experience-level')
      .setValue(updatedProfile.experienceLevel);

    await wrapper.get('select#started-diving-year').setValue('2000');
    await wrapper.get('select#started-diving-month').setValue('01');
    await wrapper.get('select#started-diving-day').setValue('01');
    await wrapper.get('select#logbook-sharing').setValue(LogBookSharing.Public);

    await wrapper.get('[data-testid="save-profile"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      UserWithFullProfile.profile,
      updatedProfile,
    );
    expect(wrapper.emitted('save-profile')).toEqual([[expected]]);
  });

  it('will allow a user to cancel editing their profile', async () => {
    const userData = getUser(UserWithFullProfile);
    opts.props = { profile: userData.profile };
    const wrapper = mount(EditProfile, opts);

    const updatedProfile: UpdateProfileParamsDTO = {
      name: 'Updated Name',
      location: 'Updated Location',
      bio: 'Updated Bio',
      experienceLevel: 'Expert',
      logBookSharing: LogBookSharing.Public,
      startedDiving: '2000-01-01',
    };

    const startedDiving =
      UserWithFullProfile.profile.startedDiving?.split('-') ?? [];

    await wrapper.get('input#name').setValue(updatedProfile.name);
    await wrapper.get('input#location').setValue(updatedProfile.location);
    await wrapper.get('textarea#bio').setValue(updatedProfile.bio);
    await wrapper
      .get('select#experience-level')
      .setValue(updatedProfile.experienceLevel);

    await wrapper.get('select#started-diving-year').setValue('2000');
    await wrapper.get('select#started-diving-month').setValue('01');
    await wrapper.get('select#started-diving-day').setValue('01');
    await wrapper.get('select#logbook-sharing').setValue(LogBookSharing.Public);

    await wrapper.get('[data-testid="cancel-profile"]').trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');

    expect(
      wrapper.get<HTMLImageElement>('[data-testid="profile-avatar"]').element
        .src,
    ).toBe(UserWithFullProfile.profile.avatar);
    expect(wrapper.get<HTMLInputElement>('input#name').element.value).toBe(
      UserWithFullProfile.profile.name,
    );
    expect(wrapper.get<HTMLInputElement>('input#location').element.value).toBe(
      UserWithFullProfile.profile.location,
    );
    expect(
      wrapper.get<HTMLSelectElement>('select#logbook-sharing').element.value,
    ).toBe(UserWithFullProfile.profile.logBookSharing);

    expect(wrapper.get<HTMLTextAreaElement>('textarea#bio').element.value).toBe(
      UserWithFullProfile.profile.bio,
    );
    expect(
      wrapper.get<HTMLSelectElement>('select#experience-level').element.value,
    ).toBe(UserWithFullProfile.profile.experienceLevel);

    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-year').element
        .value,
    ).toBe(startedDiving[0]);
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-month').element
        .value,
    ).toBe(startedDiving[1]);
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-day').element.value,
    ).toBe(startedDiving[2]);

    expect(wrapper.emitted('save-profile')).toBeUndefined();
  });

  it('will allow a user to change their mind about cancelling editing their profile', async () => {
    const userData = getUser(UserWithFullProfile);
    opts.props = { profile: userData.profile };
    const wrapper = mount(EditProfile, opts);

    const updatedProfile: UpdateProfileParamsDTO = {
      name: 'Updated Name',
      location: 'Updated Location',
      bio: 'Updated Bio',
      experienceLevel: 'Expert',
      logBookSharing: LogBookSharing.Public,
      startedDiving: '2000-01-01',
    };

    await wrapper.get('input#name').setValue(updatedProfile.name);
    await wrapper.get('input#location').setValue(updatedProfile.location);
    await wrapper.get('textarea#bio').setValue(updatedProfile.bio);
    await wrapper
      .get('select#experience-level')
      .setValue(updatedProfile.experienceLevel);

    await wrapper.get('select#started-diving-year').setValue('2000');
    await wrapper.get('select#started-diving-month').setValue('01');
    await wrapper.get('select#started-diving-day').setValue('01');
    await wrapper.get('select#logbook-sharing').setValue(LogBookSharing.Public);

    await wrapper.get('[data-testid="cancel-profile"]').trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');

    expect(wrapper.get<HTMLInputElement>('input#name').element.value).toBe(
      updatedProfile.name,
    );
    expect(wrapper.get<HTMLInputElement>('input#location').element.value).toBe(
      updatedProfile.location,
    );
    expect(
      wrapper.get<HTMLSelectElement>('select#logbook-sharing').element.value,
    ).toBe(updatedProfile.logBookSharing);

    expect(wrapper.get<HTMLTextAreaElement>('textarea#bio').element.value).toBe(
      updatedProfile.bio,
    );

    expect(
      wrapper.get<HTMLSelectElement>('select#experience-level').element.value,
    ).toBe(updatedProfile.experienceLevel);

    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-year').element
        .value,
    ).toBe('2000');
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-month').element
        .value,
    ).toBe('01');
    expect(
      wrapper.get<HTMLSelectElement>('select#started-diving-day').element.value,
    ).toBe('01');

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
  });

  it('will render list of user tanks', async () => {
    const userData = getUser(UserWithFullProfile);
    opts.props = { profile: userData.profile, tanks: tankData };
    const wrapper = mount(EditProfile, opts);

    expect(
      wrapper.get('[data-testid="tank-profiles"]').html(),
    ).toMatchSnapshot();
  });

  it('will render a helpful message if user has no tank profiles', async () => {
    const userData = getUser(UserWithFullProfile);
    opts.props = {
      profile: userData.profile,
      tanks: {
        data: [],
        totalCount: 0,
      },
    };
    const wrapper = mount(EditProfile, opts);

    expect(
      wrapper.get('[data-testid="tank-profiles"]').html(),
    ).toMatchSnapshot();
  });
});
