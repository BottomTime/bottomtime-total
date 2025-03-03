import {
  ApiClient,
  CreateOrUpdateOperatorDTO,
  ListAvatarURLsResponseDTO,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Mock } from 'moq.ts';
import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import { Coordinates } from 'src/common';
import FormLocationPicker from 'src/components/common/form-location-picker.vue';
import UploadImageDialog from 'src/components/dialog/upload-image-dialog.vue';
import EditOperatorInfo from 'src/components/operators/editor/edit-operator-info.vue';
import { ConfirmDialog } from 'tests/constants';
import {
  BlankOperator,
  FullOperator,
  PartialOperator,
} from 'tests/fixtures/operators';

const NameInput = '#operator-name';
const SlugInput = '#operator-slug';
const DescriptionInput = '#operator-description';
const ActiveInput = '#operator-active';
const AddressInput = '#operator-address';
const GpsText = '[data-testid="location-picker-gps"]';
const PhoneInput = '#operator-phone';
const EmailInput = '#operator-email';
const WebsiteInput = '#operator-website';

const FacebookInput = '#operator-facebook';
const TwitterInput = '#operator-twitter';
const InstagramInput = '#operator-instagram';
const YoutubeInput = '#operator-youtube';
const TiktokInput = '#operator-tiktok';

const NameError = '[data-testid="operator-name-error"]';
const SlugError = '[data-testid="operator-slug-error"]';
const DescriptionError = '[data-testid="operator-description-error"]';
const AddressError = '[data-testid="operator-address-error"]';
const PhoneError = '[data-testid="operator-phone-error"]';
const EmailError = '[data-testid="operator-email-error"]';
const WebsiteError = '[data-testid="operator-website-error"]';

const SaveButton = '#btn-save-operator';

const UploadLogoButton = '#btn-upload-logo';
const ChangeLogoButton = '#btn-change-logo';
const RemoveLogoButton = '#btn-delete-logo';

