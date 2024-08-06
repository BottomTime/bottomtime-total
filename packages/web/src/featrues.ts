import { Feature } from '@bottomtime/common';

import { User as ConfigCatUser, IConfigCatClient } from 'configcat-common';
import { InjectionKey, Ref, inject, ref } from 'vue';

import { useCurrentUser } from './store';

export const FeaturesServiceKey: InjectionKey<IConfigCatClient> =
  Symbol('FeaturesService');

export type FeatureValue<T> = {
  isLoading: Ref<boolean>;
  value: Ref<T>;
};

export function useFeatureToggle(
  feature: Feature<boolean>,
): FeatureValue<boolean> {
  const isLoading = ref(true);
  const value = ref(feature.defaultValue);

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
    .getValueAsync<boolean>(feature.key, feature.defaultValue, user)
    .then((flag) => {
      value.value = flag;
    })
    .catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error(err);
    })
    .finally(() => {
      isLoading.value = false;
    });

  client.on('configChanged', (newConfig) => {
    const newValue = newConfig.settings[feature.key]?.value;
    if (typeof newValue === 'boolean') value.value = newValue;
  });

  return { isLoading, value };
}
