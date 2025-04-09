import { AccountTier, LogBookSharing, ProfileDTO } from '@bottomtime/api';

import { ComputedRef } from 'vue';

export type Breadcrumb = {
  label: string | ComputedRef<string>;
  to?: string | ComputedRef<string>;
  active?: boolean;
};

export type Coordinates = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const DateTimeFormat = 'yyyy-MMM-dd hh:mm:ss a';

export const DefaultProfile: ProfileDTO = {
  accountTier: AccountTier.Basic,
  logBookSharing: LogBookSharing.Private,
  memberSince: 0,
  username: '',
  userId: '',
};

export type Selectable<T> = T & { selected?: boolean };

export type SelectOption = {
  disabled?: boolean;
  label?: string;
  value: string;
};

export type TabInfo = {
  key: string;
  label: string;
  disabled?: boolean;
  visible?: boolean;
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

export const FortyEightHoursInSeconds = 48 * 60 * 60 * 1000;
