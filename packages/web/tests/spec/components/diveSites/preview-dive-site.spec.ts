import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import PreviewDiveSite from 'src/components/diveSites/preview-dive-site.vue';
import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from 'tests/fixtures/sites';
import StarRatingStub from 'tests/star-rating-stub.vue';

describe('PreviewDiveSite component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof PreviewDiveSite>;

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      props: { site: DiveSiteWithFullProperties },
      global: {
        plugins: [pinia],
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will render with a full dive site', () => {
    const wrapper = mount(PreviewDiveSite, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with a partial dive site', async () => {
    const wrapper = mount(PreviewDiveSite, {
      ...opts,
      props: { site: DiveSiteWithMinimalProperties },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
