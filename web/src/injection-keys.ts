import { InjectionKey } from 'vue';
import { Store } from 'vuex';
import { ErrorHandlingHOF } from './helpers/create-error-handler';
import { BTState } from './store';
import { UserManager } from './users';

export const StoreKey: InjectionKey<Store<BTState>> = Symbol('Store');
export const UserManagerKey: InjectionKey<UserManager> = Symbol('UserManager');
export const WithErrorHandlingKey: InjectionKey<ErrorHandlingHOF> =
  Symbol('withErrorHandling');
