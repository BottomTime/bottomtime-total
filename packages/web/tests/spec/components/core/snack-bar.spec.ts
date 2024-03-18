import { mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { nextTick } from 'vue';

import { Toast, ToastType } from '../../../../src/common';
import SnackBar from '../../../../src/components/core/snack-bar.vue';
import { useToasts } from '../../../../src/store';

const ToastData: Toast[] = [
  {
    id: '1',
    message:
      'Hey-o! Here is a longer message to test the text wrapping. Blah blah blah. Etc. Etc. #Yolo!',
    type: ToastType.Info,
  },
  {
    id: '2',
    message: 'Everything is awesome.',
    type: ToastType.Success,
  },
  {
    id: '3',
    message: 'Ruh roh!',
    type: ToastType.Error,
  },
  {
    id: '4',
    message: 'Something is afoot',
    type: ToastType.Warning,
  },
];

describe('Snack Bar Component', () => {
  let pinia: Pinia;
  let store: ReturnType<typeof useToasts>;

  beforeEach(() => {
    pinia = createPinia();
    store = useToasts(pinia);
  });

  it('will render with no toasts', () => {
    const wrapper = mount(SnackBar, {
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with several toasts', () => {
    ToastData.forEach(store.toast);
    const wrapper = mount(SnackBar, {
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will allow the user to dismiss a toast', async () => {
    store.toast(ToastData[1]);
    const wrapper = mount(SnackBar, {
      global: {
        plugins: [pinia],
      },
    });

    let toast = wrapper.find(`[data-testid="toast-${ToastData[1].id}"]`);
    expect(toast.isVisible()).toBe(true);

    await toast.get('button').trigger('click');
    await nextTick();

    toast = wrapper.find(`[data-testid="toast-${ToastData[1].id}"]`);
    expect(toast.exists()).toBe(false);
  });
});
