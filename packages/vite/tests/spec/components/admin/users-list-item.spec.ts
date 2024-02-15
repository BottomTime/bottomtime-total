import { mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import UsersListItem from '../../../../src/components/admin/users-list-item.vue';
import {
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

dayjs.extend(relativeTime);

describe('Admin User List Item component', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2024-02-15T16:59:08.962Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render correctly for user with full profile', () => {
    const wrapper = mount(UsersListItem, {
      props: { user: UserWithFullProfile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for user with minimal profile', () => {
    const wrapper = mount(UsersListItem, {
      props: { user: UserWithEmptyProfile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit an event when the username is clicked', async () => {
    const wrapper = mount(UsersListItem, {
      props: { user: UserWithFullProfile },
    });
    await wrapper
      .find(`[data-testid="userslist-link-${UserWithFullProfile.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('user-click')).toEqual([[UserWithFullProfile]]);
  });
});
