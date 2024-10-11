import { DiveOperatorDTO, LogBookSharing } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import EditDiveOperator from '../../../../src/components/operators/edit-dive-operator.vue';

const PartialDiveOperator: DiveOperatorDTO = {
  createdAt: new Date('2024-01-10T10:54:08.909Z'),
  description:
    'Aufero accendo amissio suffoco adulescens cruentus despecto vulgaris. Valens delego coma eius universe. Delicate suffragium auditor debilito.\nDolorum appositus vesper cinis vicissitudo vel cresco cibo brevis. Contabesco ulterius odit recusandae degero. Culpo animus adstringo dicta terebro eaque demo deporto defaeco.',
  updatedAt: new Date('2024-10-09T18:44:28.447Z'),
  address: '6713 Ritchie Key Apt. 697, Suffolk, LA, 43097',
  id: '06ba87ee-290b-4967-946e-43ccbb69a712',
  name: 'academic, squeaky osmosis',
  owner: {
    accountTier: 0,
    userId: '40991fd7-89a4-4e82-9e4d-e020bc654aaf',
    username: 'Clementine.Mann',
    memberSince: new Date('2019-02-21T08:13:47.222Z'),
    logBookSharing: LogBookSharing.Private,
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1184.jpg',
    location: 'Farmington Hills, IL, DK',
    name: 'Clementine Mann',
  },
  slug: 'academic-squeaky-osmosis',
  verified: false,
};

const FullDiveOperator: DiveOperatorDTO = {
  createdAt: new Date('2024-01-10T10:54:08.909Z'),
  description:
    'Aufero accendo amissio suffoco adulescens cruentus despecto vulgaris. Valens delego coma eius universe. Delicate suffragium auditor debilito.\nDolorum appositus vesper cinis vicissitudo vel cresco cibo brevis. Contabesco ulterius odit recusandae degero. Culpo animus adstringo dicta terebro eaque demo deporto defaeco.',
  email: 'Elizabeth_Ernser@hotmail.com',
  gps: { lat: 13.8568, lon: 54.6858 },
  id: '06ba87ee-290b-4967-946e-43ccbb69a712',
  name: 'academic, squeaky osmosis',
  owner: {
    accountTier: 0,
    userId: '40991fd7-89a4-4e82-9e4d-e020bc654aaf',
    username: 'Clementine.Mann',
    memberSince: new Date('2019-02-21T08:13:47.222Z'),
    logBookSharing: LogBookSharing.Private,
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1184.jpg',
    location: 'Farmington Hills, IL, DK',
    name: 'Clementine Mann',
  },
  socials: {
    facebook: 'Nestor34',
    instagram: 'Warren7',
    tiktok: 'Rickey.Steuber',
    twitter: 'Pierre_Rogahn',
    youtube: 'squeaky_osmosis',
  },
  updatedAt: new Date('2024-10-09T18:44:28.447Z'),
  address: '6713 Ritchie Key Apt. 697, Suffolk, LA, 43097',
  banner: 'https://picsum.photos/seed/Bth10FAmj/1024/256',
  logo: 'https://loremflickr.com/128/128?lock=1873198725464064',
  phone: '936.810.0307 x63779',
  slug: 'academic-squeaky-osmosis',
  verified: true,
  website: 'https://euphoric-controversy.com',
};

const NameInput = 'input#operator-name';
const SlugInput = 'input#operator-slug';
const DescriptionInput = 'textarea#operator-description';
const AddressText = '[data-testid="operator-address"]';
const GpsText = '[data-testid="operator-gps"]';
const PhoneInput = 'input#operator-phone';
const EmailInput = 'input#operator-email';
const WebsiteInput = 'input#operator-website';
const FacebookInput = 'input#operator-facebook';
const InstagramInput = 'input#operator-instagram';
const TikTokInput = 'input#operator-tiktok';
const TwitterInput = 'input#operator-twitter';
const YoutubeInput = 'input#operator-youtube';
const SaveButton = '[data-testid="btn-save-operator"]';

describe('EditDiveOperator component', () => {
  let opts: ComponentMountingOptions<typeof EditDiveOperator>;

  beforeEach(() => {
    opts = {
      global: {
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will render a blank operator', () => {
    const wrapper = mount(EditDiveOperator, opts);
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe('');
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe('');
    expect(wrapper.get<HTMLInputElement>(PhoneInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(EmailInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(FacebookInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(InstagramInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(TikTokInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(TwitterInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(YoutubeInput).element.value).toBe('');

    expect(wrapper.find(AddressText).exists()).toBe(false);
    expect(wrapper.find(GpsText).exists()).toBe(false);

    expect(wrapper.find(SaveButton).isVisible()).toBe(true);
  });

  it('will render an operator with required fields', () => {
    const wrapper = mount(EditDiveOperator, {
      ...opts,
      props: {
        operator: PartialDiveOperator,
      },
    });

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      PartialDiveOperator.name,
    );
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      PartialDiveOperator.slug,
    );
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe(PartialDiveOperator.description);
    expect(wrapper.get<HTMLInputElement>(PhoneInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(EmailInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(FacebookInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(InstagramInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(TikTokInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(TwitterInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(YoutubeInput).element.value).toBe('');

    expect(wrapper.find(AddressText).text()).toBe(PartialDiveOperator.address);
    expect(wrapper.find(GpsText).exists()).toBe(false);

    expect(wrapper.find(SaveButton).isVisible()).toBe(true);
  });

  it('will render an operator with all fields', () => {
    const wrapper = mount(EditDiveOperator, {
      ...opts,
      props: {
        operator: FullDiveOperator,
      },
    });

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      FullDiveOperator.name,
    );
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      FullDiveOperator.slug,
    );
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe(FullDiveOperator.description);
    expect(wrapper.get<HTMLInputElement>(PhoneInput).element.value).toBe(
      FullDiveOperator.phone,
    );
    expect(wrapper.get<HTMLInputElement>(EmailInput).element.value).toBe(
      FullDiveOperator.email,
    );
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe(
      FullDiveOperator.website,
    );
    expect(wrapper.get<HTMLInputElement>(FacebookInput).element.value).toBe(
      FullDiveOperator.socials!.facebook,
    );
    expect(wrapper.get<HTMLInputElement>(InstagramInput).element.value).toBe(
      FullDiveOperator.socials!.instagram,
    );
    expect(wrapper.get<HTMLInputElement>(TikTokInput).element.value).toBe(
      FullDiveOperator.socials!.tiktok,
    );
    expect(wrapper.get<HTMLInputElement>(TwitterInput).element.value).toBe(
      FullDiveOperator.socials!.twitter,
    );
    expect(wrapper.get<HTMLInputElement>(YoutubeInput).element.value).toBe(
      FullDiveOperator.socials!.youtube,
    );

    expect(wrapper.find(AddressText).text()).toBe(PartialDiveOperator.address);
    expect(wrapper.find(GpsText).text()).toBe(
      `${FullDiveOperator.gps!.lat}, ${FullDiveOperator.gps!.lon}`,
    );

    expect(wrapper.find(SaveButton).isVisible()).toBe(true);
  });

  // TODO: Test validation
  // TODO: Test editing/saving
});
