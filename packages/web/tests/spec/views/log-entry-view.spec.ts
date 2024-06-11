import {
  ApiClient,
  DepthUnit,
  LogBookSharing,
  LogEntry,
  LogEntryDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import localized from 'dayjs/plugin/localizedFormat';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import EditLogbookEntry from '../../../src/components/logbook/edit-logbook-entry.vue';
import ViewLogbookEntry from '../../../src/components/logbook/view-logbook-entry.vue';
import { useCurrentUser, useLogEntries } from '../../../src/store';
import { useToasts } from '../../../src/store';
import LogEntryView from '../../../src/views/log-entry-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

dayjs.extend(localized);

const TestData: LogEntryDTO = {
  creator: {
    logBookSharing: LogBookSharing.Public,
    username: 'logbook_guy',
    memberSince: new Date('2021-01-01T12:00'),
    userId: 'bfb8f31f-8ac0-427e-84a5-f17111855727',
  },
  duration: 48.2,
  entryTime: {
    date: '2021-01-01T12:00:00',
    timezone: 'America/Los_Angeles',
  },
  id: '1f3c6568-d63c-4e52-8679-2a85d6f6b1f4',
  logNumber: 12,
  bottomTime: 44.1,
  maxDepth: {
    depth: 26.2,
    unit: DepthUnit.Meters,
  },
  notes: 'Oooooo weeeeeee!!!',
};

describe('Log Entry view', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let logEntryStore: ReturnType<typeof useLogEntries>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof LogEntryView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/logbook/:username/:entryId',
        component: LogEntryView,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    logEntryStore = useLogEntries(pinia);
    toasts = useToasts(pinia);

    currentUser.user = BasicUser;
    logEntryStore.currentEntry = { ...TestData };

    jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValue(12);

    await router.push(`/logbook/${TestData.creator.username}/${TestData.id}`);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will prefetch the log entry on the server side', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockResolvedValue(new LogEntry(client.axios, TestData));

    const div = document.createElement('div');
    div.innerHTML = await renderToString(LogEntryView, { global: opts.global });

    expect(div.querySelector('[data-testid="logbook-entry"]')).not.toBeNull();
    expect(
      div.querySelector('[data-testid="entry-logNumber"]')?.textContent,
    ).toBe(TestData.logNumber!.toString());

    expect(spy).toHaveBeenCalledWith(TestData.creator.username, TestData.id);
  });

  it('will render a not found message if the log entry is not found', async () => {
    const spy = jest.spyOn(client.logEntries, 'getLogEntry').mockRejectedValue(
      createAxiosError({
        method: 'GET',
        path: router.currentRoute.value.fullPath,
        status: 404,
        message: 'Not Found',
      }),
    );

    const div = document.createElement('div');
    div.innerHTML = await renderToString(LogEntryView, { global: opts.global });

    expect(div.querySelector('[data-testid="logbook-entry"]')).toBeNull();
    expect(
      div.querySelector('[data-testid="not-found-message"]'),
    ).not.toBeNull();

    expect(spy).toHaveBeenCalledWith(TestData.creator.username, TestData.id);
  });

  it('will render a not found message if the current user is not authorized to view the log entry', async () => {
    const spy = jest.spyOn(client.logEntries, 'getLogEntry').mockRejectedValue(
      createAxiosError({
        method: 'GET',
        path: router.currentRoute.value.fullPath,
        status: 403,
        message: 'Nope!',
      }),
    );

    const div = document.createElement('div');
    div.innerHTML = await renderToString(LogEntryView, { global: opts.global });

    expect(div.querySelector('[data-testid="logbook-entry"]')).toBeNull();
    expect(
      div.querySelector('[data-testid="not-found-message"]'),
    ).not.toBeNull();

    expect(spy).toHaveBeenCalledWith(TestData.creator.username, TestData.id);
  });

  it('will render the log entry if it is found', async () => {
    const wrapper = mount(LogEntryView, opts);
    const viewEntry = wrapper.findComponent(ViewLogbookEntry);
    expect(viewEntry.isVisible()).toBe(true);
    expect(viewEntry.find('[data-testid="entry-logNumber"]').text()).toBe(
      TestData.logNumber!.toString(),
    );
    expect(wrapper.find('[data-testid="breadcrumbs"]').text()).toBe(
      'HomeLogbookJanuary 1, 2021 12:00 PM',
    );
  });

  it('will render in edit mode if the user owns the log entry', async () => {
    logEntryStore.currentEntry!.creator = BasicUser.profile;
    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);
    const wrapper = mount(LogEntryView, opts);
    const editEntry = wrapper.findComponent(EditLogbookEntry);
    expect(editEntry.isVisible()).toBe(true);
    expect(editEntry.find<HTMLInputElement>('#logNumber').element.value).toBe(
      TestData.logNumber!.toString(),
    );
  });

  it('will render in edit mode if the user is an admin', async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(LogEntryView, opts);
    const editEntry = wrapper.findComponent(EditLogbookEntry);
    expect(editEntry.isVisible()).toBe(true);
    expect(editEntry.find<HTMLInputElement>('#logNumber').element.value).toBe(
      TestData.logNumber!.toString(),
    );
  });

  it('will allow a user to save changes to a log entry', async () => {
    const expected: LogEntryDTO = {
      ...TestData,
      air: [],
      creator: BasicUser.profile,
      logNumber: 13,
      duration: 66,
      notes: 'New notes',
    };
    const entry = new LogEntry(client.axios, { ...TestData });
    const saveSpy = jest.spyOn(entry, 'save').mockResolvedValue();
    const wrapSpy = jest
      .spyOn(client.logEntries, 'wrapDTO')
      .mockReturnValue(entry);

    logEntryStore.currentEntry!.creator = BasicUser.profile;
    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);

    const wrapper = mount(LogEntryView, opts);
    await wrapper.get('#logNumber').setValue('13');
    await wrapper.get('#duration').setValue('66');
    await wrapper.get('#notes').setValue('New notes');
    await wrapper.get('#btnSave').trigger('click');
    await flushPromises();

    expect(saveSpy).toHaveBeenCalled();
    expect(wrapSpy).toHaveBeenCalledWith(expected);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('log-entry-saved');
    expect(wrapper.find<HTMLInputElement>('#logNumber').element.value).toBe(
      '13',
    );
    expect(wrapper.find<HTMLInputElement>('#duration').element.value).toBe(
      '66',
    );
    expect(wrapper.find<HTMLTextAreaElement>('#notes').element.value).toBe(
      'New notes',
    );
  });
});
