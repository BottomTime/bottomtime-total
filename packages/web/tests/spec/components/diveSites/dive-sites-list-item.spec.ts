import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import DiveSitesListItem from 'src/components/diveSites/dive-sites-list-item.vue';

import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../../fixtures/sites';
import StarRatingStub from '../../../stubs/star-rating-stub.vue';

describe('Dive Sites List Item component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let global: ComponentMountingOptions<typeof DiveSitesListItem>['global'];

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    global = {
      plugins: [pinia],
      provide: {
        [ApiClientKey as symbol]: client,
      },
      stubs: {
        StarRating: StarRatingStub,
      },
    };
  });

  it('will render a dive site with minimal properties', () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithMinimalProperties },
      global,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render a dive site with full properties', () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithFullProperties },
      global,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit event when name of site is clicked', async () => {
    const wrapper = mount(DiveSitesListItem, {
      props: { site: DiveSiteWithMinimalProperties },
      global,
    });

    await wrapper
      .get(`[data-testid="select-site-${DiveSiteWithMinimalProperties.id}"]`)
      .trigger('click');

    expect(wrapper.emitted('site-selected')).toEqual([
      [DiveSiteWithMinimalProperties],
    ]);
  });
});
