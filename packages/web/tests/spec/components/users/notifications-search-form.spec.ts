import { ComponentMountingOptions, mount } from '@vue/test-utils';

import FormButton from '../../../../src/components/common/form-button.vue';
import NotificationsSearchForm from '../../../../src/views/users/notifications-search-form.vue';

const ShowDismissedCheck = 'input#showDismissed';
const SearchButton = 'button#btn-search';

describe('NotificationsSearchForm component', () => {
  let opts: ComponentMountingOptions<typeof NotificationsSearchForm>;

  beforeEach(() => {
    opts = {
      props: {
        searchOptions: {},
      },
    };
  });

  it('will initialize with default search options', () => {
    const wrapper = mount(NotificationsSearchForm, opts);
    expect(
      wrapper.get<HTMLInputElement>(ShowDismissedCheck).element.checked,
    ).toBe(false);
  });

  it('will initialize with search options set', async () => {
    const wrapper = mount(NotificationsSearchForm, {
      ...opts,
      props: {
        searchOptions: {
          showDismissed: true,
          showAfter: new Date('2024-12-10T08:07:59-05:00'),
        },
      },
    });
    expect(
      wrapper.get<HTMLInputElement>(ShowDismissedCheck).element.checked,
    ).toBe(true);
  });

  it('will update state if props are changed', async () => {
    const wrapper = mount(NotificationsSearchForm, opts);
    await wrapper.setProps({
      searchOptions: {
        showDismissed: true,
        showAfter: new Date('2024-12-10T08:07:59-05:00'),
      },
    });
    expect(
      wrapper.get<HTMLInputElement>(ShowDismissedCheck).element.checked,
    ).toBe(true);
  });

  it('will disable form when isLoading is set to true', async () => {
    const wrapper = mount(NotificationsSearchForm, opts);
    await wrapper.setProps({ isLoading: true });
    expect(wrapper.get<HTMLFieldSetElement>('fieldset').element.disabled).toBe(
      true,
    );
    expect(wrapper.getComponent(FormButton).props('isLoading')).toBe(true);
  });

  it('will emit search event when form is submitted', async () => {
    const wrapper = mount(NotificationsSearchForm, opts);
    await wrapper.get(ShowDismissedCheck).setValue(true);
    await wrapper.get(SearchButton).trigger('click');
    expect(wrapper.emitted('search')).toEqual([
      [
        {
          showDismissed: true,
        },
      ],
    ]);
  });
});
