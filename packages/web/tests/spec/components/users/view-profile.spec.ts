import { ApiClient, LogBookSharing } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ViewProfile from '../../../../src/components/users/view-profile.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

dayjs.extend(relativeTime);

const ViewLogbookButton = '[data-testid="view-logbook"]';

describe('View profile component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof ViewProfile>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
    jest.useFakeTimers({
      now: new Date('2024-08-30T12:00:00Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
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
      },
    };
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render with a partial profile', () => {
    opts.props = { profile: UserWithEmptyProfile.profile };
    const wrapper = mount(ViewProfile, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with a full profile', () => {
    opts.props = { profile: UserWithFullProfile.profile };
    const wrapper = mount(ViewProfile, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show logbook button if user has public logbook', async () => {
    opts.props = {
      profile: {
        ...UserWithFullProfile.profile,
        logBookSharing: LogBookSharing.Public,
      },
    };
    const wrapper = mount(ViewProfile, opts);
    await flushPromises();
    expect(wrapper.find(ViewLogbookButton).isVisible()).toBe(true);
  });

  it('will hide logbook button if user has a private logbook', async () => {
    currentUser.user = BasicUser;
    opts.props = {
      profile: {
        ...UserWithFullProfile.profile,
        logBookSharing: LogBookSharing.Private,
      },
    };
    const wrapper = mount(ViewProfile, opts);
    await flushPromises();
    expect(wrapper.find(ViewLogbookButton).exists()).toBe(false);
  });

  it('will show logbook button if user is friends with logbook owner and logbook is shared with friends', async () => {
    const spy = jest
      .spyOn(client.friends, 'areFriends')
      .mockResolvedValue(true);
    currentUser.user = BasicUser;
    opts.props = {
      profile: {
        ...UserWithFullProfile.profile,
        logBookSharing: LogBookSharing.FriendsOnly,
      },
    };
    const wrapper = mount(ViewProfile, opts);
    await flushPromises();
    expect(wrapper.find(ViewLogbookButton).isVisible()).toBe(true);

    expect(spy).toHaveBeenCalledWith(
      BasicUser.username,
      UserWithFullProfile.username,
    );
  });

  it('will hide logbook button if users are not friends and logbook is shared with friends', async () => {
    const spy = jest
      .spyOn(client.friends, 'areFriends')
      .mockResolvedValue(false);
    currentUser.user = BasicUser;
    opts.props = {
      profile: {
        ...UserWithFullProfile.profile,
        logBookSharing: LogBookSharing.FriendsOnly,
      },
    };
    const wrapper = mount(ViewProfile, opts);
    await flushPromises();
    expect(wrapper.find(ViewLogbookButton).exists()).toBe(false);

    expect(spy).toHaveBeenCalledWith(
      BasicUser.username,
      UserWithFullProfile.username,
    );
  });

  it('will show logbook button if user is an admin', async () => {
    opts.props = {
      profile: {
        ...UserWithFullProfile.profile,
        logBookSharing: LogBookSharing.Private,
      },
    };
    currentUser.user = AdminUser;
    const wrapper = mount(ViewProfile, opts);
    await flushPromises();
    expect(wrapper.find(ViewLogbookButton).isVisible()).toBe(true);
  });

  it('will show logbook button if the user is viewing their own profile', async () => {
    opts.props = {
      profile: {
        ...BasicUser.profile,
        logBookSharing: LogBookSharing.Private,
      },
    };
    currentUser.user = BasicUser;
    const wrapper = mount(ViewProfile, opts);
    await flushPromises();
    expect(wrapper.find(ViewLogbookButton).isVisible()).toBe(true);
  });
});
