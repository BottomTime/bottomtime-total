import { InjectionKey } from 'vue';
import { Store } from 'vuex';

import { BTState } from '@/store';
import { ErrorHandlingHOF } from '@/helpers/create-error-handler';
import { UserManager } from '@/users';
import { DiveSiteManager } from './diveSites';

export const DiveSiteManagerKey: InjectionKey<DiveSiteManager> =
  Symbol('DiveSiteManager');
export const StoreKey: InjectionKey<Store<BTState>> = Symbol('Store');
export const UserManagerKey: InjectionKey<UserManager> = Symbol('UserManager');
export const WithErrorHandlingKey: InjectionKey<ErrorHandlingHOF> =
  Symbol('withErrorHandling');
