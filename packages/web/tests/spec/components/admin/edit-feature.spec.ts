import { FeatureDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import EditFeature from '../../../../src/components/admin/edit-feature.vue';

const Epoch = new Date(0);
const BlankFeature: FeatureDTO = {
  createdAt: Epoch,
  updatedAt: Epoch,
  enabled: false,
  key: '',
  name: '',
  description: '',
};

const TestFeature: FeatureDTO = {
  createdAt: new Date('2024-07-25T14:06:39Z'),
  updatedAt: new Date('2024-07-25T14:06:39Z'),
  enabled: true,
  key: 'test_key',
  name: 'Really Cool Feature',
  description: 'This is a really cool feature.',
};

const KeyInput = '#key';
const KeyText = '[data-testid="key-static"]';
const KeyError = '[data-testid="key-error"]';
const NameInput = '#name';
const NameError = '[data-testid="name-error"]';
const DescriptionInput = '#description';
const EnabledInput = '#enabled';
const SaveButton = '#save-feature';

describe('EditFeature component', () => {
  let opts: ComponentMountingOptions<typeof EditFeature>;

  beforeEach(() => {
    opts = {
      props: {
        isNew: true,
        feature: { ...BlankFeature },
      },
    };
  });

  it('will render the component for a new feature', () => {
    const wrapper = mount(EditFeature, opts);
    expect(wrapper.get<HTMLInputElement>(KeyInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe('');
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe('');
    expect(wrapper.get<HTMLInputElement>(EnabledInput).element.checked).toBe(
      false,
    );
  });

  it('will render for an existing feature', async () => {
    const wrapper = mount(EditFeature, {
      ...opts,
      props: {
        feature: { ...TestFeature },
        isNew: false,
      },
    });
    expect(wrapper.find(KeyInput).exists()).toBe(false);
    expect(wrapper.find(KeyText).text()).toBe(TestFeature.key);
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      TestFeature.name,
    );
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe(TestFeature.description);
    expect(wrapper.get<HTMLInputElement>(EnabledInput).element.checked).toBe(
      TestFeature.enabled,
    );
  });

  it('will validate missing fields', async () => {
    const wrapper = mount(EditFeature, opts);
    await wrapper.get(SaveButton).trigger('click');

    expect(wrapper.get(KeyError).text()).toBe('Feature flag key is required.');
    expect(wrapper.get(NameError).text()).toBe(
      'Feature flag name is required.',
    );
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate invalid fields', async () => {
    const wrapper = mount(EditFeature, opts);
    await wrapper.get(KeyInput).setValue('lol! Nope.');
    await wrapper.get(SaveButton).trigger('click');

    expect(wrapper.get(KeyError).text()).toBe('Feature flag key is invalid.');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it.todo('finish!');
});
