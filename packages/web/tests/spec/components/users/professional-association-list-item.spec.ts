import { ProfessionalAssociationDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import ProfessionalAssociationListItem from 'src/components/users/professional-association-list-item.vue';
import { TestAgencies } from 'tests/fixtures/agencies';

const TestAssociation: ProfessionalAssociationDTO = {
  agency: TestAgencies[0],
  id: '078ef22c-1380-459d-a9c4-7b1ac296298c',
  identificationNumber: '123456',
  title: 'Assistant Instructor',
  startDate: '2021-01-01',
};

describe('ProfessionalAssociationListItem component', () => {
  let opts: ComponentMountingOptions<typeof ProfessionalAssociationListItem>;

  beforeEach(() => {
    opts = {
      props: {
        association: TestAssociation,
      },
    };
  });

  it('will render association', () => {
    const wrapper = mount(ProfessionalAssociationListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit event when edit button is clicked', async () => {
    const wrapper = mount(ProfessionalAssociationListItem, opts);
    await wrapper
      .find(`[data-testid="edit-assoc-${TestAssociation.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[TestAssociation]]);
  });

  it('will emit event when delete button is clicked', async () => {
    const wrapper = mount(ProfessionalAssociationListItem, opts);
    await wrapper
      .find(`[data-testid="delete-assoc-${TestAssociation.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[TestAssociation]]);
  });
});
