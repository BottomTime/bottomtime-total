import { ApiClient, BuddyType, LogEntrySignatureDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import PreviewLogEntry from 'src/components/logbook/preview-log-entry.vue';
import SignEntry from 'src/components/logbook/sign-entry.vue';
import { useCurrentUser } from 'src/store';
import SignLogEntryView from 'src/views/logbook/sign-log-entry-view.vue';
import { NotFoundMessage, RequireAuth } from 'tests/constants';
import { TestAgencies } from 'tests/fixtures/agencies';
import { createHttpError } from 'tests/fixtures/create-http-error';
import { createRouter } from 'tests/fixtures/create-router';
import { MinimalLogEntry } from 'tests/fixtures/log-entries';
import { BasicUser, UserWithEmptyProfile } from 'tests/fixtures/users';
import { Router } from 'vue-router';

describe('SignLogEntry View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof SignLogEntryView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: `/logbook/:username/:entryId/sign`,
        component: SignLogEntryView,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          PreviewLogEntry: true,
          SignEntry: true,
        },
      },
    };

    currentUser.user = UserWithEmptyProfile;
    await router.push(
      `/logbook/${BasicUser.username}/${MinimalLogEntry.id}/sign`,
    );

    jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockResolvedValue(MinimalLogEntry);
    jest.spyOn(client.certifications, 'listAgencies').mockResolvedValue({
      data: TestAgencies,
      totalCount: TestAgencies.length,
    });
    jest
      .spyOn(client.certifications, 'listProfessionalAssociations')
      .mockResolvedValue({
        data: [],
        totalCount: 0,
      });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will show login form if user is anonymous', async () => {
    currentUser.user = null;
    const wrapper = mount(SignLogEntryView, opts);
    await flushPromises();
    expect(wrapper.get(RequireAuth.LoginForm).isVisible()).toBe(true);
    expect(wrapper.findComponent(SignEntry).exists()).toBe(false);
  });

  it('will show not found message if log entry does not exist', async () => {
    jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockRejectedValueOnce(createHttpError(404));
    const wrapper = mount(SignLogEntryView, opts);
    await flushPromises();

    expect(wrapper.find(NotFoundMessage).isVisible()).toBe(true);
    expect(wrapper.findComponent(SignEntry).exists()).toBe(false);
  });

  it('will show an error message if user attempts to sign their own log entry', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(SignLogEntryView, opts);
    await flushPromises();
    expect(wrapper.findComponent(SignEntry).exists()).toBe(false);
    expect(wrapper.get('[data-testid="no-self-sign-msg"]').text()).toBe(
      "Sorry, but you can't sign your own entry!",
    );
  });

  it('will allow a user to sign an entry', async () => {
    jest.useFakeTimers();
    const expected: LogEntrySignatureDTO = {
      buddy: UserWithEmptyProfile.profile,
      id: '2ba17a4b-596b-4442-b69f-1f5b106c3f65',
      signedOn: Date.now(),
      type: BuddyType.Divemaster,
      agency: TestAgencies[0],
      certificationNumber: '12345',
    };
    const wrapper = mount(SignLogEntryView, opts);
    await flushPromises();

    const entryPreview = wrapper.getComponent(PreviewLogEntry);
    expect(entryPreview.isVisible()).toBe(true);
    expect(entryPreview.props('entry')).toEqual(MinimalLogEntry);

    const signEntry = wrapper.getComponent(SignEntry);
    expect(signEntry.isVisible()).toBe(true);
    expect(signEntry.props('entry')).toEqual(MinimalLogEntry);
    expect(signEntry.props('showCancel')).toBe(false);
    signEntry.vm.$emit('signed', expected);

    jest.runAllTimers();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe(
      `/logbook/${BasicUser.username}/${MinimalLogEntry.id}`,
    );
  });
});
