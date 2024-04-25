import { mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import ViewProfile from '../../../../src/components/users/view-profile.vue';
import {
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

dayjs.extend(relativeTime);

describe('View profile component', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2024-08-30T12:00:00Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render with a partial profile', () => {
    const wrapper = mount(ViewProfile, {
      props: { profile: UserWithEmptyProfile.profile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with a full profile', () => {
    const wrapper = mount(ViewProfile, {
      props: { profile: UserWithFullProfile.profile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
