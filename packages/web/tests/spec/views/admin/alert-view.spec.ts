import { AlertDTO, Fetcher } from '@bottomtime/api';
import { Alert, ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { ToastType } from '../../../../src/common';
import EditAlert from '../../../../src/components/admin/edit-alert.vue';
import { useCurrentUser } from '../../../../src/store';
import { useToasts } from '../../../../src/store';
import AdminAlertView from '../../../../src/views/admin/alert-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const TestAlertData: AlertDTO = {
  id: '8bd0b331-36e9-4e3b-afa2-2e020bedaa60',
  icon: '',
  title: 'Test Alert',
  message: 'This is a test alert.',
  active: new Date('2021-01-01T00:00:00.000Z'),
  expires: new Date('2021-02-01T00:00:00.000Z'),
};

describe('Admin Alert View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let options: ComponentMountingOptions<typeof AdminAlertView>;
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/admin/alerts/new',
        name: 'NewAlert',
        component: AdminAlertView,
      },
      {
        path: '/admin/alerts/:alertId',
        name: 'AdminAlert',
        component: AdminAlertView,
      },
    ]);
  });

  beforeEach(async () => {
    await router.push(`/admin/alerts/${TestAlertData.id}`);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    currentUser.user = AdminUser;

    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    };
    fetchSpy = jest
      .spyOn(client.alerts, 'getAlert')
      .mockResolvedValue(new Alert(fetcher, { ...TestAlertData }));
  });

  it('will not render if the user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="edit-alert-form"]').exists()).toBe(
      false,
    );
  });

  it('will not render if the user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="edit-alert-form"]').exists()).toBe(
      false,
    );
  });

  it('will render with the loaded alert data', async () => {
    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledWith(TestAlertData.id);
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="title"]').element.value,
    ).toBe(TestAlertData.title);
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="message"]').element.value,
    ).toBe(TestAlertData.message);
  });

  it('will render a not found message if alert is not supplied', async () => {
    jest
      .spyOn(client.alerts, 'getAlert')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    expect(wrapper.find('[data-testid="edit-alert-form"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
  });

  it('will render in new alert mode if no alert ID is provided in the URL', async () => {
    await router.push('/admin/alerts/new');
    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="title"]').element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="message"]').element.value,
    ).toBe('');
  });

  it('will save an existing alert', async () => {
    const updated: AlertDTO = {
      id: TestAlertData.id,
      icon: '',
      title: 'Updated Alert',
      message: 'This is the updated alert.',
      active: new Date('2028-01-01T00:00:00.000Z'),
      expires: new Date('2028-02-01T00:00:00.000Z'),
    };
    const toasts = useToasts();
    const alert = new Alert(fetcher, TestAlertData);
    const saveSpy = jest.spyOn(alert, 'save').mockResolvedValueOnce();
    jest.spyOn(client.alerts, 'wrapDTO').mockReturnValueOnce(alert);
    await router.push(`/admin/alerts/${TestAlertData.id}`);

    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    const editAlert = wrapper.getComponent(EditAlert);

    editAlert.vm.$emit('save', updated);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].type).toBe(ToastType.Success);
  });

  it('will create a new alert', async () => {
    await router.push('/admin/alerts/new');
    const spy = jest
      .spyOn(client.alerts, 'createAlert')
      .mockResolvedValueOnce(new Alert(fetcher, TestAlertData));

    const wrapper = mount(AdminAlertView, options);
    await flushPromises();

    const editAlert = wrapper.getComponent(EditAlert);
    editAlert.vm.$emit('save', {
      ...TestAlertData,
      id: '',
    });
    await flushPromises();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ ...TestAlertData, id: '' });
    expect(router.currentRoute.value.path).toBe(
      `/admin/alerts/${TestAlertData.id}`,
    );
  });
});
