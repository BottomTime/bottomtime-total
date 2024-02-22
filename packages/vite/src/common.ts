import {
  AdminSearchUsersResponseDTO,
  SearchDiveSitesResponseDTO,
  UserDTO,
} from '@bottomtime/api';

export type AppInitialState = {
  adminCurrentUser?: UserDTO;
  adminUsersList?: AdminSearchUsersResponseDTO;
  currentUser: UserDTO | null;
  diveSites?: SearchDiveSitesResponseDTO;
};

export type Breadcrumb = {
  label: string | (() => string);
  to?: string;
  active?: boolean;
};

export type SelectOption = {
  disabled?: boolean;
  label?: string;
  value: string;
};

export type TabInfo = {
  key: string;
  label: string;
  disabled?: boolean;
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
