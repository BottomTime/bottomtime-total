import RegisterForm from '@/components/users/register-form.vue';
import { mount } from '@vue/test-utils';

describe('Registration form', () => {
  it('will fail validation on required fields', () => {
    const wrapper = mount(RegisterForm);
  });
});
