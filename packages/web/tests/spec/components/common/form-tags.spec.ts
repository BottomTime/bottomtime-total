import { ComponentMountingOptions, mount } from '@vue/test-utils';

import FormTags from '../../../../src/components/common/form-tags.vue';

describe('FormTags component', () => {
  function getOpts(
    tags: string[],
    readonly = false,
  ): ComponentMountingOptions<typeof FormTags> {
    return {
      props: {
        modelValue: tags,
        readonly,
      },
    };
  }

  describe('when in readonly mode', () => {
    it('will render with no tags', () => {
      const wrapper = mount(FormTags, getOpts([], true));
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('will render with tags', () => {
      const tags = ['Taggified', 'Omg Another tag'];
      const wrapper = mount(FormTags, getOpts(tags, true));
      expect(wrapper.html()).toMatchSnapshot();
    });
  });

  describe('when in edit mode', () => {
    it('will render with no tags', () => {
      const wrapper = mount(FormTags, getOpts([]));
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('will render with tags', () => {
      const tags = ['Taggified', 'Omg Another tag'];
      const wrapper = mount(FormTags, getOpts(tags));
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('will let user remove a tag', async () => {
      const tags = ['tag1', 'tag2'];
      const wrapper = mount(FormTags, getOpts(tags));
      await wrapper.get('[data-testid="btn-remove-tag-tag1"]').trigger('click');
    });
  });
});
