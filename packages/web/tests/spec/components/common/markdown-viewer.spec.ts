import { mount } from '@vue/test-utils';

import MarkdownViewer from '../../../../src/components/common/markdown-viewer.vue';

const SampleMarkdown = `
# Heading
## Other Heading
### Smaller heading

* Hi
* Yup
* Nope

This paragraph contains some _italic_ text and some __bold__ text. Additionally, there is some ~~strikethrough~~ text. :smile:

> Block quote

\`code\`

\`\`\`
blah
\`\`\`

1. lol
2. lol

- [x] Get groceries
- [ ] Fold clothes

[link](https://tailwindcss.com)

| Heading 1 | Heading 2 |
| --- | ---: |
| omg | table |
| wat | wat |
`;

describe('MarkdownViewer component', () => {
  it('will render markup as HTML', () => {
    const wrapper = mount(MarkdownViewer, {
      props: {
        modelValue: SampleMarkdown,
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });
});
