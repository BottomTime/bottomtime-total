import { InjectionKey } from 'vue';
import { ErrorHandlingHOF } from './helpers/create-error-handler';
import { UserManager } from './users';

export const WithErrorHandlingKey: InjectionKey<ErrorHandlingHOF> =
  Symbol('withErrorHandling');
export const UserManagerKey: InjectionKey<UserManager> = Symbol('UserManager');
