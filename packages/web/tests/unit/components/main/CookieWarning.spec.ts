import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import CookieWarning from '@/components/main/CookieWarning.vue';
import { createStore } from '@/store';
import { initialStoreState } from '../../../fixtures/store-state';
import { StoreKey } from '@/injection-keys';
import { User } from '@/users';

const LocalStorageKey = 'cookies_accepted';

describe('CookieWarning component', () => {
  it('Will render correctly', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const store = createStore();
    const wrapper = mount(CookieWarning, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will not display if user is logged in', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const user = new Mock<User>().object();
    const store = createStore(initialStoreState({ currentUser: user }));
    const wrapper = mount(CookieWarning, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.find('div#cookie-warning').exists()).toBe(false);
  });

  it('Will not display if prompt has been dismissed', () => {
    const getItem = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockReturnValue('true');
    const store = createStore();
    const wrapper = mount(CookieWarning, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.find('div#cookie-warning').exists()).toBe(false);
    expect(getItem).toBeCalledWith(LocalStorageKey);
  });

  it('Will dismiss the prompt if the button is clicked', async () => {
    const setItem = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        /* No-op */
      });
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const store = createStore();
    const wrapper = mount(CookieWarning, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    await wrapper.get('button#btn-accept-cookies').trigger('click');
    expect(wrapper.find('div#cookie-warning').exists()).toBe(false);
    expect(setItem).toBeCalledWith(LocalStorageKey, 'true');
  });
});
