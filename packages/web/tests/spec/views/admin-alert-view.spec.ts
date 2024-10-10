import { AlertDTO, Fetcher } from '@bottomtime/api';
import { Alert, ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { ToastType } from '../../../src/common';
import EditAlert from '../../../src/components/admin/edit-alert.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useAlerts, useCurrentUser } from '../../../src/store';
import { useToasts } from '../../../src/store';
import AdminAlertView from '../../../src/views/admin-alert-view.vue';
import { createHttpError } from '../../fixtures/create-http-error';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

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
  let location: Location;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let alerts: ReturnType<typeof useAlerts>;
  let options: ComponentMountingOptions<typeof AdminAlertView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
  });

  beforeEach(() => {
    location = new MockLocation();
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
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    alerts = useAlerts(pinia);

    currentUser.user = AdminUser;
    alerts.currentAlert = { ...TestAlertData };

    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
        stubs: { teleport: true },
      },
    };
  });

  it('will not render if the user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminAlertView, options);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="edit-alert-form"]').exists()).toBe(
      false,
    );
  });

  it('will not render if the user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminAlertView, options);
    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="edit-alert-form"]').exists()).toBe(
      false,
    );
  });

  it('will render with the loaded alert data', async () => {
    await router.push(`/admin/alerts/${TestAlertData.id}`);
    const wrapper = mount(AdminAlertView, options);
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="title"]').element.value,
    ).toBe(TestAlertData.title);
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="message"]').element.value,
    ).toBe(TestAlertData.message);
  });

  it('will render a not found message if alert is not supplied', async () => {
    alerts.currentAlert = null;
    await router.push(`/admin/alerts/${TestAlertData.id}`);
    const wrapper = mount(AdminAlertView, options);
    expect(wrapper.find('[data-testid="edit-alert-form"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
  });

  it('will prefetch the alert data on SSR', async () => {
    const spy = jest
      .spyOn(client.alerts, 'getAlert')
      .mockResolvedValue(new Alert(fetcher, TestAlertData));
    await router.push(`/admin/alerts/${TestAlertData.id}`);

    const html = await renderToString(AdminAlertView, {
      global: options.global,
    });

    expect(spy).toHaveBeenCalledWith(TestAlertData.id);
    expect(html).toMatchSnapshot();
  });

  it('will render in new alert mode if non alert ID is provided in the URL', async () => {
    await router.push('/admin/alerts/new');
    await renderToString(AdminAlertView, { global: options.global });
    expect(alerts.currentAlert).toEqual({
      id: '',
      icon: '',
      title: '',
      message: '',
    });
  });

  it('will render a not found message if the prefetch returns a 404 response', async () => {
    const spy = jest.spyOn(client.alerts, 'getAlert').mockRejectedValue(
      createHttpError({
        status: 404,
        message: 'Not Found',
        method: 'GET',
        path: `/api/alerts/${TestAlertData.id}`,
      }),
    );
    await router.push(`/admin/alerts/${TestAlertData.id}`);

    const html = await renderToString(AdminAlertView, {
      global: options.global,
    });

    expect(spy).toHaveBeenCalledWith(TestAlertData.id);
    expect(html).toMatchSnapshot();
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
    const editAlert = wrapper.getComponent(EditAlert);

    editAlert.vm.$emit('save', updated);
    await flushPromises();

    expect(saveSpy).toHaveBeenCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].type).toBe(ToastType.Success);
  });

  it('will create a new alert', async () => {
    const spy = jest
      .spyOn(client.alerts, 'createAlert')
      .mockResolvedValueOnce(new Alert(fetcher, TestAlertData));

    alerts.currentAlert = {
      id: '',
      icon: '',
      title: '',
      message: '',
    };

    const wrapper = mount(AdminAlertView, options);
    const editAlert = wrapper.getComponent(EditAlert);

    editAlert.vm.$emit('save', {
      ...TestAlertData,
      id: '',
    });
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({ ...TestAlertData, id: '' });
    expect(location.toString()).toBe(
      `http://localhost/admin/alerts/${TestAlertData.id}`,
    );
  });
});
