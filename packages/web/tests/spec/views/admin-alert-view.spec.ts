import { AlertDTO } from '@bottomtime/api';
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
import { AppInitialState, useInitialState } from '../../../src/initial-state';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import { useToasts } from '../../../src/store';
import AdminAlertView from '../../../src/views/admin-alert-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

jest.mock('../../../src/initial-state');

const TestAlertData: AlertDTO = {
  id: '8bd0b331-36e9-4e3b-afa2-2e020bedaa60',
  icon: '',
  title: 'Test Alert',
  message: 'This is a test alert.',
  active: new Date('2021-01-01T00:00:00.000Z'),
  expires: new Date('2021-02-01T00:00:00.000Z'),
};

describe('Admin Alert View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let location: Location;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let options: ComponentMountingOptions<typeof AdminAlertView>;
  let initialState: AppInitialState;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    location = new MockLocation();
    router = createRouter([
      {
        path: '/admin/alerts/:alertId',
        name: 'AdminAlert',
        component: AdminAlertView,
      },
    ]);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = AdminUser;
    initialState = {
      currentUser: AdminUser,
      currentAlert: { ...TestAlertData },
    };
    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
    jest.mocked(useInitialState).mockImplementation(() => initialState);
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
    initialState.currentAlert = undefined;
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
      .mockResolvedValue(new Alert(client.axios, TestAlertData));
    await router.push(`/admin/alerts/${TestAlertData.id}`);

    const html = await renderToString(AdminAlertView, {
      global: options.global,
    });

    expect(spy).toHaveBeenCalledWith(TestAlertData.id);
    expect(html).toMatchSnapshot();
  });

  it('will render a not found message if the prefetch returns a 404 response', async () => {
    const spy = jest.spyOn(client.alerts, 'getAlert').mockRejectedValue(
      createAxiosError({
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
    const alert = new Alert(client.axios, TestAlertData);
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
      .mockResolvedValueOnce(new Alert(client.axios, TestAlertData));

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
