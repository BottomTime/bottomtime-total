import mockFetch from 'fetch-mock-jest';

import {
  AgencyDTO,
  CreateOrUpdateAgencyDTO,
  CreateOrUpdateProfessionalAssociationParamsDTO,
  Fetcher,
  ProfessionalAssociationDTO,
} from '../../src';
import { CertificationsApiClient } from '../../src/client/certifications';
import { TestAgencies } from '../fixtures/agencies';
import { TestAssociations } from '../fixtures/professional-associations';

const Username = 'test-user';
const Options: CreateOrUpdateAgencyDTO = {
  logo: 'https://www.agency.com/logo.png',
  name: 'MTA',
  longName: 'Mah Test Agency',
  website: 'https://www.agency.com',
};

describe('Certifications API Client', () => {
  let fetcher: Fetcher;
  let apiClient: CertificationsApiClient;

  beforeAll(() => {
    fetcher = new Fetcher();
    apiClient = new CertificationsApiClient(fetcher);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will list agencies', async () => {
    const expected = {
      data: TestAgencies,
      totalCount: TestAgencies.length,
    };
    mockFetch.get('/api/agencies', {
      status: 200,
      body: expected,
    });

    const actual = await apiClient.listAgencies();

    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will retrieve a single agency', async () => {
    mockFetch.get(`/api/agencies/${TestAgencies[0].id}`, TestAgencies[0]);
    const actual = await apiClient.getAgency(TestAgencies[0].id);
    expect(actual).toEqual(TestAgencies[0]);
    expect(mockFetch.done()).toBe(true);
  });

  it('will create an agency', async () => {
    const expected: AgencyDTO = {
      ...Options,
      id: '205025ad-650f-411a-84fe-46266cf8650c',
    };
    mockFetch.post(
      {
        url: '/api/admin/agencies',
        body: Options,
      },
      {
        status: 201,
        body: expected,
      },
    );
    const actual = await apiClient.createAgency(Options);
    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will update an existing agency', async () => {
    const expected: AgencyDTO = {
      ...TestAgencies[0],
      ...Options,
    };
    mockFetch.put(
      {
        url: `/api/admin/agencies/${TestAgencies[0].id}`,
        body: Options,
      },
      {
        status: 200,
        body: expected,
      },
    );
    const actual = await apiClient.updateAgency(TestAgencies[0].id, Options);
    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will delete an agency', async () => {
    const id = '06dd30d1-ccdb-4b03-8425-fc50883e6538';
    mockFetch.delete(`/api/admin/agencies/${id}`, 204);
    await apiClient.deleteAgency(id);
    expect(mockFetch.done()).toBe(true);
  });

  it('will list professional associations', async () => {
    const expected = {
      data: TestAssociations,
      totalCount: TestAssociations.length,
    };
    mockFetch.get(`/api/users/${Username}/professionalAssociations`, {
      status: 200,
      body: expected,
    });

    const actual = await apiClient.listProfessionalAssociations(Username);

    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will create a professional association', async () => {
    const options: CreateOrUpdateProfessionalAssociationParamsDTO = {
      agency: TestAgencies[0].id,
      identificationNumber: '123456',
      title: 'Instructor',
      startDate: '2018-01-12',
    };
    const expected: ProfessionalAssociationDTO = {
      ...options,
      id: 'd10cd4d0-2582-45cf-baa2-0789933fb79e',
      agency: TestAgencies[0],
    };
    mockFetch.post(
      {
        url: `/api/users/${Username}/professionalAssociations`,
        body: options,
      },
      {
        status: 201,
        body: expected,
      },
    );

    const actual = await apiClient.createProfessionalAssociation(
      Username,
      options,
    );

    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will update an existing professional association', async () => {
    const options: CreateOrUpdateProfessionalAssociationParamsDTO = {
      agency: TestAgencies[1].id,
      identificationNumber: '0118999881999119725-3',
      title: 'Assistant Instructor',
    };
    const expected: ProfessionalAssociationDTO = {
      ...TestAssociations[0],
      ...options,
      agency: TestAgencies[1],
    };
    mockFetch.put(
      {
        url: `/api/users/${Username}/professionalAssociations/${TestAssociations[0].id}`,
        body: options,
      },
      {
        status: 200,
        body: expected,
      },
    );

    const actual = await apiClient.updateProfessionalAssociation(
      Username,
      TestAssociations[0].id,
      options,
    );

    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a professional association', async () => {
    mockFetch.delete(
      `/api/users/${Username}/professionalAssociations/${TestAssociations[0].id}`,
      204,
    );
    await apiClient.deleteProfessionalAssociation(
      Username,
      TestAssociations[0].id,
    );
    expect(mockFetch.done()).toBe(true);
  });
});
