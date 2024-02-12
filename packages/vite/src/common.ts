import { UserDTO } from '@bottomtime/api';

export type AppInitialState = {
  currentUser: UserDTO | null;
  SSR: boolean;
};

export type SelectOption = {
  disabled?: boolean;
  label?: string;
  value: string;
};

export type TabInfo = {
  key: string;
  label: string;
};

export enum ToastType {
  Error = 'error',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
}

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};
