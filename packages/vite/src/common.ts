import { UserDTO } from '@bottomtime/api';

export type AppInitialState = {
  adminCurrentUser?: UserDTO;
  currentUser: UserDTO | null;
};

export type Breadcrumb = {
  label: string | (() => string);
  to?: string;
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
