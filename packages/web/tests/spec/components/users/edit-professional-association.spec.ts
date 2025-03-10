import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import EditProfessionalAssociation from 'src/components/users/edit-professional-association.vue';
import { TestAgencies } from 'tests/fixtures/agencies';

const AgencySelect = 'select#agency';
const IdentifierInput = 'input#professional-id';
const TitleInput = 'input#title';
const StartDateInput = {
  Year: 'select#start-date-year',
  Month: 'select#start-date-month',
  Day: 'select#start-date-day',
} as const;
const SaveButton = 'button#btn-save-assoc';
const CancelButton = 'button#btn-cancel-assoc';

const ProfessionalId = '123456-XYZ';
const Title = 'Assistant Instructor';

describe('ProfessionalAssociationListItem component', () => {
  let opts: ComponentMountingOptions<typeof EditProfessionalAssociation>;

  beforeEach(() => {
    opts = {
      props: {
        agencies: TestAgencies,
      },
    };
  });

  it('will allow a user to create a new association', async () => {
    const wrapper = mount(EditProfessionalAssociation, opts);
    await wrapper.get(AgencySelect).setValue(TestAgencies[1].id);
    await wrapper.get(IdentifierInput).setValue(ProfessionalId);
    await wrapper.get(TitleInput).setValue(Title);
    await wrapper.get(StartDateInput.Year).setValue('2022');
    await wrapper.get(StartDateInput.Month).setValue('08');
    await wrapper.get(StartDateInput.Day).setValue('13');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          agency: TestAgencies[1],
          id: '',
          identificationNumber: ProfessionalId,
          title: Title,
          startDate: '2022-08-13',
        },
      ],
    ]);
  });

  it('will allow a user to update an existing association', async () => {
    const expectedId = '6c060cf2-3a6e-48e7-9cbe-7eb852271735';
    const wrapper = mount(EditProfessionalAssociation, opts);
    await wrapper.setProps({
      association: {
        agency: TestAgencies[2],
        id: expectedId,
        identificationNumber: 'abcd1223',
        title: 'Dive Master',
        startDate: '2021-01-01',
      },
    });

    await wrapper.get(AgencySelect).setValue(TestAgencies[1].id);
    await wrapper.get(IdentifierInput).setValue(ProfessionalId);
    await wrapper.get(TitleInput).setValue(Title);
    await wrapper.get(StartDateInput.Year).setValue('2022');
    await wrapper.get(StartDateInput.Month).setValue('08');
    await wrapper.get(StartDateInput.Day).setValue('13');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          agency: TestAgencies[1],
          id: expectedId,
          identificationNumber: ProfessionalId,
          title: Title,
          startDate: '2022-08-13',
        },
      ],
    ]);
  });

  it('will allow a user to cancel editing an association', async () => {
    const wrapper = mount(EditProfessionalAssociation, opts);
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toBeDefined();
  });

  it('will validate entries before saving', async () => {
    const wrapper = mount(EditProfessionalAssociation, opts);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="agency-error"]').text()).toBe(
      'Agency is required',
    );
    expect(wrapper.get('[data-testid="professional-id-error"]').text()).toBe(
      'Professional ID/# is required',
    );
    expect(wrapper.get('[data-testid="title-error"]').text()).toBe(
      'Title is required',
    );
    expect(wrapper.emitted('save')).toBeUndefined();
  });
});
