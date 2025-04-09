import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import SaveWarning from 'src/components/common/save-warning.vue';
import { NavigationObserverKey } from 'src/navigation-observer';
import { ConfirmDialog } from 'tests/constants';
import { createRouter } from 'tests/fixtures/create-router';
import { MockNavigationObserver } from 'tests/mock-navigation-observer';
import { Router } from 'vue-router';

const SaveWarningElement = '[data-testid="save-warning"]';
const SaveButton = '#btn-save-warning-save';

describe('SaveWarning component', () => {
  let router: Router;
  let navigationObserver: MockNavigationObserver;
  let opts: ComponentMountingOptions<typeof SaveWarning>;

  beforeEach(async () => {
    router = createRouter([
      {
        path: '/from',
        component: SaveWarning,
      },
      {
        path: '/to',
        component: SaveWarning,
      },
    ]);
    await router.push('/from');

    navigationObserver = new MockNavigationObserver(router);
    opts = {
      props: {
        isDirty: true,
      },
      global: {
        plugins: [router],
        provide: {
          [NavigationObserverKey as symbol]: navigationObserver,
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will render if dirty flag is set', () => {
    const wrapper = mount(SaveWarning, opts);
    const warning = wrapper.get(SaveWarningElement);
    expect(warning.isVisible()).toBe(true);
    expect(warning.html()).toMatchSnapshot();
  });

  it('will be hidden if dirty flag is unset', async () => {
    const wrapper = mount(SaveWarning, opts);
    await wrapper.setProps({ isDirty: false });
    expect(wrapper.find(SaveWarningElement).exists()).toBe(false);
  });

  it('will emit a "save" event if save button is clicked', async () => {
    const wrapper = mount(SaveWarning, opts);
    await wrapper.get(SaveButton).trigger('click');
    expect(wrapper.emitted('save')).toHaveLength(1);
  });

  it('will render with "save" button disabled if "isSaving" flag is set', async () => {
    const wrapper = mount(SaveWarning, opts);
    await wrapper.setProps({ isSaving: true });
    expect(wrapper.get(SaveButton).attributes('disabled')).toBeDefined();
  });

  it('will prevent a navigation and show a confirmation dialog', async () => {
    const wrapper = mount(SaveWarning, opts);
    await expect(router.push('/to')).resolves.toBeInstanceOf(Error);
    expect(wrapper.get(ConfirmDialog.Confirm).isVisible()).toBe(true);
  });

  it('will allow a user to confirm a navigation', async () => {
    const wrapper = mount(SaveWarning, opts);
    await router.push('/to');
    await wrapper.get(ConfirmDialog.Confirm).trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/to');
  });

  it('will allow a user to cancel a navigation', async () => {
    const wrapper = mount(SaveWarning, opts);
    await router.push('/to');
    await wrapper.get(ConfirmDialog.Cancel).trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/from');
  });
});
