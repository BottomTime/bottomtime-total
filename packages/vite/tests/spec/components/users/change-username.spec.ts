import ChangeUsername from '@/components/users/change-username.vue';
import { mount } from '@vue/test-utils';

const Username = 'Claus53';

const Edit = '[data-testid="edit-username"]';
const Input = '[data-testid="username"]';
const Save = '[data-testid="save-username"]';
const Cancel = '[data-testid="cancel-save-username"]';

describe('Change Username component', () => {
  it('will render in non-edit mode', () => {
    const wrapper = mount(ChangeUsername, {
      props: { username: Username },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render in edit mode', () => {
    const wrapper = mount(ChangeUsername, {
      props: { username: Username, isEditing: true },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will disable form and show spinner while saving', () => {
    const wrapper = mount(ChangeUsername, {
      props: { username: Username, isEditing: true, isSaving: true },
    });
    const saveButton = wrapper.find(Save);
    expect(saveButton.attributes('disabled')).toBeDefined();
    expect(saveButton.html()).toMatchSnapshot();
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
  });

  // TODO: Test events and validation
});
