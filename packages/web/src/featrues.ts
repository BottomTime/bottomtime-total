import { Feature, FlagValue } from '@bottomtime/common';

import { User as ConfigCatUser, IConfigCatClient } from 'configcat-common';
import { InjectionKey, Ref, UnwrapRef, inject, ref } from 'vue';

import { useCurrentUser } from './store';

export const FeaturesServiceKey: InjectionKey<IConfigCatClient> =
  Symbol('FeaturesService');

export function useFeature<T extends FlagValue>(
  feature: Feature<T>,
): { isLoading: Ref<boolean>; value: Ref<T> } {
  const isLoading = ref(true);
  const value = ref<T>(feature.defaultValue);

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
      value.value = flag as UnwrapRef<T>;
    })
    .catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error(err);
    })
    .finally(() => {
      isLoading.value = false;
    });

  return { isLoading, value: value as Ref<T> };
}
