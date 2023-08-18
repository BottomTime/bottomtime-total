import { Mock } from 'moq.ts';
import { mount } from '@vue/test-utils';

import { createStore } from '@/store';
import { initialStoreState } from '../../../fixtures/store-state';
import NavBar from '@/components/main/NavBar.vue';
import { Profile, User } from '@/client/users';
import router from '@/router';
import { StoreKey } from '@/injection-keys';
import { UserRole } from '@/constants';

function createUser(role: number): User {
  const profile = new Mock<Profile>()
    .setup((instance) => instance.name)
    .returns('Jonny C')
    .object();
  const user = new Mock<User>()
    .setup((instance) => instance.username)
    .returns('jon_c23')
    .setup((instance) => instance.email)
    .returns('jonny@gmail.org')
    .setup((instance) => instance.profile)
    .returns(profile)
    .setup((instance) => instance.role)
    .returns(role)
    .object();
  return user;
}

describe('NavBar component', () => {
  it('Will render correctly for anonymous users', () => {
    const store = createStore();
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will render correctly for regular users', () => {
    const currentUser = createUser(UserRole.User);
    const store = createStore(initialStoreState({ currentUser }));
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('Will render correctly for administrators', () => {
    const currentUser = createUser(UserRole.Admin);
    const store = createStore(initialStoreState({ currentUser }));
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
        provide: {
          [StoreKey as symbol]: store,
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it.todo('Test closing drop down events...');
});
