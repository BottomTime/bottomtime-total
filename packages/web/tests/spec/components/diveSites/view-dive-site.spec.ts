import { mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import ViewDiveSite from '../../../../src/components/diveSites/view-dive-site.vue';
import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../../fixtures/sites';

describe('View Dive Site component', () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
    jest.useFakeTimers({
      now: new Date('2024-08-01T00:00:00Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will render site with full details', () => {
    const wrapper = mount(ViewDiveSite, {
      props: {
        site: DiveSiteWithFullProperties,
      },
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render site with minimal details', () => {
    const wrapper = mount(ViewDiveSite, {
      props: {
        site: DiveSiteWithMinimalProperties,
      },
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
