import { inject as vueInject, InjectionKey } from 'vue';

export function inject<T>(key: InjectionKey<T>): T {
  const dep = vueInject(key);

  if (!dep) {
    throw new Error(
      `Unable to inject dependency "${key.description}". Object was not provided. Please check application initialization code.`,
    );
  }

  return dep;
}
