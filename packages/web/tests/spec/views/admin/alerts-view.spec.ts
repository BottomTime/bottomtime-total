import {
  AlertDTO,
  ApiList,
  Fetcher,
  ListAlertsResponseSchema,
} from '@bottomtime/api';
import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import AlertsListItem from '../../../../src/components/admin/alerts-list-item.vue';
import AlertsList from '../../../../src/components/admin/alerts-list.vue';
import { useCurrentUser } from '../../../../src/store';
import AdminAlertsView from '../../../../src/views/admin/alerts-view.vue';
import AlertData from '../../../fixtures/alerts.json';
import { createRouter } from '../../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const AlertsCount = '[data-testid="alerts-count"]';

describe('Admin Alerts View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let alertData: ApiList<AlertDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let options: ComponentMountingOptions<typeof AdminAlertsView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
    alertData = ListAlertsResponseSchema.parse(AlertData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    currentUser.user = AdminUser;
    listSpy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValue({
      data: alertData.data.slice(0, 10),
      totalCount: alertData.totalCount,
    });

    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    };
  });

  it('will not render if user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminAlertsView, options);
    await flushPromises();

    expect(wrapper.find(AlertsCount).exists()).toBe(false);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('will not render if user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminAlertsView, options);
    await flushPromises();

    expect(wrapper.find(AlertsCount).exists()).toBe(false);
    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find(AlertsCount).exists()).toBe(false);
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('will render a list of alerts', async () => {
    const wrapper = mount(AdminAlertsView, options);
    await flushPromises();

    expect(wrapper.find(AlertsCount).text()).toBe('Showing 10 of 30 alerts');

    const alerts = wrapper.findAllComponents(AlertsListItem);
    expect(listSpy).toHaveBeenCalledWith({ showDismissed: true });
    expect(alerts).toHaveLength(10);
    alerts.forEach((alert, index) => {
      expect(alert.props('alert')).toEqual(alertData.data[index]);
    });
  });

  it('will delete an alert', async () => {
    const spy = jest
      .spyOn(client.alerts, 'deleteAlert')
      .mockResolvedValueOnce();

    const wrapper = mount(AdminAlertsView, options);
    await flushPromises();

    const listItem = wrapper.getComponent(AlertsList);
    listItem.vm.$emit('delete', alertData.data[2]);

    await flushPromises();

    expect(spy).toHaveBeenCalledWith(alertData.data[2].id);
  });

  it('will load more alerts', async () => {
    listSpy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValueOnce({
      data: alertData.data.slice(0, 5),
      totalCount: alertData.totalCount,
    });
    const wrapper = mount(AdminAlertsView, options);
    await flushPromises();

    const loadMoreSpy = jest
      .spyOn(client.alerts, 'listAlerts')
      .mockResolvedValueOnce({
        data: alertData.data.slice(5, 10),
        totalCount: alertData.totalCount,
      });
    await wrapper.get('[data-testid="btn-load-more"]').trigger('click');
    await flushPromises();

    const alerts = wrapper.findAllComponents(AlertsListItem);
    expect(listSpy).toHaveBeenCalledWith({ showDismissed: true });
    expect(loadMoreSpy).toHaveBeenCalledWith({ showDismissed: true, skip: 5 });
    expect(alerts).toHaveLength(10);
    alerts.forEach((alert, index) => {
      expect(alert.props('alert')).toEqual(alertData.data[index]);
    });
  });
});
