import { Toast } from '@/helpers';
import { User } from '@/client/users';

export interface BTState {
  currentUser?: User;
  toasts: {
    [id: string]: Toast;
  };
}
