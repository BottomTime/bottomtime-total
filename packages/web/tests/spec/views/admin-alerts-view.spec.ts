import {
  Fetcher,
  ListAlertsResponseDTO,
  ListAlertsResponseSchema,
} from '@bottomtime/api';
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
import AlertsList from '../../../src/components/admin/alerts-list.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useAlerts, useCurrentUser } from '../../../src/store';
import AdminAlertsView from '../../../src/views/admin-alerts-view.vue';
import AlertData from '../../fixtures/alerts.json';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

const AlertsCount = '[data-testid="alerts-count"]';

describe('Admin Alerts View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let alertData: ListAlertsResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let alertsStore: ReturnType<typeof useAlerts>;
  let options: ComponentMountingOptions<typeof AdminAlertsView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
    alertData = ListAlertsResponseSchema.parse(AlertData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    alertsStore = useAlerts(pinia);

    currentUser.user = AdminUser;
    alertsStore.results = {
      alerts: alertData.alerts.slice(0, 10),
      totalCount: alertData.totalCount,
    };

    options = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: new MockLocation(),
        },
      },
    };
  });

  it('will not render if user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminAlertsView, options);
    expect(wrapper.find(AlertsCount).exists()).toBe(false);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
  });

  it('will not render if user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminAlertsView, options);
    expect(wrapper.find(AlertsCount).exists()).toBe(false);
    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find(AlertsCount).exists()).toBe(false);
  });

  it('will render a list of alerts', async () => {
    const wrapper = mount(AdminAlertsView, options);
    expect(wrapper.find(AlertsCount).text()).toBe('Showing 10 of 30 alerts');
    const alertsList = wrapper.get('[data-testid="alerts-list"]');
    const listItems = alertsList.findAll('li');

    expect(listItems).toHaveLength(11);
    for (let i = 0; i < 10; i++) {
      expect(listItems.at(i)?.text()).toContain(alertData.alerts[i].title);
    }
  });

  it('will prefetch alerts on the server side', async () => {
    const spy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValueOnce({
      alerts: alertData.alerts
        .slice(0, 10)
        .map((dto) => new Alert(fetcher, dto)),
      totalCount: alertData.totalCount,
    });

    const html = await renderToString(AdminAlertsView, {
      global: options.global,
    });
    expect(spy).toHaveBeenCalledWith({ showDismissed: true });
    expect(html).toMatchSnapshot();
  });

  it('will render a list of alerts on the client side', async () => {
    const wrapper = mount(AdminAlertsView, options);
    const alertsList = wrapper.get('[data-testid="alerts-list"]');
    const listItems = alertsList.findAll('li');

    expect(listItems).toHaveLength(11);
    for (let i = 0; i < 10; i++) {
      expect(listItems.at(i)?.text()).toContain(alertData.alerts[i].title);
    }
  });

  it('will delete an alert', async () => {
    const alert = new Alert(fetcher, alertData.alerts[0]);
    const spy = jest.spyOn(alert, 'delete').mockResolvedValueOnce();
    jest.spyOn(client.alerts, 'wrapDTO').mockReturnValueOnce(alert);

    const wrapper = mount(AdminAlertsView, options);
    const listItem = wrapper.getComponent(AlertsList);
    listItem.vm.$emit('delete', alertData.alerts[2]);

    await flushPromises();

    expect(spy).toHaveBeenCalled();
  });

  it('will load more alerts', async () => {
    const spy = jest.spyOn(client.alerts, 'listAlerts').mockResolvedValueOnce({
      alerts: alertData.alerts
        .slice(10, 20)
        .map((dto) => new Alert(fetcher, dto)),
      totalCount: alertData.totalCount,
    });
    const wrapper = mount(AdminAlertsView, options);
    const listItem = wrapper.getComponent<typeof AlertsList>(AlertsList);

    listItem.vm.$emit('load-more');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({ showDismissed: true, skip: 10 });
    const items = wrapper.get('[data-testid="alerts-list"]').findAll('li');
    expect(items).toHaveLength(21);
    for (let i = 10; i < 20; i++) {
      expect(items.at(i)!.text()).toContain(alertData.alerts[i].title);
    }
  });
});
