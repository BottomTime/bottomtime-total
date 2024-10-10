import {
  ListAlertsResponseDTO,
  ListAlertsResponseSchema,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import AlertsListItem from '../../../../src/components/admin/alerts-list-item.vue';
import AlertsList from '../../../../src/components/admin/alerts-list.vue';
import AlertData from '../../../fixtures/alerts.json';

const EmptyResultSet: ListAlertsResponseDTO = {
  alerts: [],
  totalCount: 0,
};

const AlertsCountText = 'p[data-testid="alerts-count"]';
const AlertsListElement = 'ul[data-testid="alerts-list"]';
const LoadMoreButton = 'button[data-testid="btn-load-more"]';

describe('Alerts list component', () => {
  let alertData: ListAlertsResponseDTO;
  let opts: ComponentMountingOptions<typeof AlertsList>;

  beforeEach(() => {
    alertData = ListAlertsResponseSchema.parse(AlertData);
    opts = {
      global: {
        stubs: { teleport: true },
      },
    };
  });

  it('will render an empty list', async () => {
    const wrapper = mount(AlertsList, {
      props: { alerts: EmptyResultSet },
      ...opts,
    });

    expect(wrapper.get(AlertsCountText).text()).toBe('Showing 0 of 0 alerts');
    expect(
      wrapper.get('[data-testid="alerts-list-empty"]').html(),
    ).toMatchSnapshot();
    expect(wrapper.find(AlertsListElement).exists()).toBe(false);
  });

  it('will render a partial list', async () => {
    alertData.alerts = alertData.alerts.slice(0, 10);
    const wrapper = mount(AlertsList, {
      props: { alerts: alertData },
      ...opts,
    });

    expect(wrapper.get(AlertsCountText).text()).toBe('Showing 10 of 30 alerts');
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    const list = wrapper.get(AlertsListElement);
    expect(list.isVisible()).toBe(true);

    const listItems = list.findAll('li');
    expect(listItems.length).toBe(11);

    alertData.alerts.forEach((alert, i) => {
      expect(listItems.at(i)!.text()).toContain(alert.title);
    });
  });

  it('will show the loading spinner if isLoadingMore is true', () => {
    alertData.alerts = alertData.alerts.slice(0, 10);
    const wrapper = mount(AlertsList, {
      props: { alerts: alertData, isLoadingMore: true },
      ...opts,
    });

    expect(wrapper.get('[data-testid="loading-more-alerts"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  it('will allow a user to confirm a deletion', async () => {
    const wrapper = mount(AlertsList, {
      props: { alerts: alertData },
      ...opts,
    });

    const listItem = wrapper.getComponent(AlertsListItem);
    listItem.vm.$emit('delete', alertData.alerts[0]);
    await flushPromises();

    const dialog = wrapper.get('[data-testid="dialog-modal"]');
    expect(dialog.isVisible()).toBe(true);
    expect(dialog.text()).toContain(alertData.alerts[0].title);
    await dialog
      .get('button[data-testid="dialog-confirm-button"]')
      .trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
    expect(wrapper.emitted('delete')).toEqual([[alertData.alerts[0]]]);
  });

  it('will allow a user to cancel a deletion', async () => {
    const wrapper = mount(AlertsList, {
      props: { alerts: alertData },
      ...opts,
    });

    const listItem = wrapper.getComponent(AlertsListItem);
    listItem.vm.$emit('delete', alertData.alerts[0]);
    await flushPromises();

    const dialog = wrapper.get('[data-testid="dialog-modal"]');
    expect(dialog.isVisible()).toBe(true);
    expect(dialog.text()).toContain(alertData.alerts[0].title);
    await dialog
      .get('button[data-testid="dialog-cancel-button"]')
      .trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
    expect(wrapper.emitted('delete')).toBeUndefined();
  });
});
