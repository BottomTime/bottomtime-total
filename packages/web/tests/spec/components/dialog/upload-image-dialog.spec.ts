import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { Coordinates } from '../../../../src/common';
import FileUpload from '../../../../src/components/common/file-upload.vue';
import ImageCropper from '../../../../src/components/common/image-cropper.vue';
import UploadImageDialog from '../../../../src/components/dialog/upload-image-dialog.vue';

describe('Upload Image dialog', () => {
  let opts: ComponentMountingOptions<typeof UploadImageDialog>;
  let image: Buffer;

  beforeAll(async () => {
    image = await readFile(resolve(__dirname, '../../../fixtures/floof.jpg'));
  });

  beforeEach(() => {
    opts = {
      props: {
        visible: true,
      },
      global: {
        stubs: { teleport: true },
      },
    };
  });

  it('will not render if visible prop is false', async () => {
    const wrapper = mount(UploadImageDialog, opts);
    await wrapper.setProps({ visible: false });
    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);
  });

  it('will mount show processing message if is-saving prop is set', async () => {
    const wrapper = mount(UploadImageDialog, opts);
    await wrapper.setProps({ isSaving: true });
    expect(wrapper.get('[data-testid="msg-processing-image"]').text()).toBe(
      'Processing image...',
    );
  });

  it('will allow image to be upload', async () => {
    const testUrl = 'test';
    const coords: Coordinates = {
      top: 100,
      left: 100,
      width: 300,
      height: 300,
    };
    global.URL.createObjectURL = jest.fn().mockReturnValue(testUrl);

    const file = new File([image], 'floof.jpg', { type: 'image/jpeg' });
    const files: FileList = {
      ...[file],
      length: 1,
      item: () => file,
    };

    const wrapper = mount(UploadImageDialog, opts);
    wrapper.getComponent(FileUpload).vm.$emit('change', files);
    await flushPromises();

    const imageCropper = wrapper.getComponent(ImageCropper);
    expect(imageCropper.isVisible()).toBe(true);
    expect(imageCropper.props('image')).toBe(testUrl);
    imageCropper.vm.$emit('change', coords);
    await flushPromises();

    expect(global.URL.createObjectURL).toHaveBeenCalled();

    await wrapper.get('[data-testid="btn-save-image"]').trigger('click');
    expect(wrapper.emitted('save')).toEqual([[file, coords]]);
  });

  it('will reset the file upload if the user changes their mind', async () => {
    const testUrl = 'test';
    const coords: Coordinates = {
      top: 100,
      left: 100,
      width: 300,
      height: 300,
    };
    const revokeSpy = jest.fn().mockReturnValue(undefined);
    global.URL.createObjectURL = jest.fn().mockReturnValue(testUrl);
    global.URL.revokeObjectURL = revokeSpy;

    const file = new File([image], 'floof.jpg', { type: 'image/jpeg' });
    const files: FileList = {
      ...[file],
      length: 1,
      item: () => file,
    };

    const wrapper = mount(UploadImageDialog, opts);

    wrapper.getComponent(FileUpload).vm.$emit('change', files);
    await flushPromises();

    wrapper.getComponent(ImageCropper).vm.$emit('change', coords);
    await flushPromises();

    await wrapper.get('[data-testid="btn-change-image"]').trigger('click');
    expect(revokeSpy).toHaveBeenCalledWith(testUrl);
    expect(wrapper.findComponent(ImageCropper).exists()).toBe(false);
    expect(wrapper.findComponent(FileUpload).isVisible()).toBe(true);
  });

  it('will allow user to cancel out of the dialog', async () => {
    const wrapper = mount(UploadImageDialog, opts);
    await wrapper.get('[data-testid="btn-cancel-image"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeDefined();
  });
});
