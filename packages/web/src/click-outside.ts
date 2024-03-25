import { Directive, DirectiveBinding } from 'vue';

type HTMLElementWithClickOutside = HTMLElement & {
  clickOutsideEvent: (e: MouseEvent) => void;
};

export const clickOutside: Directive = {
  beforeMount: (el: HTMLElementWithClickOutside, binding: DirectiveBinding) => {
    el.clickOutsideEvent = (event) => {
      // here I check that click was outside the el and his children
      if (!(el == event.target || el.contains(event.target as Node))) {
        // and if it did, call method provided in attribute value
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted: (el: HTMLElementWithClickOutside) => {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};
