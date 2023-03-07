import { Toast } from '@/helpers';
import { User } from '@/users';

export interface BTState {
  currentUser?: User;
  toasts: {
    [id: string]: Toast;
  };
}
