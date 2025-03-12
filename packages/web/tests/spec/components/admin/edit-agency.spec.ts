import { flushPromises, mount } from '@vue/test-utils';

import EditAgency from 'src/components/admin/edit-agency.vue';
import { TestAgencies } from 'tests/fixtures/agencies';

const NameInput = '#agency-name';
const LongNameInput = '#agency-long-name';
const WebsiteInput = '#agency-website';

const NameError = '[data-testid="agency-name-error"]';
const LongNameError = '[data-testid="agency-long-name-error"]';
const WebsiteError = '[data-testid="agency-website-error"]';

const SaveButton = '#btn-save-agency';
const CancelButton = '#btn-cancel-agency';

describe('EditAgency component', () => {
  it('will render to create a new agency', () => {
    const wrapper = mount(EditAgency);
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(LongNameInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe('');
  });

  it('will render to edit an existing agency', async () => {
    const wrapper = mount(EditAgency);
    await wrapper.setProps({ agency: TestAgencies[0] });
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      TestAgencies[0].name,
    );
    expect(wrapper.get<HTMLInputElement>(LongNameInput).element.value).toBe(
      TestAgencies[0].longName,
    );
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe(
      TestAgencies[0].website,
    );
  });

  it('will validate for empty fields', async () => {
    const wrapper = mount(EditAgency);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(NameError).text()).toBe('Abbreviation is required');
    expect(wrapper.get(LongNameError).text()).toBe('Full name is required');
    expect(wrapper.get(WebsiteError).text()).toBe('Website is required');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate for invalid fields', async () => {
    const wrapper = mount(EditAgency);

    await wrapper.get(NameInput).setValue('Hell nah!');
    await wrapper.get(WebsiteInput).setValue('not-a-url');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(NameError).text()).toBe(
      'Abbreviation must only contain letters, numbers, and whitespace',
    );
    expect(wrapper.get(WebsiteError).text()).toBe(
      'Website must be a valid URL',
    );
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will emit save event for new agencies', async () => {
    const wrapper = mount(EditAgency);
    await wrapper.get(NameInput).setValue('UA');
    await wrapper.get(LongNameInput).setValue('Updated Agency');
    await wrapper.get(WebsiteInput).setValue('https://www.agency.com');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          id: '',
          logo: expect.any(String),
          name: 'UA',
          longName: 'Updated Agency',
          website: 'https://www.agency.com',
        },
      ],
    ]);
  });

  it('will emit save event for existing agencies', async () => {
    const wrapper = mount(EditAgency);
    await wrapper.setProps({ agency: TestAgencies[0] });
    await wrapper.get(NameInput).setValue('UA');
    await wrapper.get(LongNameInput).setValue('Updated Agency');
    await wrapper.get(WebsiteInput).setValue('https://www.agency.com');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          id: TestAgencies[0].id,
          logo: TestAgencies[0].logo,
          name: 'UA',
          longName: 'Updated Agency',
          website: 'https://www.agency.com',
        },
      ],
    ]);
  });

  it('will emit cancel event if the cancel button is pressed', async () => {
    const wrapper = mount(EditAgency);
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toBeDefined();
  });

  it('will disable form if isSaving prop is set', async () => {
    const wrapper = mount(EditAgency);
    await wrapper.setProps({ isSaving: true });
    expect(
      wrapper.get<HTMLFieldSetElement>('fieldset').attributes('disabled'),
    ).toBeDefined();
  });
});
