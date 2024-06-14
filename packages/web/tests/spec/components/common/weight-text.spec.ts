import { UserDTO, WeightUnit } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import WeightText from '../../../../src/components/common/weight-text.vue';
import { useCurrentUser } from '../../../../src/store';
import { BasicUser } from '../../../fixtures/users';

describe('WeightText component', () => {
  [
    { name: 'kilograms', unit: WeightUnit.Kilograms, weight: 2.25 },
    { name: 'pounds', unit: WeightUnit.Pounds, weight: 5.5 },
  ].forEach(({ name, unit, weight }) => {
    let pinia: Pinia;
    let currentUser: ReturnType<typeof useCurrentUser>;
    let opts: ComponentMountingOptions<typeof WeightText>;

    beforeEach(() => {
      pinia = createPinia();
      currentUser = useCurrentUser(pinia);
      opts = {
        props: {
          weight,
          unit,
        },
        global: {
          plugins: [pinia],
        },
      };
    });

    it(`will display in natural units (${name}) for unauthenticated users`, () => {
      currentUser.user = null;
      const wrapper = mount(WeightText, opts);
      expect(wrapper.text()).toMatchSnapshot();
    });

    it(`will display in the user's preferred units (${name}) without conversion if possible`, () => {
      const user: UserDTO = {
        ...BasicUser,
        settings: {
          ...BasicUser.settings,
          weightUnit: unit,
        },
      };
      currentUser.user = user;
      const wrapper = mount(WeightText, opts);
      expect(wrapper.text()).toMatchSnapshot();
    });

    it(`will display in the user's preferred units with conversion from ${name} if necessary`, () => {
      const user: UserDTO = {
        ...BasicUser,
        settings: {
          ...BasicUser.settings,
          weightUnit:
            unit === WeightUnit.Kilograms
              ? WeightUnit.Pounds
              : WeightUnit.Kilograms,
        },
      };
      currentUser.user = user;
      const wrapper = mount(WeightText, opts);
      expect(wrapper.text()).toMatchSnapshot();
    });
  });
});
