import { mount } from '@vue/test-utils';

import ProfileForm from '@/components/users/ProfileForm.vue';

describe('Profile Form', () => {
  [
    {
      name: '',
    },
  ].forEach((testCase) => {
    it(`Will validate data: `, async () => {
      const wrapper = mount(ProfileForm);
    });
  });

  [
    {
      field: 'name',
      maxLength: 200,
    },
  ].forEach((testCase) => {
    it(`Will enforce max length on field: ${testCase.field}`, async () => {});
  });

  it('Will be awesome', () => {
    expect(true).toBeTruthy();
  });
});