describe('EditOperatorInfo component', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditOperatorInfo>;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      props: {
        operator: BlankOperator,
      },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    jest.spyOn(client.operators, 'isSlugAvailable').mockResolvedValue(true);
  });

  it('will render correctly with all properties set', async () => {
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: FullOperator });
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      FullOperator.name,
    );
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      FullOperator.slug,
    );
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe(FullOperator.description);
    expect(wrapper.get<HTMLInputElement>(ActiveInput).element.checked).toBe(
      FullOperator.active,
    );
    expect(wrapper.get<HTMLInputElement>(AddressInput).element.value).toBe(
      FullOperator.address,
    );
    expect(wrapper.get(GpsText).text()).toMatchSnapshot();
    expect(wrapper.get<HTMLInputElement>(PhoneInput).element.value).toBe(
      FullOperator.phone,
    );
    expect(wrapper.get<HTMLInputElement>(EmailInput).element.value).toBe(
      FullOperator.email,
    );
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe(
      FullOperator.website,
    );
    expect(wrapper.get<HTMLInputElement>(FacebookInput).element.value).toBe(
      FullOperator.socials!.facebook,
    );
    expect(wrapper.get<HTMLInputElement>(TwitterInput).element.value).toBe(
      FullOperator.socials!.twitter,
    );
    expect(wrapper.get<HTMLInputElement>(InstagramInput).element.value).toBe(
      FullOperator.socials!.instagram,
    );
    expect(wrapper.get<HTMLInputElement>(YoutubeInput).element.value).toBe(
      FullOperator.socials!.youtube,
    );
    expect(wrapper.get<HTMLInputElement>(TiktokInput).element.value).toBe(
      FullOperator.socials!.tiktok,
    );
  });

  it('will render correctly if optional properties are omitted', async () => {
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: PartialOperator });
    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      PartialOperator.name,
    );
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      PartialOperator.slug,
    );
    expect(
      wrapper.get<HTMLTextAreaElement>(DescriptionInput).element.value,
    ).toBe(PartialOperator.description);
    expect(wrapper.get<HTMLInputElement>(ActiveInput).element.checked).toBe(
      PartialOperator.active,
    );
    expect(wrapper.get<HTMLInputElement>(AddressInput).element.value).toBe(
      PartialOperator.address,
    );
    expect(wrapper.get(GpsText).text()).toMatchSnapshot();
    expect(wrapper.get<HTMLInputElement>(PhoneInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(EmailInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WebsiteInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(FacebookInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(TwitterInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(InstagramInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(YoutubeInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(TiktokInput).element.value).toBe('');
  });

  it('will automatically generate a slug when the name changes', async () => {
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.get(NameInput).setValue('New Name New Shop #33');
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      'new-name-new-shop-33',
    );
  });

  it('will not automatically generate a slug if the user has manually changed it', async () => {
    const slug = 'new-slug';
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.get(SlugInput).setValue(slug);
    await wrapper.get(NameInput).setValue('New Name New Shop #33');
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(slug);
  });

  it('will not automatically generate a new slug if the operator has already been saved', async () => {
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: FullOperator });
    await wrapper.get(NameInput).setValue('New Name New Shop #33');
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      FullOperator.slug,
    );
  });

  it('will validate for missing fields', async () => {
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.get(NameError).text()).toBe('Name of dive shop is required');
    expect(wrapper.get(SlugError).text()).toBe('URL shortcut is required');
    expect(wrapper.get(DescriptionError).text()).toBe(
      'Shop description is required',
    );
    expect(wrapper.get(AddressError).text()).toBe('Shop address is required');
    expect(wrapper.get(PhoneError).text()).toBe(
      'Shop phone number is required',
    );
    expect(wrapper.get(EmailError).text()).toBe('Shop email is required');
  });

  it('will validate invalid fields', async () => {
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.get(EmailInput).setValue('not-an-email');
    await wrapper.get(PhoneInput).setValue('not a phone number');
    await wrapper.get(SlugInput).setValue('Definitely, not valid!');
    await wrapper.get(WebsiteInput).setValue('not a valid URL');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(SlugError).text()).toBe(
      'Only letters, numbers, and URL-safe characters are allowed',
    );
    expect(wrapper.get(PhoneError).text()).toBe(
      'Must be a valid phone number, including country code and area code',
    );
    expect(wrapper.get(EmailError).text()).toBe(
      'Must be a valid email address',
    );
    expect(wrapper.get(WebsiteError).text()).toBe('Must be a valid URL');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate if a slug is already in use', async () => {
    jest.spyOn(client.operators, 'isSlugAvailable').mockResolvedValue(false);
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.get(SlugInput).setValue('already-taken');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(SlugError).text()).toBe('Website URL is already taken');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will save a new operator', async () => {
    const expected: CreateOrUpdateOperatorDTO = {
      active: false,
      address: '1234 Main St',
      description: 'Mah newest awesome shop',
      name: "Bob's Awesome Shop",
      gps: {
        lat: 17.89438,
        lon: -77.40493,
      },
      phone: '+1 (555) 555-5555',
      email: 'bob@funtimeshop.ca',
      website: 'https://funtimeshop.ca',
      socials: {
        facebook: 'funtimeshop',
        twitter: 'funtimeshop',
        instagram: 'funtimeshop',
        youtube: 'funtimeshop',
        tiktok: 'funtimeshop',
      },
      slug: 'bobs-awesome-shop',
    };
    const wrapper = mount(EditOperatorInfo, opts);

    await wrapper.get(ActiveInput).setValue(expected.active);
    await wrapper.get(AddressInput).setValue(expected.address);
    await wrapper.get(DescriptionInput).setValue(expected.description);
    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(GpsText).trigger('click');
    await wrapper.get(PhoneInput).setValue(expected.phone);
    await wrapper.get(EmailInput).setValue(expected.email);
    await wrapper.get(WebsiteInput).setValue(expected.website);
    await wrapper.get(FacebookInput).setValue(expected.socials!.facebook);
    await wrapper.get(TwitterInput).setValue(expected.socials!.twitter);
    await wrapper.get(InstagramInput).setValue(expected.socials!.instagram);
    await wrapper.get(YoutubeInput).setValue(expected.socials!.youtube);
    await wrapper.get(TiktokInput).setValue(expected.socials!.tiktok);
    wrapper
      .getComponent(FormLocationPicker)
      .vm.$emit('update:modelValue', expected.gps);

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([[expected]]);
  });

  it('will update an existing operator', async () => {
    const expected: CreateOrUpdateOperatorDTO = {
      active: false,
      address: '1234 Main St',
      description: 'Mah newest awesome shop',
      name: "Bob's Awesome Shop",
      gps: {
        lat: 17.89438,
        lon: -77.40493,
      },
      phone: '+1 (555) 555-5555',
      email: 'bob@funtimeshop.ca',
      website: 'https://funtimeshop.ca',
      socials: {
        facebook: 'funtimeshop',
        twitter: 'funtimeshop',
        instagram: 'funtimeshop',
        youtube: 'funtimeshop',
        tiktok: 'funtimeshop',
      },
      slug: 'bobs-awesome-shop',
    };
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: PartialOperator });

    await wrapper.get(ActiveInput).setValue(expected.active);
    await wrapper.get(AddressInput).setValue(expected.address);
    await wrapper.get(DescriptionInput).setValue(expected.description);
    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(GpsText).trigger('click');
    await wrapper.get(PhoneInput).setValue(expected.phone);
    await wrapper.get(EmailInput).setValue(expected.email);
    await wrapper.get(WebsiteInput).setValue(expected.website);
    await wrapper.get(FacebookInput).setValue(expected.socials!.facebook);
    await wrapper.get(TwitterInput).setValue(expected.socials!.twitter);
    await wrapper.get(InstagramInput).setValue(expected.socials!.instagram);
    await wrapper.get(YoutubeInput).setValue(expected.socials!.youtube);
    await wrapper.get(TiktokInput).setValue(expected.socials!.tiktok);
    wrapper
      .getComponent(FormLocationPicker)
      .vm.$emit('update:modelValue', expected.gps);

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          ...expected,
          slug: PartialOperator.slug,
        },
      ],
    ]);
  });

  it('will confirm if user wants to change the URL slug', async () => {
    const slug = 'new-slug';
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: FullOperator });

    await wrapper.get(SlugInput).setValue(slug);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();
    await wrapper.get(ConfirmDialog.Confirm).trigger('click');

    expect(wrapper.emitted('save')).toHaveLength(1);
    expect(wrapper.emitted('save')![0][0]).toMatchObject({ slug });
  });

  it('will allow a user to change their mind about changing the slug', async () => {
    const slug = 'new-slug';
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: FullOperator });
    await wrapper.get(SlugInput).setValue(slug);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    await wrapper.get(ConfirmDialog.Cancel).trigger('click');
    expect(wrapper.find(ConfirmDialog.Cancel).exists()).toBe(false);

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.get<HTMLInputElement>(SlugInput).element.value).toBe(
      FullOperator.slug,
    );
  });

  it('will allow a user to set the logo', async () => {
    const urls: ListAvatarURLsResponseDTO = {
      root: 'https://cdn.bottomtime.ca',
      sizes: {
        '128x128': '/operators/1/logo-128x128.png',
        '256x256': '/operators/1/logo-256x256.png',
        '32x32': '/operators/1/logo-32x32.png',
        '64x64': '/operators/1/logo-64x64.png',
      },
    };
    const saveSpy = jest
      .spyOn(client.operators, 'uploadLogo')
      .mockResolvedValue(urls);
    const image: File = new Mock<File>().object();
    const coordinates: Coordinates = {
      height: 256,
      width: 256,
      left: 0,
      top: 0,
    };

    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: PartialOperator });
    await flushPromises();
    await wrapper.get(UploadLogoButton).trigger('click');
    await wrapper
      .getComponent(UploadImageDialog)
      .vm.$emit('save', image, coordinates);
    await flushPromises();

    expect(wrapper.emitted('logo-changed')).toEqual([[urls.root]]);
    expect(saveSpy).toHaveBeenCalledWith(PartialOperator, image, coordinates);
  });

  it('will allow a user to change the logo', async () => {
    const urls: ListAvatarURLsResponseDTO = {
      root: 'https://cdn.bottomtime.ca',
      sizes: {
        '128x128': '/operators/1/logo-128x128.png',
        '256x256': '/operators/1/logo-256x256.png',
        '32x32': '/operators/1/logo-32x32.png',
        '64x64': '/operators/1/logo-64x64.png',
      },
    };
    const saveSpy = jest
      .spyOn(client.operators, 'uploadLogo')
      .mockResolvedValue(urls);
    const image: File = new Mock<File>().object();
    const coordinates: Coordinates = {
      height: 256,
      width: 256,
      left: 0,
      top: 0,
    };

    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: FullOperator });
    await flushPromises();
    await wrapper.get(ChangeLogoButton).trigger('click');
    await wrapper
      .getComponent(UploadImageDialog)
      .vm.$emit('save', image, coordinates);
    await flushPromises();

    expect(wrapper.emitted('logo-changed')).toEqual([[urls.root]]);
    expect(saveSpy).toHaveBeenCalledWith(FullOperator, image, coordinates);
  });

  it('will allow a user to remove a logo', async () => {
    const deleteSpy = jest
      .spyOn(client.operators, 'deleteLogo')
      .mockResolvedValue();
    const wrapper = mount(EditOperatorInfo, opts);
    await wrapper.setProps({ operator: FullOperator });
    await wrapper.get(RemoveLogoButton).trigger('click');
    await wrapper.get(ConfirmDialog.Confirm).trigger('click');
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledWith(FullOperator.slug);
    expect(wrapper.emitted('logo-changed')).toEqual([[undefined]]);
    expect(wrapper.find(ConfirmDialog.Confirm).exists()).toBe(false);
    expect(wrapper.find(RemoveLogoButton).exists()).toBe(false);
    expect(wrapper.get(UploadLogoButton).isVisible()).toBe(true);
  });
});
