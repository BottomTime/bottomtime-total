import { ComponentMountingOptions, mount } from '@vue/test-utils';

import RequestSignaturesDialog from 'src/components/dialog/request-signatures-dialog.vue';
import { MinimalLogEntry } from 'tests/fixtures/log-entries';

const DialogModal = '[data-testid="dialog-modal"]';
const CloseButton = '[data-testid="btn-close-request-signatures"]';
const SignatureUrl = '[data-testid="lnk-copy-signature-url"]';

describe('RequestSignaturesDialog component', () => {
  let opts: ComponentMountingOptions<typeof RequestSignaturesDialog>;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    opts = {
      props: {
        logEntry: MinimalLogEntry,
        visible: true,
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    };
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render with QR code and link', () => {
    const wrapper = mount(RequestSignaturesDialog, opts);
    expect(wrapper.get<HTMLCanvasElement>('canvas').isVisible()).toBe(true);
    expect(wrapper.get(SignatureUrl).text()).toBe(
      `http://localhost:4850/logbook/${MinimalLogEntry.creator.username}/${MinimalLogEntry.id}/sign`,
    );
  });

  it('will copy URL if link is clicked', async () => {
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    const wrapper = mount(RequestSignaturesDialog, opts);
    await wrapper.get(SignatureUrl).trigger('click');
    expect(writeText).toHaveBeenCalledWith(
      `http://localhost:4850/logbook/${MinimalLogEntry.creator.username}/${MinimalLogEntry.id}/sign`,
    );
  });

  it('will remain hidden if "visible" property is false', async () => {
    const wrapper = mount(RequestSignaturesDialog, opts);
    await wrapper.setProps({ visible: false });
    expect(wrapper.find(DialogModal).exists()).toBe(false);
  });

  it('will emit close event when the "Close" button is clicked', async () => {
    const wrapper = mount(RequestSignaturesDialog, opts);
    await wrapper.get(CloseButton).trigger('click');
    expect(wrapper.emitted('close')).toBeDefined();
  });

  it('will emit close event if the underlying dialog is closed', async () => {
    const wrapper = mount(RequestSignaturesDialog, opts);
    await wrapper.get('[data-testid="dialog-close-button"]').trigger('click');
    expect(wrapper.emitted('close')).toBeDefined();
  });
});
