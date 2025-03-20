import { Feature } from '@bottomtime/common';

import { User as ConfigCatUser, IConfigCatClient } from 'configcat-common';
import { InjectionKey, Reactive, inject, reactive } from 'vue';

import { useLogger } from './logger';
import { useCurrentUser } from './store';

const log = useLogger('features');

export const FeaturesServiceKey: InjectionKey<IConfigCatClient> =
  Symbol('FeaturesService');

export type FeatureValue = Reactive<{
  isLoading: boolean;
  value: boolean;
}>;

export function useFeatureToggle(feature: Feature<boolean>): FeatureValue {
  const instance = reactive<FeatureValue>({
    isLoading: true,
    value: feature.defaultValue,
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
    .getValueAsync(feature.key, feature.defaultValue, user)
    .then((flag) => {
      instance.value = flag;
    })
    .catch((err) => {
      log.error(err);
    })
    .finally(() => {
      instance.isLoading = false;
    });

  client.on('configChanged', (newConfig) => {
    const newValue = newConfig.settings[feature.key]?.value;
    if (newValue !== undefined) {
      instance.value = newValue as boolean;
    }
  });

  return instance;
}
