import { mount } from '@vue/test-utils';

import PrivacyPolicyView from '@/views/PrivacyPolicyView.vue';

describe('Privacy Policy View', () => {
  it('Will mount', () => {
    mount(PrivacyPolicyView);
  });
});
