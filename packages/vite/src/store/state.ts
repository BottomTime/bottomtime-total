import { CurrentUserDTO } from '@bottomtime/api';
import { Toast } from '../common';

export type ToastWithTimer = Toast & { timer: NodeJS.Timeout };

export type BTState = {
  currentUser: CurrentUserDTO;
  toasts: Record<string, ToastWithTimer>;
};
