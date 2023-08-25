import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import { createStore } from '@/store';
import { initialStoreState } from '../../fixtures/store-state';
import RequireAnonymous from '@/components/RequireAnonymous.vue';
import { StoreKey } from '@/injection-keys';
import { User } from '@/client/users';

describe('RequireAnonymous component', () => {
  it('Will render content if user is anonymous', () => {
    const store = createStore();
    const content = '<p>Hi! You are anonymous!</p>';
    const wrapper = mount(RequireAnonymous, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
      slots: {
        default: content,
      },
    });
    expect(wrapper.html()).toEqual(content);
  });

  it('Will display notice to users who are already logged in', () => {
    const currentUser = new Mock<User>().object();
    const store = createStore(initialStoreState({ currentUser }));
    const content = '<p id="hide-me">Should not be visible</p>';
    const wrapper = mount(RequireAnonymous, {
      global: {
        provide: {
          [StoreKey as symbol]: store,
        },
      },
      slots: {
        default: content,
      },
    });
    expect(wrapper.find('div#user-logged-in-content').isVisible()).toBe(true);
    expect(wrapper.find('p#hide-me').exists()).toBe(false);
  });
});
