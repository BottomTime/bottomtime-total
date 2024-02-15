import { mount } from '@vue/test-utils';

import { TabInfo } from '../../../../src/common';
import TabsPanel from '../../../../src/components/common/tabs-panel.vue';

const Content = '<div>Panel Content</div>';

describe('Tabs panel component', () => {
  let tabs: TabInfo[];

  beforeEach(() => {
    tabs = [
      { key: 'tab1', label: 'Inactive Tab' },
      { key: 'tab2', label: 'Active Tab' },
      { key: 'tab3', label: 'Disabled Tab', disabled: true },
    ];
  });

  it('will render tabs correctly', () => {
    const wrapper = mount(TabsPanel, {
      props: { tabs, activeTab: 'tab2' },
      slots: {
        default: Content,
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly when no active tab is provided', () => {
    const wrapper = mount(TabsPanel, {
      props: { tabs },
      slots: {
        default: Content,
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly when an invalid tab key is active', () => {
    const wrapper = mount(TabsPanel, {
      props: { tabs, activeTab: 'invalid' },
      slots: {
        default: Content,
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly when no tabs are provided', () => {
    const wrapper = mount(TabsPanel, {
      slots: {
        default: Content,
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will raise an event when a new tab is clicked', async () => {
    const wrapper = mount(TabsPanel, {
      props: { tabs, activeTab: 'tab2' },
      slots: {
        default: Content,
      },
    });

    await wrapper.find('[data-testid="tab-tab1"]').trigger('click');
    expect(wrapper.emitted('tab-changed')).toEqual([['tab1']]);
  });
});
