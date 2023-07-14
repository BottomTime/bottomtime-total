import dayjs from 'dayjs';
import { mount } from '@vue/test-utils';
import relativeTime from 'dayjs/plugin/relativeTime';
import request from 'superagent';

import { createStore } from '@/store';
import { createErrorHandler } from '@/helpers';
import { DefaultUser } from '@/users';
import { fakeUser } from '../../../fixtures/fake-user';
import ProfileForm from '@/components/users/ProfileForm.vue';
import { WithErrorHandlingKey } from '@/injection-keys';

dayjs.extend(relativeTime);

describe('Profile Form', () => {
  const agent = request.agent();
  const store = createStore();
  const withErrorHandling = createErrorHandler(store);

  [
    {
      field: 'bio',
      maxLength: 1000,
    },
    {
      field: 'location',
      maxLength: 200,
    },
    {
      field: 'name',
      maxLength: 100,
    },
  ].forEach((testCase) => {
    it(`Will enforce max length on field: ${testCase.field}`, async () => {
      const data = fakeUser();
      const user = new DefaultUser(agent, data);
      const wrapper = mount(ProfileForm, {
        global: {
          provide: {
            [WithErrorHandlingKey as symbol]: withErrorHandling,
          },
        },
        props: {
          profile: user.profile,
        },
      });
      const input = wrapper.get(`#${testCase.field}`);
      expect(input.attributes('maxlength')).toEqual(
        testCase.maxLength.toString(),
      );
    });
  });

  it('Will save changes', async () => {
    const data = fakeUser();
    const user = new DefaultUser(agent, data);
    const expectedChanges = {
      avatar: user.profile.avatar,
      bio: 'A jolly good bloke',
      birthdate: '2009-08-16',
      certifications: user.profile.certifications,
      customData: user.profile.customData,
      experienceLevel: 'Experienced',
      location: 'The Matrix',
      name: 'Roger Rogerson',
      profileVisibility: 'public',
      startedDiving: '2018-06-12',
    };

    const spy = jest.spyOn(user.profile, 'save').mockResolvedValue();
    const wrapper = mount(ProfileForm, {
      global: {
        provide: {
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        profile: user.profile,
      },
    });

    await wrapper.get('textarea#bio').setValue(expectedChanges.bio);
    await wrapper.get('select#birthdate-year').setValue('2009');
    await wrapper.get('select#birthdate-month').setValue('8');
    await wrapper.get('select#birthdate-day').setValue('16');
    await wrapper
      .get('select#experienceLevel')
      .setValue(expectedChanges.experienceLevel);
    await wrapper.get('input#location').setValue(expectedChanges.location);
    await wrapper.get('input#name').setValue(expectedChanges.name);
    await wrapper.get('select#startedDiving-year').setValue('2018');
    await wrapper.get('select#startedDiving-month').setValue('6');
    await wrapper.get('select#startedDiving-day').setValue('12');
    await wrapper
      .get('select#profileVisibility')
      .setValue(expectedChanges.profileVisibility);
    await wrapper.get('button#btn-save').trigger('click');

    expect(spy).toBeCalled();
    expect(user.profile.toJSON()).toEqual(expectedChanges);
  });

  it('Will discard unwanted changes', async () => {
    const data = fakeUser();
    const user = new DefaultUser(agent, data);
    const wrapper = mount(ProfileForm, {
      global: {
        provide: {
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        profile: user.profile,
      },
    });

    await wrapper.get('input#name').setValue('New Name');
    await wrapper.get('select#experienceLevel').setValue('Beginner');
    await wrapper.get('textarea#bio').setValue('New bio');

    await wrapper.get('button#btn-cancel').trigger('click');
    await wrapper.get('button.dialog-confirm').trigger('click');

    expect(
      (wrapper.get('input#name').element as HTMLInputElement).value,
    ).toEqual(user.profile.name);
    // expect(
    //   (wrapper.get('select#experienceLevel').element as HTMLSelectElement)
    //     .selectedIndex,
    // ).toEqual(user.profile.name);
    expect(
      (wrapper.get('textarea#bio').element as HTMLTextAreaElement).value,
    ).toEqual(user.profile.bio);
  });

  it('Will cancel discard changes if clicked accidentally', async () => {
    const data = fakeUser();
    const user = new DefaultUser(agent, data);
    const wrapper = mount(ProfileForm, {
      global: {
        provide: {
          [WithErrorHandlingKey as symbol]: withErrorHandling,
        },
      },
      props: {
        profile: user.profile,
      },
    });

    await wrapper.get('input#name').setValue('New Name');
    await wrapper.get('select#experienceLevel').setValue('Beginner');
    await wrapper.get('textarea#bio').setValue('New bio');

    await wrapper.get('button#btn-cancel').trigger('click');
    await wrapper.get('button.dialog-cancel').trigger('click');

    expect(
      (wrapper.get('input#name').element as HTMLInputElement).value,
    ).toEqual('New Name');
    // expect(
    //   (wrapper.get('select#experienceLevel').element as HTMLSelectElement)
    //     .selectedIndex,
    // ).toEqual('Beginner');
    expect(
      (wrapper.get('textarea#bio').element as HTMLTextAreaElement).value,
    ).toEqual('New bio');
  });
});
