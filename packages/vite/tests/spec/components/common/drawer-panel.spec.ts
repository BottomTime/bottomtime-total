import { mount } from '@vue/test-utils';
import DrawerPanel from '../../../../src/components/common/drawer-panel.vue';

describe('Drawer Panel component', () => {
  it('will render correctly with content', () => {
    const wrapper = mount(DrawerPanel, {
      props: {
        title: 'Test',
        visible: true,
        showClose: true,
      },
      slots: {
        default: '<div>Test</div>',
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit close event when close button is clicked', async () => {
    const wrapper = mount(DrawerPanel, {
      props: {
        title: 'Test',
        visible: true,
        showClose: true,
      },
      slots: {
        default: '<div>Test</div>',
      },
    });
    await wrapper.find('[data-testid="drawer-close"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('will emit close event when backdrop is clicked', async () => {
    const wrapper = mount(DrawerPanel, {
      props: {
        title: 'Test',
        visible: true,
        showClose: true,
      },
      slots: {
        default: '<div>Test</div>',
      },
    });
    await wrapper.find('[data-testid="drawer-backdrop"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('will not emit close event when backdrop is clicked and showClose is false', async () => {
    const wrapper = mount(DrawerPanel, {
      props: {
        title: 'Test',
        visible: true,
        showClose: false,
      },
      slots: {
        default: '<div>Test</div>',
      },
    });
    await wrapper.find('[data-testid="drawer-backdrop"]').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('will hide close button when showClose is false', () => {
    const wrapper = mount(DrawerPanel, {
      props: {
        title: 'Test',
        visible: true,
        showClose: false,
      },
      slots: {
        default: '<div>Test</div>',
      },
    });
    expect(wrapper.find('[data-testid="drawer-close"]').exists()).toBe(false);
  });
});
