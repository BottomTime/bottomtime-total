import { UpdateProfileParamsDTO, UserDTO } from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import EditProfile from '../../../../src/components/users/edit-profile.vue';
import { BasicUser } from '../../../fixtures/users';

function getUser(profile?: UpdateProfileParamsDTO): UserDTO {
  return {
    ...BasicUser,
    profile: {
      ...BasicUser.profile,
      ...profile,
    },
  };
}

describe('Edit Profile form', () => {
  it('will mount component', () => {
    const user = getUser();
    const wrapper = mount(EditProfile, {
      props: {
        user,
      },
    });

    expect(wrapper.text()).toContain('Edit Profile');
  });
});
