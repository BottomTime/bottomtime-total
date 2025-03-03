import { ComponentMountingOptions, mount } from '@vue/test-utils';

import DrawerPanel from 'src/components/common/drawer-panel.vue';
import { createRouter } from 'tests/fixtures/create-router';
import { Router } from 'vue-router';

describe('Drawer Panel component', () => {
  let router: Router;
  let opts: ComponentMountingOptions<typeof DrawerPanel>;

  beforeAll(() => {
    router = createRouter();
  });

  beforeEach(() => {
    opts = {
      props: {
        title: 'Test',
        visible: true,
        showClose: true,
      },
      slots: {
        default: '<div>Test</div>',
      },
      global: {
        stubs: {
          teleport: true,
        },
        plugins: [router],
      },
    };
  });

  it('will render correctly with content', () => {
    const wrapper = mount(DrawerPanel, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit close event when close button is clicked', async () => {
    const wrapper = mount(DrawerPanel, opts);
    await wrapper.find('[data-testid="drawer-close"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('will emit close event when backdrop is clicked', async () => {
    const wrapper = mount(DrawerPanel, opts);
    await wrapper.find('[data-testid="drawer-backdrop"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('will not emit close event when backdrop is clicked and showClose is false', async () => {
    const wrapper = mount(DrawerPanel, opts);
    await wrapper.setProps({ showClose: false });
    await wrapper.find('[data-testid="drawer-backdrop"]').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('will hide close button when showClose is false', async () => {
    const wrapper = mount(DrawerPanel, opts);
    await wrapper.setProps({ showClose: false });
    expect(wrapper.find('[data-testid="drawer-close"]').exists()).toBe(false);
  });

  it('will display a link button to a full screen view', async () => {
    const wrapper = mount(DrawerPanel, opts);
    await wrapper.setProps({ fullScreen: '/test' });

    const fullScreenButton = wrapper.find('[data-testid="drawer-fullscreen"]');
    expect(fullScreenButton.isVisible()).toBe(true);
    expect(fullScreenButton.html()).toMatchSnapshot();
  });

  it('will display an edit button to an edit page', async () => {
    const wrapper = mount(DrawerPanel, opts);
    await wrapper.setProps({ edit: '/test' });

    const editButton = wrapper.find('[data-testid="drawer-edit"]');
    expect(editButton.isVisible()).toBe(true);
    expect(editButton.html()).toMatchSnapshot();
  });
});
