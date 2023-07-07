import { mount } from '@vue/test-utils';

import { createStore } from '@/store';
import SnackBar from '@/components/main/SnackBar.vue';
import { StoreKey } from '@/injection-keys';
import { initialStoreState } from '../../../fixtures/store-state';
import { ToastType } from '@/helpers';

describe('SnackBar component', () => {
  it('Will render with no toasts', async () => {
    const store = createStore();
    const wrapper = mount(SnackBar, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will render with several toasts', async () => {
    const store = createStore(
      initialStoreState({
        toasts: {
          success: {
            id: 'success',
            type: ToastType.Success,
            message: 'Successful!',
          },
          error: {
            id: 'error',
            type: ToastType.Error,
            message: 'Error',
            description: 'Something went wrong.',
          },
          warning: {
            id: 'warning',
            type: ToastType.Warning,
            message: 'Warning!',
            description: 'OMG!!',
          },
        },
      }),
    );
    const wrapper = mount(SnackBar, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
