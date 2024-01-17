import { Certification } from '../../../src/certifications';
import {
  CertificationDocument,
  CertificationModel,
} from '../../../src/schemas';

describe('Certification Class', () => {
  let data: CertificationDocument;

  beforeEach(() => {
    data = new CertificationModel({
      _id: '4659CA3E-46C4-4865-B2A2-B9CC16818ED6',
      agency: 'PADI',
      course: 'Open Water Diver',
    });
  });

  it('will return properties correctly', () => {
    const cert = new Certification(data);
    expect(cert.id).toEqual(data._id);
    expect(cert.agency).toEqual(data.agency);
    expect(cert.course).toEqual(data.course);
  });

  it('will update properties correctly', () => {
    const cert = new Certification(data);
    cert.agency = 'SSI';
    cert.course = 'Advanced Open Water Diver';
    expect(cert.agency).toEqual('SSI');
    expect(cert.course).toEqual('Advanced Open Water Diver');
  });

  it('will render class to JSON correctly', () => {
    const cert = new Certification(data);
    expect(cert.toJSON()).toEqual({
      id: data._id,
      agency: data.agency,
      course: data.course,
    });
  });

  it('will save a new certification to the database', async () => {
    const cert = new Certification(data);
    await cert.save();

    const result = await CertificationModel.findById(data._id);
    expect(result?.toJSON()).toEqual(data.toJSON());
  });

  it('will save changes to properties', async () => {
    await data.save();
    const cert = new Certification(data);
    cert.agency = 'SSI';
    cert.course = 'Advanced Open Water Diver';
    await cert.save();

    const result = await CertificationModel.findById(data._id);
    expect(result?.toJSON()).toEqual({
      __v: 0,
      _id: data._id,
      agency: 'SSI',
      course: 'Advanced Open Water Diver',
    });
  });
});
