import {
  ApiClient,
  ApiList,
  BuddyType,
  LogEntrySignatureDTO,
  ProfessionalAssociationDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import SignEntry from 'src/components/logbook/sign-entry.vue';
import { useCurrentUser } from 'src/store';
import { TestAgencies } from 'tests/fixtures/agencies';
import { MinimalLogEntry } from 'tests/fixtures/log-entries';
import { BasicUser } from 'tests/fixtures/users';

const TestAssociations: ApiList<ProfessionalAssociationDTO> = {
  data: [
    {
      agency: TestAgencies[0],
      id: '229af271-5712-493d-a0fd-ca381cc43d0e',
      identificationNumber: '123456',
      title: 'Assistant Instructor',
    },
    {
      agency: TestAgencies[1],
      id: '53ef9715-b9b7-4a02-92c0-755bed1beb55',
      identificationNumber: '654321',
      title: 'Dive Master',
    },
  ],
  totalCount: 2,
};

const AlreadySignedMessage = '[data-testid="msg-entry-signed"]';
const AssociationSelect = 'select#association';
const SignAsSelect = 'select#sign-as';
const AgencySelect = 'select#agency';
const CertificationNumberInput = 'input#identification-number';
const SignButton = '#btn-sign';
const CancelButton = '#btn-cancel';

describe('SignEntry component', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof SignEntry>;

  let listAgenciesSpy: jest.SpyInstance;
  let listProfessionalAssociationsSpy: jest.SpyInstance;
  let logEntrySignatureExistsSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        entry: MinimalLogEntry,
      },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
    listAgenciesSpy = jest
      .spyOn(client.certifications, 'listAgencies')
      .mockResolvedValue({
        data: TestAgencies,
        totalCount: TestAgencies.length,
      });
    listProfessionalAssociationsSpy = jest
      .spyOn(client.certifications, 'listProfessionalAssociations')
      .mockResolvedValue(TestAssociations);
    logEntrySignatureExistsSpy = jest
      .spyOn(client.logEntries, 'logEntrySignatureExists')
      .mockResolvedValue(false);
    currentUser.user = BasicUser;
  });

  it('will request relevant data when mounted', async () => {
    mount(SignEntry, opts);
    await flushPromises();
    expect(listAgenciesSpy).toHaveBeenCalled();
    expect(listProfessionalAssociationsSpy).toHaveBeenCalledWith(
      BasicUser.username,
    );
    expect(logEntrySignatureExistsSpy).toHaveBeenCalledWith(
      MinimalLogEntry.creator.username,
      MinimalLogEntry.id,
      BasicUser.username,
    );
  });

  it('will allow user to sign entry as a buddy', async () => {
    const expected = {
      buddy: BasicUser.profile,
      id: 'af2826d9-7afd-4396-a616-5afa26e6c9bd',
      signedOn: Date.now(),
      type: BuddyType.Buddy,
    };
    const spy = jest
      .spyOn(client.logEntries, 'signLogEntry')
      .mockResolvedValue(expected);
    const wrapper = mount(SignEntry, opts);
    await flushPromises();

    await wrapper.get(SignAsSelect).setValue(BuddyType.Buddy);
    await wrapper.get(SignButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      MinimalLogEntry.creator.username,
      MinimalLogEntry.id,
      BasicUser.username,
      { buddyType: BuddyType.Buddy },
    );

    expect(wrapper.get(AlreadySignedMessage).isVisible()).toBe(true);
    expect(wrapper.find(SignButton).exists()).toBe(false);
    expect(wrapper.emitted('signed')).toEqual([[expected]]);
  });

  it('will allow a user to sign entry using a saved professional association', async () => {
    const expected: LogEntrySignatureDTO = {
      buddy: BasicUser.profile,
      id: 'aa4b2dd7-54c8-4b6b-96cd-a920904221cc',
      signedOn: Date.now(),
      type: BuddyType.Instructor,
      agency: TestAssociations.data[0].agency,
      certificationNumber: TestAssociations.data[0].identificationNumber,
    };
    const spy = jest
      .spyOn(client.logEntries, 'signLogEntry')
      .mockResolvedValue(expected);
    const wrapper = mount(SignEntry, opts);
    await flushPromises();

    await wrapper.get(SignAsSelect).setValue(BuddyType.Instructor);
    await wrapper.get(AssociationSelect).setValue(TestAssociations.data[0].id);
    await wrapper.get(SignButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      MinimalLogEntry.creator.username,
      MinimalLogEntry.id,
      BasicUser.username,
      {
        buddyType: BuddyType.Instructor,
        agency: TestAssociations.data[0].agency.id,
        certificationNumber: TestAssociations.data[0].identificationNumber,
      },
    );

    expect(wrapper.get(AlreadySignedMessage).isVisible()).toBe(true);
    expect(wrapper.find(SignButton).exists()).toBe(false);
  });

  it('will allow user to sign using custom professional association', async () => {
    const expected: LogEntrySignatureDTO = {
      buddy: BasicUser.profile,
      id: 'aa4b2dd7-54c8-4b6b-96cd-a920904221cc',
      signedOn: Date.now(),
      type: BuddyType.Divemaster,
      agency: TestAgencies[2],
      certificationNumber: 'abcd1234',
    };
    const spy = jest
      .spyOn(client.logEntries, 'signLogEntry')
      .mockResolvedValue(expected);
    const wrapper = mount(SignEntry, opts);
    await flushPromises();

    await wrapper.get(SignAsSelect).setValue(BuddyType.Divemaster);
    await wrapper.get(AssociationSelect).setValue('');
    await wrapper.get(AgencySelect).setValue(TestAgencies[2].id);
    await wrapper
      .get(CertificationNumberInput)
      .setValue(expected.certificationNumber);
    await wrapper.get(SignButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      MinimalLogEntry.creator.username,
      MinimalLogEntry.id,
      BasicUser.username,
      {
        buddyType: BuddyType.Divemaster,
        agency: TestAgencies[2].id,
        certificationNumber: expected.certificationNumber,
      },
    );

    expect(wrapper.get(AlreadySignedMessage).isVisible()).toBe(true);
    expect(wrapper.find(SignButton).exists()).toBe(false);
  });

  it('will validate missing credentials', async () => {
    const spy = jest.spyOn(client.logEntries, 'signLogEntry');
    const wrapper = mount(SignEntry, opts);
    await flushPromises();

    await wrapper.get(SignAsSelect).setValue(BuddyType.Divemaster);
    await wrapper.get(AssociationSelect).setValue('');
    await wrapper.get(SignButton).trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="agency-error"]').text()).toBe(
      'Agency is required',
    );
    expect(
      wrapper.get('[data-testid="identification-number-error"]').text(),
    ).toBe('Identification # is required');
    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.find(AlreadySignedMessage).exists()).toBe(false);
  });

  it('will allow user to cancel signing', async () => {
    const wrapper = mount(SignEntry, opts);
    await flushPromises();
    await wrapper.setProps({ showCancel: true });
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toBeDefined();
  });
});
