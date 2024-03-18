import { DepthUnit, UserDTO } from '@bottomtime/api';

import DepthText from '@/components/common/depth-text.vue';
import { useCurrentUser } from '@/store';
import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import { BasicUser } from '../../../fixtures/users';

describe('Depth Text component', () => {
  [
    { name: 'meters', unit: DepthUnit.Meters, depth: 21.385 },
    { name: 'feet', unit: DepthUnit.Feet, depth: 68.98 },
  ].forEach(({ name, unit, depth }) => {
    let pinia: Pinia;
    let currentUser: ReturnType<typeof useCurrentUser>;
    let opts: ComponentMountingOptions<typeof DepthText>;

    beforeEach(() => {
      pinia = createPinia();
      currentUser = useCurrentUser(pinia);
      opts = {
        props: {
          depth,
          unit,
        },
        global: {
          plugins: [pinia],
        },
      };
    });

    it(`will display in natural units (${name}) for unauthenticated users`, () => {
      currentUser.user = null;
      const wrapper = mount(DepthText, opts);
      expect(wrapper.text()).toMatchSnapshot();
    });

    it(`will display in the user's preferred units (${name}) without conversion if possible`, () => {
      const user: UserDTO = {
        ...BasicUser,
        settings: {
          ...BasicUser.settings,
          depthUnit: unit,
        },
      };
      currentUser.user = user;
      const wrapper = mount(DepthText, opts);
      expect(wrapper.text()).toMatchSnapshot();
    });

    it(`will display in the user's preferred units with conversion from ${name} if necessary`, () => {
      const user: UserDTO = {
        ...BasicUser,
        settings: {
          ...BasicUser.settings,
          depthUnit:
            unit === DepthUnit.Meters ? DepthUnit.Feet : DepthUnit.Meters,
        },
      };
      currentUser.user = user;
      const wrapper = mount(DepthText, opts);
      expect(wrapper.text()).toMatchSnapshot();
    });
  });
});
