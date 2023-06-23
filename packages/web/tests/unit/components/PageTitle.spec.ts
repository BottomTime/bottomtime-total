import { shallowMount } from '@vue/test-utils';

import PageTitle from '@/components/PageTitle.vue';

describe('PageTitle Component', () => {
  it('Will display a title and subtitle', () => {
    const title = 'Title';
    const subtitle = 'A Witty Subtitle';

    const wrapper = shallowMount(PageTitle, {
      props: { title, subtitle },
    });

    expect(wrapper.html()).toMatchSnapshot();
    expect(document.title).toEqual(`BottomTime | ${title}`);
  });

  it('Will display without a subtitle', () => {
    const title = 'Title';

    const wrapper = shallowMount(PageTitle, {
      props: { title },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
