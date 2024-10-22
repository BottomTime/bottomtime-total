import {
  ApiClient,
  DiveOperator,
  Fetcher,
  VerificationStatus,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import EditDiveOperator from '../../../../src/components/operators/edit-dive-operator.vue';
import { createRouter } from '../../../fixtures/create-router';
import {
  BlankDiveOperator,
  FullDiveOperator,
  PartialDiveOperator,
} from '../../../fixtures/dive-operators';

const ActiveToggle = 'input#operator-active';
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
const ChangeLocationButton = '[data-testid="btn-operator-location"]';
const SaveButton = '[data-testid="btn-save-operator"]';

const NameError = '[data-testid="operator-name-error"]';
const SlugError = '[data-testid="operator-slug-error"]';
const DescriptionError = '[data-testid="operator-description-error"]';
const LocationError = '[data-testid="operator-location-error"]';
const PhoneError = '[data-testid="operator-phone-error"]';
const EmailError = '[data-testid="operator-email-error"]';
const WebsiteError = '[data-testid="operator-website-error"]';

const VerifiedBadge = '[data-testid="operator-verified"]';
const UnverifiedMessage = '[data-testid="operator-unverified"]';
const VerificationRejectedMessage =
  '[data-testid="operator-verification-rejected"]';
const VerificationPendingMessage =
  '[data-testid="operator-verification-pending"]';
const RequestVerificationButton = '#btn-request-verification';

describe('EditDiveOperator component', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditDiveOperator>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
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

  it('will validate for missing fields', async () => {
    jest.spyOn(client.diveOperators, 'isSlugAvailable').mockResolvedValue(true);
    const wrapper = mount(EditDiveOperator, opts);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(NameError).text()).toBe('Name of dive shop is required');
    expect(wrapper.get(SlugError).text()).toBe('URL shortcut is required');
    expect(wrapper.get(DescriptionError).text()).toBe(
      'Shop description is required',
    );
    expect(wrapper.get(LocationError).text()).toBe('Shop address is required');
    expect(wrapper.get(PhoneError).text()).toBe(
      'Shop phone number is required',
    );
    expect(wrapper.get(EmailError).text()).toBe('Shop email is required');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate for invalid fields', async () => {
    jest.spyOn(client.diveOperators, 'isSlugAvailable').mockResolvedValue(true);
    const wrapper = mount(EditDiveOperator, opts);
    await wrapper.get(EmailInput).setValue('not an email');
    await wrapper.get(PhoneInput).setValue('not a phone #');
    await wrapper.get(SlugInput).setValue('not?valid/at#all');
    await wrapper.get(WebsiteInput).setValue('not a URL');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(EmailError).text()).toBe(
      'Must be a valid email address',
    );
    expect(wrapper.get(PhoneError).text()).toBe(
      'Must be a valid phone number, including country code and area code',
    );
    expect(wrapper.get(SlugError).text()).toBe(
      'Only letters, numbers, and URL-safe characters are allowed',
    );
    expect(wrapper.get(WebsiteError).text()).toBe('Must be a valid URL');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate for slug conflicts', async () => {
    jest
      .spyOn(client.diveOperators, 'isSlugAvailable')
      .mockResolvedValue(false);
    const wrapper = mount(EditDiveOperator, {
      ...opts,
      props: {
        operator: PartialDiveOperator,
      },
    });
    await wrapper.get(SlugInput).setValue('new-slug-that-is-taken');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(SlugError).text()).toBe('Website URL is already taken');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will not block on slug validation if it is not changed', async () => {
    jest
      .spyOn(client.diveOperators, 'isSlugAvailable')
      .mockResolvedValue(false);
    const wrapper = mount(EditDiveOperator, {
      ...opts,
      props: {
        operator: FullDiveOperator,
      },
    });
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeDefined();
  });

  it('will emit "save" event when validation passes', async () => {
    jest.spyOn(client.diveOperators, 'isSlugAvailable').mockResolvedValue(true);
    const wrapper = mount(EditDiveOperator, opts);

    await wrapper.get(NameInput).setValue(FullDiveOperator.name);
    await wrapper.get(SlugInput).setValue(FullDiveOperator.slug);
    await wrapper.get(DescriptionInput).setValue(FullDiveOperator.description);
    await wrapper.get(ActiveToggle).setValue(false);
    await wrapper.get(ChangeLocationButton).trigger('click');
    await wrapper
      .get('[data-testid="address-dlg-address"]')
      .setValue(FullDiveOperator.address);
    await wrapper
      .get('[data-testid="address-dlg-lat"]')
      .setValue(FullDiveOperator.gps!.lat.toString());
    await wrapper
      .get('[data-testid="address-dlg-lon"]')
      .setValue(FullDiveOperator.gps!.lon.toString());
    await wrapper.get('[data-testid="address-dlg-confirm"]').trigger('click');
    await wrapper.get(PhoneInput).setValue(FullDiveOperator.phone);
    await wrapper.get(EmailInput).setValue(FullDiveOperator.email);
    await wrapper.get(WebsiteInput).setValue(FullDiveOperator.website);
    await wrapper
      .get(FacebookInput)
      .setValue(FullDiveOperator.socials!.facebook);
    await wrapper
      .get(InstagramInput)
      .setValue(FullDiveOperator.socials!.instagram);
    await wrapper.get(TikTokInput).setValue(FullDiveOperator.socials!.tiktok);
    await wrapper.get(TwitterInput).setValue(FullDiveOperator.socials!.twitter);
    await wrapper.get(YoutubeInput).setValue(FullDiveOperator.socials!.youtube);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          active: false,
          address: FullDiveOperator.address,
          description: FullDiveOperator.description,
          email: FullDiveOperator.email,
          gps: {
            lat: FullDiveOperator.gps!.lat,
            lon: FullDiveOperator.gps!.lon,
          },
          name: FullDiveOperator.name,
          phone: FullDiveOperator.phone,
          slug: FullDiveOperator.slug,
          socials: {
            facebook: FullDiveOperator.socials!.facebook,
            instagram: FullDiveOperator.socials!.instagram,
            tiktok: FullDiveOperator.socials!.tiktok,
            twitter: FullDiveOperator.socials!.twitter,
            youtube: FullDiveOperator.socials!.youtube,
          },
          website: FullDiveOperator.website,
        },
      ],
    ]);
  });

  it('will save changes to slug if user confirms it', async () => {
    const newSlug = 'new-slug';
    jest.spyOn(client.diveOperators, 'isSlugAvailable').mockResolvedValue(true);
    const wrapper = mount(EditDiveOperator, {
      ...opts,
      props: { operator: FullDiveOperator },
    });
    await wrapper.get(SlugInput).setValue(newSlug);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').isVisible()).toBe(true);
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeDefined();
  });

  it('will allow user to change their mind about saving changes to their slug', async () => {
    const newSlug = 'new-slug';
    jest.spyOn(client.diveOperators, 'isSlugAvailable').mockResolvedValue(true);
    const wrapper = mount(EditDiveOperator, {
      ...opts,
      props: { operator: FullDiveOperator },
    });
    await wrapper.get(SlugInput).setValue(newSlug);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog-modal"]').isVisible()).toBe(true);
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  describe('when dealing with verification', () => {
    it('will not show verification components for new operators that have not been saved yet', () => {
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: BlankDiveOperator,
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).exists()).toBe(false);
    });

    it('will show when an operator has not yet requested verification', () => {
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: {
            ...FullDiveOperator,
            verificationStatus: VerificationStatus.Unverified,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).isVisible()).toBe(true);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).isVisible()).toBe(true);
    });

    it('will show when an operator has been verified', () => {
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: {
            ...FullDiveOperator,
            verificationStatus: VerificationStatus.Verified,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).isVisible()).toBe(true);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).exists()).toBe(false);
    });

    it('will show when verification is pending', async () => {
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: {
            ...FullDiveOperator,
            verificationStatus: VerificationStatus.Pending,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).isVisible()).toBe(true);
      expect(wrapper.find(VerificationRejectedMessage).exists()).toBe(false);
      expect(wrapper.find(RequestVerificationButton).exists()).toBe(false);
    });

    it('will show when verification has been rejected (with reason)', async () => {
      const message = 'Omg! A message!!';
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: {
            ...FullDiveOperator,
            verificationStatus: VerificationStatus.Rejected,
            verificationMessage: message,
          },
        },
      });
      expect(wrapper.find(VerifiedBadge).exists()).toBe(false);
      expect(wrapper.find(UnverifiedMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationPendingMessage).exists()).toBe(false);
      expect(wrapper.find(VerificationRejectedMessage).isVisible()).toBe(true);
      expect(wrapper.find(RequestVerificationButton).isVisible()).toBe(true);
      expect(
        wrapper.find('[data-testid="verification-rejection-message"]').text(),
      ).toBe(message);
    });

    it('will allow a user to request verification', async () => {
      const operatorData = {
        ...FullDiveOperator,
        verificationStatus: VerificationStatus.Unverified,
        verificationMessage: undefined,
      };
      const operator = new DiveOperator(fetcher, operatorData);
      const wrapSpy = jest
        .spyOn(client.diveOperators, 'wrapDTO')
        .mockReturnValue(operator);
      const requestSpy = jest
        .spyOn(operator, 'requestVerification')
        .mockResolvedValue();
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: operatorData,
        },
      });

      await wrapper.get(RequestVerificationButton).trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(wrapSpy).toHaveBeenCalledWith(operatorData);
      expect(requestSpy).toHaveBeenCalled();
      expect(wrapper.emitted('verification-requested')).toEqual([
        [operatorData],
      ]);
    });

    it('will allow a user to cancel a request for verification', async () => {
      const operatorData = {
        ...FullDiveOperator,
        verificationStatus: VerificationStatus.Unverified,
        verificationMessage: undefined,
      };
      const operator = new DiveOperator(fetcher, operatorData);
      const wrapSpy = jest
        .spyOn(client.diveOperators, 'wrapDTO')
        .mockReturnValue(operator);
      const wrapper = mount(EditDiveOperator, {
        ...opts,
        props: {
          operator: operatorData,
        },
      });

      await wrapper.get(RequestVerificationButton).trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');
      await flushPromises();

      expect(wrapSpy).not.toHaveBeenCalled();
      expect(wrapper.emitted('verification-requested')).toBeUndefined();
    });
  });
});
