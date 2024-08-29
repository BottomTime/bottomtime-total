import { Feature } from '@bottomtime/common';

import { User as ConfigCatUser, IConfigCatClient } from 'configcat-common';
import { InjectionKey, Reactive, UnwrapRef, inject, reactive } from 'vue';

import { useCurrentUser } from './store';

export const FeaturesServiceKey: InjectionKey<IConfigCatClient> =
  Symbol('FeaturesService');

export type FeatureValue<T extends string | number | boolean> = Reactive<{
  isLoading: boolean;
  value: T;
}>;

export function useFeature<T extends string | number | boolean>(
  feature: Feature<T>,
): FeatureValue<T> {
  const instance = reactive<FeatureValue<T>>({
    isLoading: true,
    value: feature.defaultValue as UnwrapRef<T>,
  });

  const currentUser = useCurrentUser();
  const client = inject(FeaturesServiceKey);
  if (!client) {
    throw new Error(
      'FeaturesService has not been initialized. Did you remember to call `app.provide(key, client)`?',
    );
  }

  const user: ConfigCatUser | undefined = currentUser.user
    ? new ConfigCatUser(currentUser.user.id, currentUser.user.email)
    : undefined;

  client
    .getValueAsync<T>(feature.key, feature.defaultValue, user)
    .then((flag) => {
      instance.value = flag as UnwrapRef<UnwrapRef<T>>;
    })
    .catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error(err);
    })
    .finally(() => {
      instance.isLoading = false;
    });

  client.on('configChanged', (newConfig) => {
    const newValue = newConfig.settings[feature.key]?.value;
    if (newValue !== undefined) {
      instance.value = newValue as UnwrapRef<UnwrapRef<T>>;
    }
  });

  return instance as FeatureValue<T>;
}
