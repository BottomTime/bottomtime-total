import { InjectionKey } from 'vue';
import { Store } from 'vuex';

import { ApiClient } from './client';
import { BTState } from '@/store';
import { ErrorHandlingHOF } from '@/helpers/create-error-handler';

export const ApiClientKey: InjectionKey<ApiClient> = Symbol('ApiClient');
export const StoreKey: InjectionKey<Store<BTState>> = Symbol('Store');
export const WithErrorHandlingKey: InjectionKey<ErrorHandlingHOF> =
  Symbol('withErrorHandling');
