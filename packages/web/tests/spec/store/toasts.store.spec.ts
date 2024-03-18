import { Pinia, createPinia } from 'pinia';

import { Toast, ToastType } from '../../../src/common';
import { useToasts } from '../../../src/store';

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

describe('Toasts Store', () => {
  let pinia: Pinia;

  beforeAll(() => {
    jest.useFakeTimers({
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  beforeEach(() => {
    pinia = createPinia();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will raise toasts', () => {
    const store = useToasts(pinia);
    ToastData.forEach(store.toast);

    const results = store.toasts;
    expect(results).toHaveLength(ToastData.length);
    for (let i = 0; i < ToastData.length; i++) {
      expect(results[i]).toMatchObject(ToastData[i]);
    }
  });

  it('will replace existing toasts', () => {
    const store = useToasts(pinia);
    store.toast(ToastData[0]);
    store.toast(ToastData[0]);
    expect(store.toasts).toHaveLength(1);
  });

  it('will dismiss toasts', () => {
    const store = useToasts(pinia);
    store.toast(ToastData[0]);
    store.dismissToast(ToastData[0].id);
    expect(store.toasts).toHaveLength(0);
  });

  it('will not throw if dismissing a non-existent toast', () => {
    const store = useToasts(pinia);
    expect(() => store.dismissToast('foo')).not.toThrow();
  });

  it('will automatically dismiss toasts when their timers run out', async () => {
    const store = useToasts(pinia);
    store.toast(ToastData[0]);

    expect(store.toasts).toHaveLength(1);

    jest.runAllTimers();
    expect(store.toasts).toHaveLength(0);
  });
});
