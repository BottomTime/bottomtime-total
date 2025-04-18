import { AlertDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import localized from 'dayjs/plugin/localizedFormat';

import AlertsListItem from '../../../../src/components/admin/alerts-list-item.vue';
import { createRouter } from '../../../fixtures/create-router';

dayjs.extend(localized);

const TestAlertData: AlertDTO = {
  id: '2fbcb477-26d8-499f-9558-4d3ee1500b96',
  icon: '',
  title: 'Test Alert',
  message: 'This is a test alert',
  active: new Date('2024-04-02T09:56:27.566Z').valueOf(),
  expires: new Date('2024-05-02T09:56:27.566Z').valueOf(),
};

function getMountOptions(
  alert?: Partial<AlertDTO>,
): ComponentMountingOptions<typeof AlertsListItem> {
  const router = createRouter();
  return {
    props: {
      alert: { ...TestAlertData, ...alert },
    },
    global: {
      plugins: [router],
    },
  };
}

describe('Alerts List Item component', () => {
  it('will render details correctly', () => {
    const wrapper = mount(AlertsListItem, getMountOptions());
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render details correctly when dates are not set', () => {
    const wrapper = mount(
      AlertsListItem,
      getMountOptions({ active: undefined, expires: undefined }),
    );
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit edit event when the edit button is clicked', () => {
    const wrapper = mount(AlertsListItem, getMountOptions());
    wrapper
      .get(`button[data-testid="btn-edit-alert-${TestAlertData.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[TestAlertData]]);
  });

  it('will emit delete event when delete button is clicked', () => {
    const wrapper = mount(AlertsListItem, getMountOptions());
    wrapper
      .get(`button[data-testid="btn-delete-alert-${TestAlertData.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[TestAlertData]]);
  });
});
