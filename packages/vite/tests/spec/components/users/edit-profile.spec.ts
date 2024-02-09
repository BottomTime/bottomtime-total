import { UpdateProfileParamsDTO, UserDTO } from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClient, ApiClientKey } from '../../../../src/client';
import EditProfile from '../../../../src/components/users/edit-profile.vue';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser, UserWithEmptyProfile } from '../../../fixtures/users';

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
  let client: ApiClient;
  let pinia: Pinia;
  let router: Router;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
  });

  it('will load form with empty profile', () => {
    const user = getUser(UserWithEmptyProfile);
    const wrapper = mount(EditProfile, {
      props: {
        user,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    });

    expect(
      wrapper.get<HTMLImageElement>('[data-testid="profile-avatar"]').element
        .src,
    ).toMatch(/^https:\/\/ui-avatars.com\/.+/);
    expect(wrapper.get<HTMLInputElement>('input#name').element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>('input#location').element.value).toBe(
      '',
    );
    expect(
      wrapper.get<HTMLSelectElement>('select#birthdate-year').element.value,
    ).toBe('');
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
});
